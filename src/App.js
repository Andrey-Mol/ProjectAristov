import React from "react";
import {
    BrowserRouter,
    Routes,
    Route,
    NavLink,
} from "react-router-dom";
import TabsPage from './pages/TabsPage';
import DraggableTabs from './pages/DraggableTabs';
import ModalTab from "./components/ModalTab";
import ModalArrow from "./components/ModalArrow";
import ConfirmationModal from "./components/ConfirmationModal";
import { v4 as uuidv4 } from 'uuid';
import './style/App.css';

// Главный компонент приложения
export default class App extends React.Component {
    constructor(props) {
        super(props);
        // Инициализация состояния
        this.state = {
            tabs: [], // Список всех вкладок
            arrows: [], // Список всех стрелок
            tabPositions: [], // Координаты блоков вкладок

            // Модальные окна
            modalTab: null, // Модальное окно для вкладки
            modalArrow: null, // Модальное окно для стрелки
            confirmationModal: null // Модальное окно подтверждения
        };
    }

    // Метод вызывается после монтирования компонента
    componentDidMount() {
        // Получаем сохраненные данные из localStorage
        const savedTabs = localStorage.getItem('tabs');
        const savedArrows = localStorage.getItem('arrows');
        const savedTabPositions = localStorage.getItem('tabPositions');

        // Устанавливаем состояние, если данные найдены
        if (savedTabs) {
            this.setState({ tabs: JSON.parse(savedTabs) });
        }
        if (savedArrows) {
            this.setState({ arrows: JSON.parse(savedArrows) });
        }
        if (savedTabPositions) {
            this.setState({ tabPositions: JSON.parse(savedTabPositions) });
        }
    }

    // Установка вкладок в состояние и localStorage
    setTabs = (newValue) => {
        this.setState({ tabs: newValue }, () => {
            localStorage.setItem('tabs', JSON.stringify(newValue));
        });
    }

    // Установка стрелок в состояние и localStorage
    setArrows = (newValue) => {
        this.setState({ arrows: newValue }, () => {
            localStorage.setItem('arrows', JSON.stringify(newValue));
        });
    }

    // Очистка данных во вкладке
    cleanTab = (id) => {
        const updatedTabs = this.state.tabs.map(tab =>
            tab.id === id ? { ...tab, data: [] } : tab
        );
        this.setTabs(updatedTabs);
    }

    // Установка позиций вкладок в состояние и localStorage
    setTabPositions = (newValue) => {
        this.setState({ tabPositions: newValue }, () => {
            localStorage.setItem('tabPositions', JSON.stringify(newValue));
        });
    }

    // Добавление новой вкладки
    addTab = () => {
        const newTab = { id: uuidv4(), name: `Вкладка ${this.state.tabs.length + 1}`, data: [], incomingData: [] };
        const newPosition = { id: newTab.id, x: 100 + this.state.tabs.length * 50, y: 100 };
        const updatedTabs = [...this.state.tabs, newTab];
        const updatedPositions = [...this.state.tabPositions, newPosition];
        this.setTabs(updatedTabs);
        this.setTabPositions(updatedPositions);
    };

    // Переименование вкладки
    renameTab = (id, newName) => {
        const updatedTabs = this.state.tabs.map(tab => tab.id === id ? { ...tab, name: newName } : tab);
        this.setTabs(updatedTabs);
    };

    // Удаление вкладки
    deleteTab = (id) => {
        const updatedTabs = this.state.tabs.filter(tab => tab.id !== id);
        const updatedPositions = this.state.tabPositions.filter(pos => pos.id !== id);
        const updatedArrows = this.state.arrows.filter(arrow => arrow.from !== id && arrow.to !== id);
        this.setTabs(updatedTabs);
        this.setTabPositions(updatedPositions);
        this.setArrows(updatedArrows);
    };

    // Обновление стрелки
    updateArrow = (arrowId, updatedArrow) => {
        const updatedArrows = this.state.arrows.map(arrow => arrow.id === arrowId ? updatedArrow : arrow);
        this.setArrows(updatedArrows, () => {
            this.updateDependentData();
        });
    };

    // Обновление позиции вкладки
    updateTabPosition = (id, x, y) => {
        const updatedPositions = this.state.tabPositions.map(pos => pos.id === id ? { ...pos, x, y } : pos);
        this.setTabPositions(updatedPositions);
    };

    // Обновление конца стрелки
    updateArrowEnd = (arrowId, endX, endY) => {
        const arrowIndex = this.state.arrows.findIndex(arrow => arrow.id === arrowId);
        if (arrowIndex !== -1) {
            const updatedArrow = {
                ...this.state.arrows[arrowIndex],
                endX,
                endY,
            };
            const updatedArrows = [...this.state.arrows];
            updatedArrows[arrowIndex] = updatedArrow;
            this.setArrows(updatedArrows, this.updateDependentData);
        }
    };

    // Открытие модального окна для вкладки
    openModalTab = (tab) => {
        this.setState({ modalTab: tab });
    };

    // Закрытие модального окна для вкладки
    closeModalTab = () => {
        this.setState({ modalTab: null });
    };

    // Открытие модального окна для стрелки
    openModalArrow = (arrow) => {
        const fromTab = this.state.tabs.find(tab => tab.id === arrow.from);
        const incomingData = fromTab ? fromTab.incomingData : [];
        this.setState({ modalArrow: { ...arrow, incomingData } });
    };

    // Закрытие модального окна для стрелки
    closeModalArrow = () => {
        this.setState({ modalArrow: null });
    };

    // Открытие модального окна подтверждения
    openConfirmationModal = (message, onConfirm) => {
        this.setState({ confirmationModal: { message, onConfirm } });
    };

    // Закрытие модального окна подтверждения
    closeConfirmationModal = () => {
        this.setState({ confirmationModal: null });
    };

    // Обновление входящих данных вкладок на основе стрелок
    updateDependentData = () => {
        const { arrows, tabs } = this.state;

        // Создаем копию tabs с обнуленными incomingData
        let updatedTabs = tabs.map(tab => ({
            ...tab,
            incomingData: [],
        }));

        // Функция для получения входящих данных для конкретной вкладки
        const getIncomingData = (tabId, traversedArrows = new Set()) => {
            let incomingData = [];
            arrows.forEach(arrow => {
                if (arrow.to === tabId && !traversedArrows.has(arrow.id)) {
                    traversedArrows.add(arrow.id); // Помечаем стрелку как обработанную
                    const fromTab = updatedTabs.find(tab => tab.id === arrow.from);
                    if (fromTab) {
                        const selectedData = arrow.selectedData || [];
                        incomingData.push(...selectedData);
                    }
                }
            });
            return incomingData;
        };

        // Обновляем все вкладки
        updatedTabs = updatedTabs.map(tab => ({
            ...tab,
            incomingData: getIncomingData(tab.id),
        }));

        this.setTabs(updatedTabs);
    };

    // Обновление данных стрелки
    updateArrowData = (arrowId, updatedArrow) => {
        this.setArrows(this.state.arrows.map(arrow => (arrow.id === arrowId ? updatedArrow : arrow)));
        this.updateBlockDataBasedOnArrows(updatedArrow);
    };

    // Обновление данных вкладки на основе стрелок
    updateBlockDataBasedOnArrows = (arrow) => {
        const { to, selectedData } = arrow;
        this.setTabs(this.state.tabs.map(tab => {
            if (tab.id === to && to != null) {
                return {
                    ...tab,
                    incomingData: [
                        ...tab.incomingData.filter(data => data.arrowId !== arrow.id),
                        ...selectedData.map(data => ({ ...data, arrowId: arrow.id }))
                    ]
                };
            }
            return tab;
        }));
    };

    // Расчет данных вкладки
    calculateTab = (tabId) => {
        const tab = this.state.tabs.find(tab => tab.id === tabId);

        if (tab) {
            const allData = [...tab.incomingData, ...tab.data];
            const total = allData.reduce((sum, row) => sum + parseFloat(row.col2 || 0), 0);
            const newData = tab.data.map(row => ({
                ...row,
                col3: (parseFloat(row.col2 || 0) / total * 100).toFixed(2)
            }));

            const updatedTabs = this.state.tabs.map(t =>
                t.id === tabId ? { ...t, data: newData } : t
            );

            this.setState({ tabs: updatedTabs }, () => {
                this.updateDependentData();
            });
        }
    };

    // Удаление данных стрелки из вкладки
    removeArrowData = (arrow) => {
        const { to, id } = arrow;
        this.setTabs(this.state.tabs.map(tab => {
            if (tab.id === to) {
                return {
                    ...tab,
                    incomingData: tab.incomingData.filter(data => data.arrowId !== id)
                };
            }
            return tab;
        }));
    };

    // Удаление стрелки
    deleteArrow = (arrowId) => {
        const deletedArrow = this.state.arrows.find(arrow => arrow.id === arrowId);
        const updatedArrows = this.state.arrows.filter(arrow => arrow.id !== arrowId);
        console.log(this.state.tabs, this.state.arrows)
        this.setArrows(updatedArrows);
        this.removeArrowData(deletedArrow);
        this.closeModalArrow();
    };

    // Обновление данных вкладки
    updateTabData = (tabId, newData) => {
        const updatedTabs = this.state.tabs.map(tab =>
            tab.id === tabId ? { ...tab, data: newData } : tab
        );
        this.setTabs(updatedTabs);
    };

    // Сброс всех данных
    resetData = () => {
        this.setState({
            tabs: [],
            arrows: [],
            tabPositions: []
        }, () => {
            localStorage.removeItem('tabs');
            localStorage.removeItem('arrows');
            localStorage.removeItem('tabPositions');
        });
    }

    // Рендеринг компонента
    render() {
        const { tabs, arrows, tabPositions, modalTab, modalArrow, confirmationModal } = this.state;

        return (
            <BrowserRouter>
                <div className="Nav">
                    <NavLink to="/">Страница с вкладками</NavLink>
                    <NavLink to="/list">Произвольное размещение</NavLink>
                </div>
                <Routes>
                    <Route
                        path="/"
                        element={
                            <TabsPage
                                tabs={tabs}
                                arrows={arrows}
                                setTabs={this.setTabs}
                                setArrows={this.setArrows}
                                addTab={this.addTab}
                                openModalTab={this.openModalTab}
                                updateTabData={this.updateTabData}
                                calculateTab={this.calculateTab}
                                cleanTab={(id) => this.openConfirmationModal('Вы уверены, что хотите очистить все данные в этой вкладке?', () => this.cleanTab(id))}
                            />
                        }
                    />
                    <Route
                        path="/list"
                        element={
                            <DraggableTabs
                                tabs={tabs}
                                arrows={arrows}
                                tabPositions={tabPositions}
                                setTabs={this.setTabs}
                                setArrows={this.setArrows}
                                setTabPositions={this.setTabPositions}
                                updateTabPosition={this.updateTabPosition}
                                addTab={this.addTab}
                                updateArrowEnd={this.updateArrowEnd}
                                updateArrow={this.updateArrow}
                                openModalTab={this.openModalTab}
                                openModalArrow={this.openModalArrow}
                            />
                        }
                    />
                </Routes>
                {modalTab && (
                    <ModalTab
                        block={modalTab}
                        closeModal={this.closeModalTab}
                        renameBlock={this.renameTab}
                        deleteBlock={(id) => this.openConfirmationModal('Вы уверены, что хотите удалить этот блок?', () => this.deleteTab(id))}
                        cleanTab={(id) => this.openConfirmationModal('Вы уверены, что хотите очистить все данные в этом блоке?', () => this.cleanTab(id))}
                    />
                )}
                {modalArrow && (
                    <ModalArrow arrow={modalArrow}
                                blockData={tabs.find(tab => tab.id === modalArrow.from)?.data || []}
                                incomingData={modalArrow.incomingData || []}
                                closeModal={this.closeModalArrow}
                                updateArrowData={this.updateArrowData}
                                deleteArrow={(id) => this.openConfirmationModal('Вы уверены, что хотите удалить эту стрелку?', () => this.deleteArrow(id))}
                    />
                )}
                {confirmationModal && (
                    <ConfirmationModal
                        message={confirmationModal.message}
                        onConfirm={() => { confirmationModal.onConfirm(); this.closeConfirmationModal(); }}
                        onCancel={this.closeConfirmationModal}
                    />
                )}
                <div className="fixed-bottom">
                    <button
                        onClick={() => this.openConfirmationModal('Вы уверены, что хотите очистить все данные?', this.resetData)}
                    >
                        Очистить данные
                    </button>
                </div>
            </BrowserRouter>
        );
    }
}

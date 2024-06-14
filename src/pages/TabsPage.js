import React, { Component } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import TabTable from '../components/TabTable';

// Определяем тип элемента для перетаскивания
const ItemType = 'TAB';

// Компонент для вкладки
const Tab = ({ tab, index, moveTab, setActiveTab, activeTab, openModalTab }) => {
    // useDrag используется для реализации перетаскивания элемента
    const [, ref] = useDrag({
        type: ItemType,
        item: { index },
    });

    // useDrop используется для обработки сброса элемента на новое место
    const [, drop] = useDrop({
        accept: ItemType,
        hover: (draggedItem) => {
            if (draggedItem.index !== index) {
                // Меняем вкладки местами
                moveTab(draggedItem.index, index);
                draggedItem.index = index;
            }
        },
    });

    return (
        <div
            ref={(node) => ref(drop(node))} // Объединяем ref для перетаскивания и сброса
            onClick={() => setActiveTab(tab.id)} // Устанавливаем активную вкладку при клике
            className={`TabButton ${tab.id === activeTab && 'active'}`} // Добавляем класс для активной вкладки
            onDoubleClick={() => openModalTab(tab.id)} // Открываем модальное окно при двойном клике
        >
            {tab.name}
        </div>
    );
};

// Основной компонент страницы с вкладками
export default class TabsPage extends Component {
    constructor(props) {
        super(props);
        // Инициализация состояния
        this.state = {
            activeTab: 1, // Активная вкладка по умолчанию
        };
        this.handleDoubleClick = this.handleDoubleClick.bind(this);
        this.moveTab = this.moveTab.bind(this);
        this.setActiveTab = this.setActiveTab.bind(this);
        this.calculateTab = this.calculateTab.bind(this);
        this.updateTabData = this.updateTabData.bind(this);
    }

    // Обработка двойного клика для открытия модального окна
    handleDoubleClick(id) {
        const tab = this.props.tabs.find((tab) => tab.id === id);
        this.props.openModalTab(tab);
    }

    // Перемещение вкладки
    moveTab(fromIndex, toIndex) {
        const tabs = [...this.props.tabs];
        const [movedTab] = tabs.splice(fromIndex, 1); // Удаляем вкладку из старого места
        tabs.splice(toIndex, 0, movedTab); // Вставляем вкладку в новое место
        this.props.setTabs(tabs); // Обновляем состояние вкладок
    }

    // Установка активной вкладки
    setActiveTab(id) {
        this.setState({ activeTab: id });
    }

    // Расчет данных вкладки
    calculateTab = (tabId) => {
        this.props.calculateTab(tabId);
    }

    // Обновление данных вкладки
    async updateTabData(tabId, newData) {
        await this.props.setTabs(this.props.tabs.map(tab =>
            tab.id === tabId ? { ...tab, data: newData } : tab
        ));
        this.calculateTab(this.state.activeTab);
    }

    // Обновление данных всех вкладок и стрелок
    updateAllTabs = (updatedRow, action) => {
        const { tabs, setTabs, arrows, setArrows } = this.props;
        const updatedTabs = tabs.map(tab => {
            if (tab.incomingData !== null) {
                const updatedIncomingData = tab.incomingData.map(row =>
                    row.id === updatedRow.id ? updatedRow : row
                );
                if (action === 'update') {
                    return {
                        ...tab,
                        incomingData: updatedIncomingData
                    };
                } else if (action === 'delete') {
                    return {
                        ...tab,
                        incomingData: updatedIncomingData.filter(row => row.id !== updatedRow.id)
                    };
                }
            }
            return tab;
        });
        const updatedArrows = arrows.map(arrow => {
            if (arrow.from !== null) {
                const updatedIncomingData = arrow.incomingData
                    ? arrow.incomingData.map(row =>
                        row.id === updatedRow.id ? updatedRow : row
                    )
                    : [];
                const updatedSelectedData = arrow.selectedData
                    ? arrow.selectedData.map(row =>
                        row.id === updatedRow.id ? updatedRow : row
                    )
                    : [];

                if (action === 'update') {
                    return {
                        ...arrow,
                        incomingData: arrow.incomingData ? updatedIncomingData : arrow.incomingData,
                        selectedData: arrow.selectedData ? updatedSelectedData : arrow.selectedData
                    };
                } else if (action === 'delete') {
                    return {
                        ...arrow,
                        incomingData: arrow.incomingData
                            ? updatedIncomingData.filter(row => row.id !== updatedRow.id)
                            : arrow.incomingData,
                        selectedData: arrow.selectedData
                            ? updatedSelectedData.filter(row => row.id !== updatedRow.id)
                            : arrow.selectedData
                    };
                }
            }
            return arrow;
        });
        setArrows(updatedArrows);
        setTabs(updatedTabs);
    };

    // Рендеринг компонента
    render() {
        const { tabs } = this.props;
        const { activeTab } = this.state;

        // Получение данных активной вкладки
        const activeTabData = tabs.find(tab => tab.id === activeTab);

        return (
            <DndProvider backend={HTML5Backend}>
                <div className="TabBar">
                    {tabs.map((tab, index) => (
                        <Tab
                            key={tab.id}
                            index={index}
                            tab={tab}
                            moveTab={this.moveTab}
                            setActiveTab={this.setActiveTab}
                            activeTab={activeTab}
                            openModalTab={this.handleDoubleClick}
                        />
                    ))}
                    <div className="AddTabButton" onClick={this.props.addTab}>
                        +
                    </div>
                </div>
                <button onClick={() => this.calculateTab(activeTab)}>Рассчитать вкладку</button>
                {activeTabData && (
                    <TabTable tab={activeTabData} updateTabData={this.updateTabData} updateAllTabs={this.updateAllTabs} cleanTab={this.props.cleanTab} />
                )}
            </DndProvider>
        );
    }
}

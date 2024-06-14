import React, { Component } from 'react';
import { Rnd } from 'react-rnd'; // Импортируем библиотеку для реализации перетаскиваемых и изменяемых по размеру элементов
import { v4 as uuidv4 } from 'uuid'; // Импортируем библиотеку для генерации уникальных идентификаторов
import '../style/DraggableTabs.css'; // Импортируем CSS для стилизации

class DraggableTabs extends Component {
    constructor(props) {
        super(props);
        // Храним ссылки на DOM-элементы вкладок
        this.tabRefs = {};
        // Инициализируем состояние
        this.state = {
            draggingEnd: null, // Информация о перетаскиваемом конце стрелки
            draggingBody: null, // Информация о перетаскиваемом теле стрелки
            startDragX: 0, // Начальная координата X для перетаскивания
            startDragY: 0, // Начальная координата Y для перетаскивания
            tabSizes: {} // Хранение размеров вкладок
        };
    }

    // Обновляем размеры вкладок, когда изменяются пропсы
    componentDidUpdate(prevProps) {
        if (prevProps.tabs !== this.props.tabs) {
            this.updateAllTabSizes();
        }
    }

    // Обновляем размеры всех вкладок
    updateAllTabSizes = () => {
        const { tabs } = this.props;
        tabs.forEach(tab => {
            const tabRef = this.tabRefs[tab.id];
            if (tabRef) {
                const rect = tabRef.getBoundingClientRect();
                this.updateTabSize(tab.id, { width: rect.width, height: rect.height });
            }
        });
    }

    // Обновляем размер конкретной вкладки в состоянии
    updateTabSize = (tabId, size) => {
        this.setState(prevState => ({
            tabSizes: {
                ...prevState.tabSizes,
                [tabId]: size
            }
        }));
    }

    // Обновляем размеры вкладок при монтировании компонента и добавляем обработчики событий
    componentDidMount() {
        this.updateAllTabSizes();
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
    }

    // Удаляем обработчики событий при размонтировании компонента
    componentWillUnmount() {
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
    }

    // Обработка движения мыши для перетаскивания стрелок
    handleMouseMove = (e) => {
        const { draggingEnd, draggingBody, startDragX, startDragY } = this.state;
        if (draggingEnd || draggingBody) {
            const deltaX = e.clientX - startDragX;
            const deltaY = e.clientY - startDragY;

            this.setState({ startDragX: e.clientX, startDragY: e.clientY });

            if (draggingEnd) {
                const { arrowId, isEnd } = draggingEnd;
                const arrowIndex = this.props.arrows.findIndex((arrow) => arrow.id === arrowId);
                if (arrowIndex !== -1) {
                    const arrow = this.props.arrows[arrowIndex];
                    const newCoords = isEnd
                        ? { endX: arrow.endX + deltaX, endY: arrow.endY + deltaY, to: null }
                        : { startX: arrow.startX + deltaX, startY: arrow.startY + deltaY, from: null };

                    this.props.updateArrow(arrowId, { ...arrow, ...newCoords });
                }
            } else if (draggingBody) {
                const arrowIndex = this.props.arrows.findIndex((arrow) => arrow.id === draggingBody);
                if (arrowIndex !== -1) {
                    const arrow = this.props.arrows[arrowIndex];
                    this.props.updateArrow(draggingBody, {
                        ...arrow,
                        startX: arrow.startX + deltaX,
                        startY: arrow.startY + deltaY,
                        endX: arrow.endX + deltaX,
                        endY: arrow.endY + deltaY,
                        from: null,
                        to: null
                    });
                }
            }
        }
    };

    // Обработка отпускания мыши при перетаскивании
    handleMouseUp = () => {
        const { draggingEnd } = this.state;
        if (draggingEnd) {
            const { arrowId, isEnd } = draggingEnd;
            const arrowIndex = this.props.arrows.findIndex((arrow) => arrow.id === arrowId);
            if (arrowIndex !== -1) {
                const arrow = this.props.arrows[arrowIndex];
                const coords = isEnd ? { x: arrow.endX, y: arrow.endY } : { x: arrow.startX, y: arrow.startY };
                const tabUnderArrow = this.getTabUnderCoords(coords);
                if (tabUnderArrow) {
                    const nearestPoint = this.getNearestPointOnTab(tabUnderArrow, coords);
                    this.props.setArrows(this.props.arrows.map(arrow => {
                        if (arrow.id === arrowId) {
                            if (isEnd) {
                                return { ...arrow, endX: nearestPoint.x, endY: nearestPoint.y, to: tabUnderArrow.id };
                            } else {
                                return { ...arrow, startX: nearestPoint.x, startY: nearestPoint.y, from: tabUnderArrow.id };
                            }
                        }
                        return arrow;
                    }));
                }
            }
        }
        this.setState({ draggingEnd: null, draggingBody: null });
    };

    // Добавление новой вкладки
    handleAddTab = () => {
        this.props.addTab();
    };

    // Добавление новой стрелки
    handleAddArrow = () => {
        const newArrow = { id: uuidv4(), from: null, to: null,
            startX: 200 + this.props.arrows.length * 50,
            startY: 200,
            endX: 300 + this.props.arrows.length * 50,
            endY: 300};
        this.props.setArrows([...this.props.arrows, newArrow]);
    };

    // Получение вкладки под заданными координатами
    getTabUnderCoords = ({ x, y }) => {
        const { tabPositions } = this.props;
        const { tabSizes } = this.state;
        return tabPositions.find(pos => {
            const size = tabSizes[pos.id] || { width: 100, height: 50 };
            return (
                x >= pos.x && x <= pos.x + size.width &&
                y >= pos.y && y <= pos.y + size.height
            );
        });
    };

    // Получение ближайшей точки на вкладке к заданным координатам
    getNearestPointOnTab = (tab, coords) => {
        const tabRef = this.tabRefs[tab.id];
        if (!tabRef) return coords;

        const rect = tabRef.getBoundingClientRect();
        const { width, height } = rect;

        const midPoints = [
            { x: tab.x + width / 2, y: tab.y }, // Верхняя середина
            { x: tab.x + width / 2, y: tab.y + height - 1 }, // Нижняя середина
            { x: tab.x, y: tab.y + height / 2 }, // Левая середина
            { x: tab.x + width - 1, y: tab.y + height / 2 } // Правая середина
        ];

        let nearestPoint = midPoints[0];
        let minDistance = this.getDistance(midPoints[0], coords);

        midPoints.forEach(point => {
            const distance = this.getDistance(point, coords);
            if (distance < minDistance) {
                nearestPoint = point;
                minDistance = distance;
            }
        });

        return nearestPoint;
    };

    // Расчет расстояния между двумя точками
    getDistance = (point1, point2) => {
        return Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2);
    };

    // Отображение стрелки
    renderArrow = (arrow) => {
        const { tabPositions } = this.props;
        const startTab = arrow.from ? tabPositions.find(pos => pos.id === arrow.from) : null;
        const endTab = arrow.to ? tabPositions.find(pos => pos.id === arrow.to) : null;

        const startX = startTab ? this.getNearestPointOnTab(startTab, { x: arrow.startX, y: arrow.startY }).x : arrow.startX;
        const startY = startTab ? this.getNearestPointOnTab(startTab, { x: arrow.startX, y: arrow.startY }).y : arrow.startY;
        const endX = endTab ? this.getNearestPointOnTab(endTab, { x: arrow.endX, y: arrow.endY }).x : arrow.endX;
        const endY = endTab ? this.getNearestPointOnTab(endTab, { x: arrow.endX, y: arrow.endY }).y : arrow.endY;

        return (
            <g key={arrow.id}>
                <line
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke="black"
                    strokeWidth="3"
                    markerEnd="url(#arrowhead)"
                    onMouseDown={(e) => this.setState({ draggingBody: arrow.id, startDragX: e.clientX, startDragY: e.clientY })}
                    onDoubleClick={() => this.props.openModalArrow(arrow)}
                />
                <circle
                    cx={startX}
                    cy={startY}
                    r={5}
                    fill="red"
                    onMouseDown={(e) => this.setState({ draggingEnd: { arrowId: arrow.id, isEnd: false }, startDragX: e.clientX, startDragY: e.clientY })}
                    onDoubleClick={() => this.props.openModalArrow(arrow)}
                />
                <circle
                    cx={endX}
                    cy={endY}
                    r={5}
                    fill="blue"
                    onMouseDown={(e) => this.setState({ draggingEnd: { arrowId: arrow.id, isEnd: true }, startDragX: e.clientX, startDragY: e.clientY })}
                    onDoubleClick={() => this.props.openModalArrow(arrow)}
                />
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 6" fill="black" />
                    </marker>
                </defs>
            </g>
        );
    };

    // Обработка остановки перетаскивания вкладки
    handleTabDragStop = (e, d, tabId) => {
        this.props.updateTabPosition(tabId, d.x, d.y);
        this.updateConnectedArrows(tabId, d.x, d.y);
    };

    // Обновление координат связанных стрелок при перемещении вкладки
    updateConnectedArrows = (tabId, x, y) => {
        const { arrows, tabPositions, updateArrow } = this.props;
        const tabPosition = tabPositions.find(pos => pos.id === tabId);

        if (tabPosition) {
            arrows.forEach(arrow => {
                let updated = false;
                const oppositeEndCoords = arrow.from === tabId
                    ? { x: arrow.endX, y: arrow.endY }
                    : { x: arrow.startX, y: arrow.startY };

                const nearestPoint = this.getNearestPointOnTab(tabPosition, oppositeEndCoords);

                if (arrow.from === tabId) {
                    arrow.startX = nearestPoint.x;
                    arrow.startY = nearestPoint.y;
                    updated = true;
                }
                if (arrow.to === tabId) {
                    arrow.endX = nearestPoint.x;
                    arrow.endY = nearestPoint.y;
                    updated = true;
                }
                if (updated) {
                    updateArrow(arrow.id, arrow);
                }
            });
        }
    };

    // Рендер компонента
    render() {
        const { tabs, arrows, tabPositions } = this.props;

        return (
            <div className="Container">
                <div className="Toolbar">
                    <button onClick={this.handleAddTab}>Добавить вкладку</button>
                    <button onClick={this.handleAddArrow}>Добавить стрелку</button>
                </div>
                <div className="WhiteSheet">
                    <svg className="ArrowsLayer">
                        {arrows.map(this.renderArrow)}
                    </svg>
                    {tabs.map((tab) => {
                        const position = tabPositions.find(pos => pos.id === tab.id);
                        return (
                            <Rnd
                                key={tab.id}
                                size={{ width: 'auto', height: 'auto' }}
                                position={{ x: position.x, y: position.y }}
                                onDragStop={(e, d) => this.handleTabDragStop(e, d, tab.id)}
                                bounds="parent"
                                onDoubleClick={() => this.props.openModalTab(tab)}
                                dragHandleClassName="TabItem"
                                disableResize // Отключаем изменение размера
                                default={{ x: position.x, y: position.y }}
                            >
                                <div className="TabItem" ref={ref => this.tabRefs[tab.id] = ref}>
                                    {tab.name}
                                    <div className="AttachmentPoint" style={{ top: '0', left: '50%' }}></div>
                                    <div className="AttachmentPoint" style={{ bottom: '0', top: '100%',left: '50%' }}></div>
                                    <div className="AttachmentPoint" style={{ top: '50%', left: '0' }}></div>
                                    <div className="AttachmentPoint" style={{ top: '50%',left: '100%', right: '0' }}></div>
                                </div>
                            </Rnd>
                        );
                    })}
                </div>
            </div>
        );
    }
}

export default DraggableTabs;

import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Импорт библиотеки для генерации уникальных идентификаторов
import '../style/ModalBlock.css'; // Подключение стилей

const ModalTab = ({ block, closeModal, renameBlock, deleteBlock, cleanTab }) => {
    // Использование хука useState для управления состоянием нового имени блока
    const [newName, setNewName] = useState(block.name);
    // Использование хука useState для управления состоянием видимости коэффициентов
    const [showCoefficients, setShowCoefficients] = useState(true);
    // Использование хука useRef для отслеживания ссылки на модальное окно
    const modalRef = useRef(null);

    // Использование хука useEffect для обработки кликов вне модального окна
    useEffect(() => {
        // Функция для закрытия модального окна при клике вне его области
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                closeModal();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [closeModal]);

    // Функция для сохранения нового имени блока
    const handleSave = () => {
        renameBlock(block.id, newName); // Переименование блока
        closeModal(); // Закрытие модального окна
    };

    // Функция для удаления блока
    const handleDelete = () => {
        deleteBlock(block.id); // Удаление блока
        closeModal(); // Закрытие модального окна
    };

    // Функция для очистки вкладки
    const clickClean = () => {
        cleanTab(block.id); // Очистка блока
        closeModal(); // Закрытие модального окна
    };

    // Функция для переключения видимости коэффициентов
    const toggleCoefficients = () => {
        setShowCoefficients(!showCoefficients);
    };

    // Объединение входящих данных и данных блока
    const allData = [...block.incomingData, ...block.data];
    // Подсчет общего содержания
    const totalContent = allData.reduce((sum, row) => sum + parseFloat(row.content || 0), 0);

    // Добавление коэффициентов к данным
    const dataWithCoefficients = allData.map(row => ({
        ...row,
        coefficient: (parseFloat(row.content || 0) / totalContent * 100).toFixed(2)
    }));

    // Нумерация строк
    const rows = dataWithCoefficients.map((row, index) => ({
        ...row,
        number: index + 1
    }));

    return (
        <div className="Modal">
            <div className="ModalContent" ref={modalRef}>
                <span className="Close" onClick={closeModal}>&times;</span>
                <div className="ModalHeader">
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                    />
                </div>
                <div className="Switch">
                    <label>
                        <input type="checkbox" checked={showCoefficients} onChange={toggleCoefficients} />
                        Показать коэффициенты
                    </label>
                </div>
                {rows.length > 0 ? (
                    <table className="MiniTable">
                        <thead>
                        <tr>
                            <th>№</th>
                            <th>Наименование компонента</th>
                            <th>Содержание (%)</th>
                            <th>Влажность (%)</th>
                            <th>Зольность (%)</th>
                            <th>Теплота сгорания (%)</th>
                            {showCoefficients && <th>Коэффициент извлечения</th>}
                        </tr>
                        </thead>
                        <tbody>
                        {rows.map((row, index) => (
                            <tr key={row.id || uuidv4()}>
                                <td>{row.number}</td>
                                <td>{row.name}</td>
                                <td>{row.content}</td>
                                <td>{row.moisture}</td>
                                <td>{row.ash}</td>
                                <td>{row.calorificValue}</td>
                                {showCoefficients && <td>{row.coefficient}</td>}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <div>Данные отсутствуют</div>
                )}
                <div className="ModalFooter">
                    <button onClick={handleSave}>Сохранить</button>
                    <button onClick={clickClean}>Очистить блок</button>
                    <button onClick={handleDelete}>Удалить блок</button>
                </div>
            </div>
        </div>
    );
};

export default ModalTab;

import React, { useState } from 'react';
import '../style/TabTable.css'; // Подключение стилей
import { v4 as uuidv4 } from 'uuid'; // Импорт библиотеки для генерации уникальных идентификаторов

const TabTable = ({ tab, updateTabData, updateAllTabs, cleanTab }) => {
    // Использование хука useState для управления состоянием новой строки
    const [newRow, setNewRow] = useState({
        id: uuidv4(),
        name: '',
        content: '',
        moisture: '',
        ash: '',
        calorificValue: '',
        extractionCoefficient: ''
    });

    // Использование хука useState для управления состоянием видимости коэффициента извлечения
    const [showExtractionCoefficient, setShowExtractionCoefficient] = useState(false);

    // Функция для обработки изменения значения в ячейке таблицы
    const handleInputChange = async (e, rowId, col) => {
        // Обновление строки с новым значением
        const updatedRow = { ...tab.data.find(row => row.id === rowId), [col]: e.target.value };
        // Обновление данных таблицы с новой строкой
        const updatedData = tab.data.map(row => row.id === rowId ? updatedRow : row);
        await updateTabData(tab.id, updatedData); // Обновление данных таблицы через функцию updateTabData
        updateAllTabs(updatedRow, 'update'); // Обновление всех вкладок через функцию updateAllTabs
    };

    // Функция для обработки изменения значения в новой строке
    const handleNewRowChange = (e, col) => {
        setNewRow({ ...newRow, [col]: e.target.value });
    };

    // Функция для добавления новой строки в таблицу
    const addNewRow = async () => {
        // Обновление данных таблицы с новой строкой
        const updatedData = [...tab.data, { ...newRow, id: uuidv4() }];
        await updateTabData(tab.id, updatedData); // Обновление данных таблицы через функцию updateTabData
        updateAllTabs(newRow, 'add'); // Обновление всех вкладок через функцию updateAllTabs
        // Сброс новой строки к начальному состоянию
        setNewRow({
            id: uuidv4(),
            name: '',
            content: '',
            moisture: '',
            ash: '',
            calorificValue: '',
            extractionCoefficient: ''
        });
    };

    // Функция для обработки нажатия клавиши Enter для добавления новой строки
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            addNewRow();
        }
    };

    // Функция для удаления строки из таблицы
    const deleteRow = async (rowId) => {
        const updatedRow = tab.data.find(row => row.id === rowId); // Найти строку для удаления
        const updatedData = tab.data.filter(row => row.id !== rowId); // Обновить данные таблицы, исключив удаляемую строку
        await updateTabData(tab.id, updatedData); // Обновление данных таблицы через функцию updateTabData
        updateAllTabs(updatedRow, 'delete'); // Обновление всех вкладок через функцию updateAllTabs
    };

    // Функция для переключения видимости коэффициента извлечения
    const toggleExtractionCoefficient = () => {
        setShowExtractionCoefficient(!showExtractionCoefficient);
    };

    // Функция для очистки вкладки
    const clickClean = () => {
        cleanTab(tab.id);
    };

    // Объединение входящих данных и данных таблицы
    const allData = [...tab.incomingData, ...tab.data];
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
        <div className="TabTable">
            <h3>{tab.name}</h3>
            <button onClick={toggleExtractionCoefficient}>
                {showExtractionCoefficient ? 'Скрыть коэффициент извлечения' : 'Показать коэффициент извлечения'}
            </button>
            <button onClick={clickClean}>Очистить вкладку</button>
            <table>
                <thead>
                <tr>
                    <th>№</th>
                    <th>Наименование компонента</th>
                    <th>Содержание (%)</th>
                    <th>Влажность (%)</th>
                    <th>Зольность (%)</th>
                    <th>Теплота сгорания (%)</th>
                    {showExtractionCoefficient && <th>Коэффициент извлечения</th>}
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {rows.slice(0, tab.incomingData.length).map((row, index) => (
                    <tr key={`incoming-${row.id}`}>
                        <td className="readOnly">{row.number}</td>
                        <td className="readOnly">{row.name}</td>
                        <td className="readOnly">{row.content}</td>
                        <td className="readOnly">{row.moisture}</td>
                        <td className="readOnly">{row.ash}</td>
                        <td className="readOnly">{row.calorificValue}</td>
                        {showExtractionCoefficient && <td className="readOnly">{row.extractionCoefficient}</td>}
                        <td></td>
                    </tr>
                ))}
                {tab.data.map((row, index) => (
                    <tr key={row.id}>
                        <td>{index + 1 + tab.incomingData.length}</td>
                        <td>
                            <input
                                type="text"
                                value={row.name}
                                onChange={(e) => handleInputChange(e, row.id, 'name')}
                            />
                        </td>
                        <td>
                            <input
                                type="text"
                                value={row.content}
                                onChange={(e) => handleInputChange(e, row.id, 'content')}
                            />
                        </td>
                        <td>
                            <input
                                type="text"
                                value={row.moisture}
                                onChange={(e) => handleInputChange(e, row.id, 'moisture')}
                            />
                        </td>
                        <td>
                            <input
                                type="text"
                                value={row.ash}
                                onChange={(e) => handleInputChange(e, row.id, 'ash')}
                            />
                        </td>
                        <td>
                            <input
                                type="text"
                                value={row.calorificValue}
                                onChange={(e) => handleInputChange(e, row.id, 'calorificValue')}
                            />
                        </td>
                        {showExtractionCoefficient && (
                            <td>
                                <input
                                    type="text"
                                    value={row.extractionCoefficient}
                                    onChange={(e) => handleInputChange(e, row.id, 'extractionCoefficient')}
                                />
                            </td>
                        )}
                        <td>
                            <button onClick={() => deleteRow(row.id)} className="deleteButton">
                                Удалить
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            <div className="newRowSection">
                <p>Заполните строку для добавления: (после чего нажмите enter или кнопку добавить строку)</p>
                <table>
                    <tbody>
                    <tr>
                        <td>
                            <input
                                type="text"
                                value={newRow.name}
                                onChange={(e) => handleNewRowChange(e, 'name')}
                                onKeyPress={handleKeyPress}
                            />
                        </td>
                        <td>
                            <input
                                type="text"
                                value={newRow.content}
                                onChange={(e) => handleNewRowChange(e, 'content')}
                                onKeyPress={handleKeyPress}
                            />
                        </td>
                        <td>
                            <input
                                type="text"
                                value={newRow.moisture}
                                onChange={(e) => handleNewRowChange(e, 'moisture')}
                                onKeyPress={handleKeyPress}
                            />
                        </td>
                        <td>
                            <input
                                type="text"
                                value={newRow.ash}
                                onChange={(e) => handleNewRowChange(e, 'ash')}
                                onKeyPress={handleKeyPress}
                            />
                        </td>
                        <td>
                            <input
                                type="text"
                                value={newRow.calorificValue}
                                onChange={(e) => handleNewRowChange(e, 'calorificValue')}
                                onKeyPress={handleKeyPress}
                            />
                        </td>
                        {showExtractionCoefficient && (
                            <td>
                                <input
                                    type="text"
                                    value={newRow.extractionCoefficient}
                                    onChange={(e) => handleNewRowChange(e, 'extractionCoefficient')}
                                    onKeyPress={handleKeyPress}
                                />
                            </td>
                        )}
                    </tr>
                    </tbody>
                </table>
                <button onClick={addNewRow}>Добавить строку</button>
            </div>
        </div>
    );
};

export default TabTable;

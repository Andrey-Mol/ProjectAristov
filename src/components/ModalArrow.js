import React, { useState, useEffect, useRef } from 'react';

const ModalArrow = ({ arrow, blockData, incomingData, closeModal, updateArrowData, deleteArrow }) => {
    // Состояние для хранения выбранных строк
    const [selectedRows, setSelectedRows] = useState(arrow.selectedData || []);
    // Состояние для хранения состояния "выбрать все"
    const [selectAll, setSelectAll] = useState(false);
    // Ссылка на модальное окно
    const modalRef = useRef(null);

    // useEffect для закрытия модального окна при клике вне его области
    useEffect(() => {
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

    // useEffect для обновления выбранных строк при изменении стрелки
    useEffect(() => {
        setSelectedRows(arrow.selectedData || []);
    }, [arrow]);

    // Обработчик выбора/отмены выбора строки
    const handleRowSelection = (row) => {
        const isSelected = selectedRows.some(selectedRow => selectedRow.id === row.id);
        let updatedSelectedRows;
        if (isSelected) {
            updatedSelectedRows = selectedRows.filter(selectedRow => selectedRow.id !== row.id);
        } else {
            updatedSelectedRows = [...selectedRows, row];
        }
        setSelectedRows(updatedSelectedRows);
        setSelectAll(updatedSelectedRows.length === uniqueData.length);
    };

    // Обработчик сохранения изменений
    const handleSave = () => {
        updateArrowData(arrow.id, { ...arrow, selectedData: selectedRows });
        closeModal();
    };

    // Обработчик изменения состояния "выбрать все"
    const handleSelectAllChange = () => {
        if (selectAll) {
            setSelectedRows([]);
        } else {
            setSelectedRows(uniqueData);
        }
        setSelectAll(!selectAll);
    };

    // Объединение данных блока и входящих данных
    const combinedData = blockData.concat(incomingData);
    // Удаление дубликатов данных по id
    const uniqueData = Array.from(new Map(combinedData.map(row => [row.id, row])).values());

    // useEffect для обновления состояния "выбрать все" при изменении выбранных строк или уникальных данных
    useEffect(() => {
        setSelectAll(selectedRows.length === uniqueData.length);
    }, [selectedRows, uniqueData.length]);

    return (
        <div className="Modal">
            <div className="ModalContent" ref={modalRef}>
                <span className="Close" onClick={closeModal}>&times;</span>
                <h2>Выберите строки для передачи</h2>
                {uniqueData.length > 0 ? (
                    <table className="MiniTable">
                        <thead>
                        <tr>
                            <th>№</th>
                            <th>Название компонента</th>
                            <th>Выбрать</th>
                        </tr>
                        </thead>
                        <tbody>
                        {uniqueData.map((row, index) => (
                            <tr key={row.id}>
                                <td>{index + 1}</td>
                                <td>{row.name}</td>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.some(selectedRow => selectedRow.id === row.id)}
                                        onChange={() => handleRowSelection(row)}
                                    />
                                </td>
                            </tr>
                        ))}
                        </tbody>
                        <tfoot>
                        <tr>
                            <td colSpan="4">
                                <input
                                    type="checkbox"
                                    checked={selectAll}
                                    onChange={handleSelectAllChange}
                                />
                                Выбрать все
                            </td>
                        </tr>
                        </tfoot>
                    </table>
                ) : (
                    <p>Данные отсутствуют</p>
                )}
                <div className="ModalFooter">
                    <button onClick={handleSave}>Сохранить</button>
                    <button onClick={() => deleteArrow(arrow.id)}>Удалить стрелку</button>
                </div>
            </div>
        </div>
    );
};

export default ModalArrow;

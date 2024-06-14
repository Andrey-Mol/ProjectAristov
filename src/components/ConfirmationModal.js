import React, { useRef, useEffect } from 'react';

const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
    // Создание ссылки на модальное окно
    const modalRef = useRef(null);

    // useEffect для закрытия модального окна при клике вне его области
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Если клик произошел вне модального окна, вызываем onCancel
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onCancel();
            }
        };
        // Добавляем слушатель события при монтировании компонента
        document.addEventListener('mousedown', handleClickOutside);
        // Удаляем слушатель события при размонтировании компонента
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onCancel]); // Зависимость от onCancel, чтобы обновлять слушатель при изменении onCancel

    return (
        <div className="Modal">
            {/* Модальное содержимое */}
            <div className="ModalContent" ref={modalRef}>
                {/* Сообщение, переданное в модальное окно */}
                <p>{message}</p>
                {/* Нижняя часть модального окна с кнопками подтверждения и отмены */}
                <div className="ModalFooter">
                    {/* Кнопка подтверждения вызывает onConfirm */}
                    <button onClick={onConfirm}>Подтвердить</button>
                    {/* Кнопка отмены вызывает onCancel */}
                    <button onClick={onCancel}>Отмена</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;

import React from 'react';
import Modal from './Modal';

const Alert = ({ isOpen, onClose, title, message, type = 'info' }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} type={type}>
      <div className="alert-content">
        <p className="alert-message">{message}</p>
        <div className="alert-actions">
          <button className="btn btn-primary" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default Alert;
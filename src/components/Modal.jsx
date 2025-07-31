import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, HelpCircle } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, type = 'info', showCloseButton = true }) => {
  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="icon success" />;
      case 'error':
        return <AlertCircle className="icon error" />;
      case 'warning':
        return <AlertCircle className="icon warning" />;
      case 'confirm':
        return <HelpCircle className="icon confirm" />;
      default:
        return <Info className="icon info" />;
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className={`modal-content ${type}`}>
        <div className="modal-header">
          <div className="modal-title-section">
            {getIcon()}
            <h3 className="modal-title">{title}</h3>
          </div>
          {showCloseButton && (
            <button className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          )}
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
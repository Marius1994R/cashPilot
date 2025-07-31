import { useState } from 'react';

export const useModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalProps, setModalProps] = useState({});
  const [resolveCallback, setResolveCallback] = useState(null);

  const showAlert = ({ title, message, type = 'info' }) => {
    setModalProps({ title, message, type, modalType: 'alert' });
    setIsOpen(true);
    
    return new Promise((resolve) => {
      setResolveCallback(() => resolve);
    });
  };

  const showConfirm = ({ 
    title, 
    message, 
    confirmText = 'Confirm', 
    cancelText = 'Cancel',
    type = 'confirm',
    isDestructive = false 
  }) => {
    setModalProps({ 
      title, 
      message, 
      confirmText, 
      cancelText, 
      type, 
      isDestructive, 
      modalType: 'confirm' 
    });
    setIsOpen(true);
    
    return new Promise((resolve) => {
      setResolveCallback(() => resolve);
    });
  };

  const closeModal = () => {
    setIsOpen(false);
    if (resolveCallback) {
      resolveCallback(false);
      setResolveCallback(null);
    }
  };

  const confirmModal = () => {
    setIsOpen(false);
    if (resolveCallback) {
      resolveCallback(true);
      setResolveCallback(null);
    }
  };

  return {
    isOpen,
    modalProps,
    showAlert,
    showConfirm,
    closeModal,
    confirmModal
  };
};
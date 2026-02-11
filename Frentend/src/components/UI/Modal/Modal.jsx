import React from 'react';
import './Modal.css';

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="ui-modal-backdrop" onClick={onClose}>
      <div className="ui-modal" onClick={(e) => e.stopPropagation()}>
        {title && <div className="ui-modal-title">{title}</div>}
        <div className="ui-modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;

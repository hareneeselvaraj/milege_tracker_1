import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="overlay-fixed">
      <div className="backdrop" onClick={onClose}></div>

      <div className="modal-content animate-slideUp">
        <div className="flex items-center justify-between border-b border-theme text-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px 24px', position: 'relative' }}>
          <h2 className="text-xl font-black tracking-tight" style={{ margin: 0, textAlign: 'center' }}>{title}</h2>
          <button onClick={onClose} style={{ position: 'absolute', right: '16px', padding: '8px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <div className="p-8 hide-scrollbar" style={{ padding: '32px 24px 48px 24px', maxHeight: '75vh', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

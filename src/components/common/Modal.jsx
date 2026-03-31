import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="overlay-fixed">
      <div className="backdrop" onClick={onClose}></div>

      <div className="modal-content">
        {/* Drag handle — native bottom sheet pattern */}
        <div className="modal-drag-handle"></div>
        
        <div className="flex items-center justify-between" 
          style={{ 
            padding: '12px 24px 20px', 
            position: 'relative',
            borderBottom: '1px solid var(--border)'
          }}>
          <h2 style={{ 
            fontSize: 'var(--type-title2)', 
            fontWeight: 900, 
            letterSpacing: '-0.5px',
            color: 'var(--text-primary)',
            margin: 0 
          }}>
            {title}
          </h2>
          <button 
            onClick={onClose} 
            style={{ 
              width: 36, height: 36, 
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-secondary)', 
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)', cursor: 'pointer' 
            }}>
            <X size={18} />
          </button>
        </div>

        <div className="hide-scrollbar" 
          style={{ 
            padding: '24px 24px 32px', 
            maxHeight: '70dvh', 
            overflowY: 'auto',
            paddingBottom: 'calc(32px + env(safe-area-inset-bottom))'
          }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

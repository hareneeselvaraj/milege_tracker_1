import React from 'react';
import { Plus } from 'lucide-react';

const FloatingActionButton = ({ onClick, icon: Icon = Plus }) => {
  return (
    <button 
      className="fab" 
      onClick={() => {
        if (navigator.vibrate) navigator.vibrate(10);
        onClick?.();
      }}
      aria-label="Add"
    >
      <Icon size={24} strokeWidth={2.5} />
    </button>
  );
};

export default FloatingActionButton;

import React from 'react';

const GlassCard = ({ children, className = "", onClick }) => {
  return (
    <div 
      className={`glass-card ${className}`} 
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default GlassCard;

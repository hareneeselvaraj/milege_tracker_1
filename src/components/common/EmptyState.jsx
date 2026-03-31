import React from 'react';

const EmptyState = ({ icon: Icon, title, subtitle, actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 text-primary animate-fade-up">
      <div className="w-20 h-20 rounded-[32px] bg-accent-soft border border-border flex items-center justify-center opacity-30">
        {Icon && <Icon size={40} strokeWidth={1.5} />}
      </div>
      <div className="text-center px-8">
        <div className="font-black text-lg tracking-tight mb-2 opacity-40">{title}</div>
        {subtitle && (
          <p className="text-xs text-secondary leading-relaxed">{subtitle}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="premium-btn text-sm px-8 py-3"
          style={{ color: 'var(--bg-primary)' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

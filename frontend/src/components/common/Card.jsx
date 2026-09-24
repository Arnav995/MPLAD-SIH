import React from 'react';

export const Card = ({ children, className = '', title, subtitle, action }) => {
  return (
    <div className={`bg-surface-container-lowest border border-surface-container-high rounded-[8px] p-5 shadow-xs hover:border-outline-variant transition-colors ${className}`}>
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-container-high">
          <div>
            {title && <h3 className="text-[17px] font-semibold text-on-surface tracking-tight">{title}</h3>}
            {subtitle && <p className="text-[13px] text-on-surface-variant mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

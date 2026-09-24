import React from 'react';

export const Tabs = ({ tabs = [], activeTab, onChange, className = '', variant = 'line' }) => {
  return (
    <div className={`flex items-center gap-1 border-b border-surface-container-high ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        if (variant === 'pills') {
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`px-3 py-1.5 rounded-[6px] text-[13px] font-semibold transition-colors ${
                isActive
                  ? 'bg-primary text-on-primary font-medium'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
              }`}
            >
              {tab.label}
              {tab.badge !== undefined && (
                <span className={`ml-2 px-1.5 py-0.5 text-[10px] rounded-[4px] ${isActive ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-4 py-2 text-[13px] font-semibold border-b-2 transition-all flex items-center gap-2 ${
              isActive
                ? 'border-primary text-on-surface font-bold'
                : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-surface-container-highest'
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={`px-1.5 py-0.2 rounded-[4px] text-[10px] ${isActive ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

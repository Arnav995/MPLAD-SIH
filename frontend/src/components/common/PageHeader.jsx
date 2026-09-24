import React from 'react';

export const PageHeader = ({
  badgeTag,
  badgeSubtext,
  title,
  subtitle,
  actions,
  className = ''
}) => {
  return (
    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-container-high ${className}`}>
      <div>
        {(badgeTag || badgeSubtext) && (
          <div className="flex items-center gap-2 mb-1.5">
            {badgeTag && (
              <span className="px-2 py-0.5 rounded-[4px] bg-primary text-on-primary text-[10px] uppercase font-bold tracking-wider">
                {badgeTag}
              </span>
            )}
            {badgeSubtext && (
              <span className="text-[12px] text-on-surface-variant font-mono">
                {badgeSubtext}
              </span>
            )}
          </div>
        )}
        <h1 className="text-[30px] leading-[36px] font-bold text-on-surface tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[14px] leading-[22px] text-on-surface-variant mt-1 max-w-3xl">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

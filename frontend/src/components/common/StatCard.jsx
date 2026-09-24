import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  badgeText,
  badgeType = 'neutral',
  icon: Icon,
  className = ''
}) => {
  const getBadgeStyle = () => {
    switch (badgeType) {
      case 'danger':
      case 'critical':
        return 'bg-error-container text-on-error-container border-error-container';
      case 'warning':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'success':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-surface-container-low text-on-surface-variant border-surface-container-high';
    }
  };

  return (
    <div  className={`bg-surface-container-lowest border border-surface-container-high rounded-[8px] p-5 flex flex-col justify-between
    transition-all duration-200 ease-out
    hover:-translate-y-0.5
    hover:border-outline
    hover:shadow-[0_4px_14px_rgba(25,28,30,0.06)]
    ${className}`}>
      <div className="flex items-start justify-between">
        <span className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="p-1.5 rounded-[6px] bg-surface-container-low text-on-surface-variant">
            <Icon className="w-4 h-4 text-on-surface-variant" />
          </div>
        )}
      </div>

      <div className="my-2.5">
        <div className="text-[30px] leading-[36px] font-medium text-on-surface num-tabular tracking-tight">
          {value}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-surface-container-high/60 text-[12px]">
  {subtitle && (
    <span className="min-w-0 text-on-surface-variant">
      {subtitle}
    </span>
  )}

  {badgeText && (
    <span
      className={`shrink-0 whitespace-nowrap px-2.5 py-1 rounded-[5px] text-[11px] font-semibold border ${getBadgeStyle()} ${
        badgeType === 'critical' ? 'critical-badge' : ''
      }`}
    >
      {badgeText}
    </span>
  )}
</div>
    </div>
  );
};

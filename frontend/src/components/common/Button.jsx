import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  onClick,
  disabled = false,
  className = '',
  type = 'button'
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-surface-container-lowest text-on-surface border border-surface-container-high hover:bg-surface-container-low hover:border-outline-variant';
      case 'success':
        return 'bg-secondary text-on-secondary hover:bg-emerald-700 font-semibold';
      case 'danger':
      case 'destructive':
        return 'bg-surface-container-lowest text-error border border-red-200 hover:bg-red-50 font-semibold';
      case 'outline':
        return 'bg-transparent text-on-surface border border-surface-container-high hover:bg-surface-container-low';
      case 'primary':
      default:
        return 'bg-primary text-on-primary hover:bg-neutral-800 font-semibold';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1 text-[12px] font-semibold h-8 gap-1.5 rounded-[6px]';
      case 'lg':
        return 'px-5 py-2 text-[15px] font-bold h-11 gap-2 rounded-[6px]';
      case 'md':
      default:
        return 'px-4 py-1.5 text-[13px] font-semibold h-[38px] gap-2 rounded-[6px]';
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${getVariantStyles()} ${getSizeStyles()} ${className}`}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span>{children}</span>
    </button>
  );
};

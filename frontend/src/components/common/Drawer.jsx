import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Drawer = ({ isOpen, onClose, title, subtitle, children, footer, width = 'max-w-md' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Scrim Overlay */}
      <div
        className="fixed inset-0 bg-neutral-950/40 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className={`w-screen ${width} bg-surface-container-lowest border-l border-surface-container-high shadow-2xl flex flex-col`}>
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-surface-container-high bg-surface-container-low/40">
            <div>
              <h3 className="text-[17px] font-semibold text-on-surface">{title}</h3>
              {subtitle && <p className="text-[12px] text-on-surface-variant mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-[4px] text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 p-5 overflow-y-auto">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="p-5 border-t border-surface-container-high bg-surface-container-low/40 flex items-center justify-end gap-2.5">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

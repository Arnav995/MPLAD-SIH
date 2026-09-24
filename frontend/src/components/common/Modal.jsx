import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, footer, maxWidth = 'max-w-xl' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Scrim Overlay */}
      <div
        className="fixed inset-0 bg-neutral-950/40 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`relative w-full ${maxWidth} bg-surface-container-lowest border border-surface-container-high rounded-[10px] shadow-xl overflow-hidden z-10 flex flex-col max-h-[90vh]`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-container-high bg-surface-container-low/30">
          <h3 className="text-[17px] font-semibold text-on-surface">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-[4px] text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-surface-container-high bg-surface-container-low/30">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { useViewer } from '../../context/ViewerContext';
import { ChevronDown } from 'lucide-react';

export const ViewerBadge = ({ onClick }) => {
  const { currentViewer } = useViewer();

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low border border-surface-container-high rounded-[6px] hover:bg-surface-container-high transition-colors text-left group"
      title="Switch Viewer Role"
    >
      <span className="w-2 h-2 rounded-full bg-secondary inline-block animate-pulse shrink-0" />
      <div className="flex flex-col">
        <span className="text-[13px] font-semibold text-on-surface leading-tight">
          {currentViewer.label}
        </span>
      </div>
      <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-on-surface ml-1 transition-colors" />
    </button>
  );
};

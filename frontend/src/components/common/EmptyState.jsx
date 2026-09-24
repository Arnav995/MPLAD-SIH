import React from 'react';
import { SearchX } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({
  title = 'No Records Found',
  description = 'No matching records found for the current search or filter criteria.',
  onReset,
  icon: Icon = SearchX
}) => {
  return (
    <div className="p-space-xl text-center bg-surface-container-low/40 border border-surface-container-high rounded flex flex-col items-center justify-center my-space-md">
      <div className="p-3 bg-surface-container-high/60 rounded-full text-on-surface-variant mb-space-sm">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-headline-sm font-headline-sm font-semibold text-on-surface">{title}</h4>
      <p className="text-body-sm text-on-surface-variant mt-1 max-w-md">{description}</p>
      {onReset && (
        <div className="mt-space-md">
          <Button size="sm" variant="secondary" onClick={onReset}>
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
};

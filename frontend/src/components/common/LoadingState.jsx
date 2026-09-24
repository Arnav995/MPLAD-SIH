import React from 'react';

export const LoadingState = ({ message = 'Loading institutional telemetry...' }) => {
  return (
    <div className="p-space-xl text-center flex flex-col items-center justify-center space-y-space-sm my-space-md">
      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-label-sm font-label-sm text-on-surface-variant font-medium tracking-wide">
        {message}
      </span>
    </div>
  );
};

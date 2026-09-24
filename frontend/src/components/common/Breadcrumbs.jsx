import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export const Breadcrumbs = ({ items = [] }) => {
  if (!items.length) return null;

  return (
    <nav className="flex items-center gap-1.5 text-label-sm font-label-sm text-on-surface-variant mb-space-sm select-none">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-outline opacity-60" />}
            {item.path && !isLast ? (
              <Link to={item.path} className="hover:text-on-surface hover:underline transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'font-semibold text-on-surface' : ''}>{item.label}</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, SearchX } from 'lucide-react';
import { Button } from './Button';

export const DataTable = ({
  columns = [],
  data = [],
  onRowClick,
  emptyMessage = 'No matching records found for the active filter criteria.',
  onResetFilters,
  pageSize = 10,
  className = ''
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = data.slice(startIndex, startIndex + pageSize);

  return (
    <div className={`w-full overflow-hidden border border-surface-container-high rounded-[8px] bg-surface-container-lowest ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-surface-container-high h-10">
              {columns.map((col, idx) => (
                <th
                  key={`${col.key || 'column'}-${idx}`}
                  className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant select-none ${col.headerClassName || ''} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high/60">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-on-surface-variant text-[13px]">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <SearchX className="w-6 h-6 text-outline opacity-60" />
                    <p className="font-medium text-on-surface">{emptyMessage}</p>
                    {onResetFilters && (
                      <Button size="sm" variant="secondary" onClick={onResetFilters} className="mt-2">
                        Clear Search & Reset Filters
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`h-11 transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-surface-container-low/70' : 'hover:bg-surface-container-low/40'
                  }`}
                >
                  {columns.map((col, colIdx) => {
                    const value = col.key ? row[col.key] : undefined;
                    return (
                      <td
                        key={`${col.key || 'column'}-${colIdx}`}
                        className={`px-4 py-2.5 text-[13px] font-normal text-on-surface ${col.isNumeric ? 'num-tabular' : ''} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
                      >
                        {col.render ? col.render(value, row, startIndex + rowIdx) : value}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-surface-container-low/50 border-t border-surface-container-high text-[12px] text-on-surface-variant">
          <div>
            Showing <span className="font-semibold text-on-surface">{startIndex + 1}</span> to{' '}
            <span className="font-semibold text-on-surface">
              {Math.min(startIndex + pageSize, data.length)}
            </span>{' '}
            of <span className="font-semibold text-on-surface">{data.length}</span> entries
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-[4px] hover:bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 py-0.5 text-on-surface font-medium">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-[4px] hover:bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

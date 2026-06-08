'use client';

import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';
import { EmptyState } from './EmptyState';

/**
 * @param {{
 *   columns: { key: string, header: string, render?: (row, idx) => any, className?: string, align?: 'left'|'center'|'right' }[],
 *   data: any[],
 *   loading?: boolean,
 *   emptyMessage?: string,
 *   rowKey?: (row, idx) => string,
 *   onRowClick?: (row) => void,
 *   className?: string,
 * }} props
 */
export function DataTable({
  columns,
  data,
  loading,
  emptyMessage = 'Chưa có dữ liệu',
  rowKey,
  onRowClick,
  className,
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-primary-100 bg-white dark:border-dark-border dark:bg-dark-card',
        className,
      )}
    >
      <div className="scrollbar-thin max-w-full overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-primary-50 text-primary-700 dark:bg-dark-bg/60 dark:text-dark-muted">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold uppercase tracking-wide',
                    c.align === 'right' && 'text-right',
                    c.align === 'center' && 'text-center',
                    !c.align && 'text-left',
                    c.className,
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-100 dark:divide-dark-border">
            {loading && (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <Spinner size={22} />
                </td>
              </tr>
            )}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <EmptyState title={emptyMessage} className="rounded-none border-0 bg-transparent" />
                </td>
              </tr>
            )}
            {!loading &&
              data.map((row, idx) => (
                <tr
                  key={rowKey ? rowKey(row, idx) : idx}
                  className={cn(
                    'transition hover:bg-primary-50/60 dark:hover:bg-dark-bg/40',
                    onRowClick && 'cursor-pointer',
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        'px-4 py-3 text-primary-800 dark:text-dark-text',
                        c.align === 'right' && 'text-right',
                        c.align === 'center' && 'text-center',
                      )}
                    >
                      {c.render ? c.render(row, idx) : row[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

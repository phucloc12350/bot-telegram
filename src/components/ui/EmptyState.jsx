import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EmptyState({ icon, title = 'Chưa có dữ liệu', description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-primary-200 bg-primary-50/40 py-12 text-center dark:border-dark-border dark:bg-dark-card/40',
        className,
      )}
    >
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-500 dark:bg-dark-border dark:text-dark-muted">
        {icon || <Inbox size={24} />}
      </div>
      <h4 className="text-sm font-semibold text-primary-800 dark:text-dark-text">{title}</h4>
      {description && (
        <p className="mt-1 max-w-md text-xs text-primary-600 dark:text-dark-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message = 'Đã có lỗi xảy ra', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-danger/40 bg-danger/5 py-12 text-center">
      <p className="text-sm text-danger">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-xs font-medium text-primary-600 underline hover:text-primary-800"
        >
          Thử lại
        </button>
      )}
    </div>
  );
}

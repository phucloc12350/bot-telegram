import { cn } from '@/lib/utils';

export function Card({ className, ...props }) {
  return <div className={cn('card-base', className)} {...props} />;
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('mb-3 flex items-start justify-between', className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn('text-sm font-semibold text-primary-800 dark:text-dark-text', className)}
      {...props}
    />
  );
}

export function CardSubtitle({ className, ...props }) {
  return (
    <p
      className={cn('text-xs text-primary-600 dark:text-dark-muted', className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }) {
  return <div className={cn('', className)} {...props} />;
}

export function StatCard({ label, value, hint, icon, tone = 'default' }) {
  const toneClass = {
    default: 'text-primary-800 dark:text-dark-text',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
  }[tone];

  return (
    <Card className="flex items-start gap-4">
      {icon && (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-dark-border dark:text-dark-text">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs uppercase tracking-wide text-primary-500 dark:text-dark-muted">
          {label}
        </p>
        <p className={cn('mt-1 truncate text-xl font-semibold', toneClass)}>{value}</p>
        {hint && (
          <p className="mt-1 truncate text-xs text-primary-500 dark:text-dark-muted">{hint}</p>
        )}
      </div>
    </Card>
  );
}

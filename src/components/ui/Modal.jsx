'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 animate-fade-in">
      <div
        className={cn(
          'relative w-full rounded-lg border border-primary-100 bg-white shadow-2xl dark:border-dark-border dark:bg-dark-card',
          sizeClass,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-primary-100 p-5 dark:border-dark-border">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-primary-900 dark:text-dark-text">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-1 text-xs text-primary-600 dark:text-dark-muted">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-primary-500 hover:bg-primary-100 dark:hover:bg-dark-border"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-primary-100 p-4 dark:border-dark-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

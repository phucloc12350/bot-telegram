'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef(function Input(
  { className, type = 'text', error, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn('input-base', error && 'border-danger focus:ring-danger/20', className)}
      {...props}
    />
  );
});

export const Label = forwardRef(function Label({ className, ...props }, ref) {
  return (
    <label
      ref={ref}
      className={cn(
        'mb-1.5 block text-sm font-medium text-primary-800 dark:text-dark-text',
        className,
      )}
      {...props}
    />
  );
});

export function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-danger">{message}</p>;
}

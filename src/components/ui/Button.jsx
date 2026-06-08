'use client';

import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 ' +
    'disabled:cursor-not-allowed disabled:opacity-60',
  {
    variants: {
      variant: {
        primary:
          'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-sm',
        secondary:
          'bg-primary-100 text-primary-800 hover:bg-primary-200 dark:bg-dark-card dark:text-dark-text dark:hover:bg-dark-border',
        outline:
          'border border-primary-300 bg-transparent text-primary-700 hover:bg-primary-50 dark:border-dark-border dark:text-dark-text dark:hover:bg-dark-card',
        ghost:
          'bg-transparent text-primary-700 hover:bg-primary-50 dark:text-dark-text dark:hover:bg-dark-card',
        danger: 'bg-danger text-white hover:bg-red-700 shadow-sm',
        success: 'bg-success text-white hover:bg-green-700 shadow-sm',
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export const Button = forwardRef(function Button(
  { className, variant, size, loading, disabled, leftIcon, rightIcon, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});

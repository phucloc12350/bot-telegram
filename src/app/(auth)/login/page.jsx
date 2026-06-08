import { Suspense } from 'react';
import { LoginForm } from './login-form';
import { Spinner } from '@/components/ui/Spinner';

export const metadata = { title: 'Đăng nhập | Bot Telegram Dashboard' };
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-primary-100 bg-white p-8 shadow-xl dark:border-dark-border dark:bg-dark-card">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 text-2xl font-bold text-white">
            B
          </div>
          <h1 className="text-2xl font-bold text-primary-900 dark:text-dark-text">
            Bot Telegram Dashboard
          </h1>
          <p className="mt-1 text-sm text-primary-600 dark:text-dark-muted">
            Đăng nhập để quản lý hệ thống
          </p>
        </div>
        <Suspense fallback={<div className="flex justify-center py-8"><Spinner /></div>}>
          <LoginForm />
        </Suspense>
      </div>
      <p className="mt-4 text-center text-xs text-primary-500 dark:text-dark-muted">
        © {new Date().getFullYear()} Bot Telegram Dashboard
      </p>
    </div>
  );
}

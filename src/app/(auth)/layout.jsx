import { ThemeToggle } from '@/components/layout/ThemeToggle';

export default function AuthLayout({ children }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-accent to-primary-100 p-4 dark:from-dark-bg dark:via-dark-card dark:to-dark-bg">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}

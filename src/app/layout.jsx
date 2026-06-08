import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from 'sonner';
import { SessionProvider } from 'next-auth/react';

export const metadata = {
  title: 'Bot Telegram Dashboard',
  description: 'Quản lý thống kê giá vàng, giá xăng và bot Telegram',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
        <SessionProvider>
          <ThemeProvider>
            {children}
            <Toaster
              position="top-right"
              richColors
              theme="system"
              toastOptions={{ duration: 3500 }}
            />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

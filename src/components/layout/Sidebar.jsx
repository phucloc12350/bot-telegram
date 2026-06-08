'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LogOut, X } from 'lucide-react';
import { MENU } from '@/constants/menu';
import { cn } from '@/lib/utils';

export function Sidebar({ user, isMobileOpen, onCloseMobile }) {
  const pathname = usePathname();

  const initials = (user?.name || user?.email || 'A')
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isActive = (item) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/');

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-primary-100 bg-white transition-transform dark:border-dark-border dark:bg-dark-card lg:static lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500 font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-primary-500 dark:text-dark-muted">Xin chào,</p>
              <p className="truncate text-sm font-semibold text-primary-900 dark:text-dark-text">
                {user?.name || user?.email || 'Admin'}
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="rounded p-1 text-primary-500 hover:bg-primary-100 dark:hover:bg-dark-border lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Menu */}
        <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-3">
          <ul className="space-y-1">
            {MENU.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onCloseMobile}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition',
                      active
                        ? 'bg-primary-500 text-white shadow-sm'
                        : 'text-primary-700 hover:bg-primary-100 dark:text-dark-text dark:hover:bg-dark-border',
                    )}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="border-t border-primary-100 p-3 dark:border-dark-border">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-danger transition hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
}

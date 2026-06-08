'use client';

import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { MENU } from '@/constants/menu';

function getPageTitle(pathname) {
  const exact = MENU.find((m) => m.exact && m.href === pathname);
  if (exact) return exact.label;
  const match = MENU.filter((m) => !m.exact).find(
    (m) => pathname === m.href || pathname.startsWith(m.href + '/'),
  );
  return match?.label || 'Dashboard';
}

export function Header({ onOpenMobile }) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-primary-100 bg-white/80 px-4 backdrop-blur dark:border-dark-border dark:bg-dark-card/80">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="rounded p-1 text-primary-600 hover:bg-primary-100 dark:text-dark-text dark:hover:bg-dark-border lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-base font-semibold text-primary-900 dark:text-dark-text">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}

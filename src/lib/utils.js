import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrencyVnd(value, options = {}) {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'string' ? Number(value) : Number(value);
  if (Number.isNaN(num)) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
    ...options,
  }).format(num);
}

export function formatNumber(value) {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'string' ? Number(value) : Number(value);
  if (Number.isNaN(num)) return '—';
  return new Intl.NumberFormat('vi-VN').format(num);
}

export function formatDateTime(date, opts = {}) {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    ...opts,
  }).format(d);
}

export function rangeToDate(range = '7d') {
  const now = new Date();
  const map = {
    '1d': 1,
    '7d': 7,
    '30d': 30,
    '90d': 90,
  };
  const days = map[range] ?? 7;
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return { from, to: now };
}

export function safeJsonStringify(value) {
  return JSON.stringify(value, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));
}

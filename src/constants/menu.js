import { LayoutDashboard, Coins, Fuel, Bot, History, Settings } from 'lucide-react';

export const MENU = [
  { label: 'Tổng quan', href: '/', icon: LayoutDashboard, exact: true },
  { label: 'Thống kê vàng', href: '/gold', icon: Coins },
  { label: 'Thống kê giá xăng', href: '/fuel', icon: Fuel },
  { label: 'Quản lý bot Telegram', href: '/telegram/bots', icon: Bot },
  { label: 'Lịch sử thông báo', href: '/telegram/logs', icon: History },
  { label: 'Cài đặt', href: '/settings', icon: Settings },
];

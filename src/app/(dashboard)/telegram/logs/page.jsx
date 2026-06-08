import { TelegramLogs } from './telegram-logs';

export const metadata = { title: 'Lịch sử thông báo' };
export const dynamic = 'force-dynamic';

export default function LogsPage() {
  return <TelegramLogs />;
}

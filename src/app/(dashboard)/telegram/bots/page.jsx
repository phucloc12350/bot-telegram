import { BotsManager } from './bots-manager';

export const metadata = { title: 'Quản lý bot Telegram' };
export const dynamic = 'force-dynamic';

export default function BotsPage() {
  return <BotsManager />;
}

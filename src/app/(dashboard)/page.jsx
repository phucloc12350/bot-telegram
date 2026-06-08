import { Bot, Coins, Fuel, History } from 'lucide-react';
import { prisma } from '@/lib/db';
import {
  getLatestGoldByType,
} from '@/server/services/gold.service';
import { getLatestFuelByType } from '@/server/services/fuel.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard, Card, CardTitle, CardSubtitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { formatCurrencyVnd, formatDateTime } from '@/lib/utils';

export const metadata = { title: 'Tổng quan | Dashboard' };
export const dynamic = 'force-dynamic';

async function loadOverview() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [latestGold, latestFuel, activeBots, todayLogs, recentLogs] = await Promise.all([
    getLatestGoldByType().catch(() => []),
    getLatestFuelByType().catch(() => []),
    prisma.botSetting.count({ where: { isActive: true } }).catch(() => 0),
    prisma.telegramLog.count({ where: { sentAt: { gte: today } } }).catch(() => 0),
    prisma.telegramLog
      .findMany({ orderBy: { sentAt: 'desc' }, take: 5 })
      .catch(() => []),
  ]);

  return {
    latestGold,
    latestFuel,
    activeBots,
    todayLogs,
    recentLogs: recentLogs.map((r) => ({
      ...r,
      id: String(r.id),
      sentAt: r.sentAt.toISOString(),
    })),
  };
}

export default async function DashboardHome() {
  const { latestGold, latestFuel, activeBots, todayLogs, recentLogs } = await loadOverview();

  const goldTop = latestGold[0];
  const fuelTop = latestFuel.find((x) => /95-V/i.test(x.fuelType)) || latestFuel[0];

  return (
    <>
      <PageHeader
        title="Tổng quan hệ thống"
        description="Theo dõi nhanh giá vàng, giá xăng và hoạt động bot Telegram."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={goldTop ? `Vàng — ${goldTop.type}` : 'Giá vàng'}
          value={goldTop ? formatCurrencyVnd(goldTop.sell) : '—'}
          hint={goldTop ? `Cập nhật: ${formatDateTime(goldTop.recordedAt)}` : 'Chưa có dữ liệu'}
          icon={<Coins size={22} />}
        />
        <StatCard
          label={fuelTop ? `Xăng — ${fuelTop.fuelType}` : 'Giá xăng'}
          value={fuelTop ? formatCurrencyVnd(fuelTop.price) : '—'}
          hint={fuelTop ? `Cập nhật: ${formatDateTime(fuelTop.recordedAt)}` : 'Chưa có dữ liệu'}
          icon={<Fuel size={22} />}
        />
        <StatCard
          label="Bot đang hoạt động"
          value={activeBots}
          hint="Bot có isActive = true"
          icon={<Bot size={22} />}
        />
        <StatCard
          label="Tin nhắn hôm nay"
          value={todayLogs}
          hint="Tổng cron + thủ công + command"
          icon={<History size={22} />}
        />
      </div>

      <Card>
        <CardTitle>Hoạt động Telegram gần đây</CardTitle>
        <CardSubtitle className="mt-1">5 log mới nhất</CardSubtitle>
        <div className="mt-4">
          {recentLogs.length === 0 ? (
            <EmptyState
              title="Chưa có log"
              description="Sau khi bot gửi tin, hoạt động sẽ hiển thị tại đây."
            />
          ) : (
            <ul className="divide-y divide-primary-100 dark:divide-dark-border">
              {recentLogs.map((log) => (
                <li key={log.id} className="flex items-start gap-3 py-3">
                  <Badge tone={log.status === 'SUCCESS' ? 'success' : 'danger'}>
                    {log.status}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="info">{log.botType}</Badge>
                      <Badge>{log.trigger}</Badge>
                      <span className="text-xs text-primary-500 dark:text-dark-muted">
                        {formatDateTime(log.sentAt)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-primary-700 dark:text-dark-text">
                      {(log.message || '').replace(/<[^>]+>/g, '').slice(0, 160)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </>
  );
}

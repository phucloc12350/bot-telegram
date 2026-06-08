'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Coins, Download, RefreshCcw, Send } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle, CardSubtitle, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/DataTable';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { PriceLineChart } from '@/components/charts/PriceLineChart';
import { formatCurrencyVnd, formatDateTime } from '@/lib/utils';

const RANGES = [
  { value: '1d', label: 'Hôm nay' },
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '90d', label: '90 ngày' },
];

async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new Error(json?.error?.message || `Request failed (${res.status})`);
  }
  return json.data;
}

export function GoldDashboard() {
  const [latest, setLatest] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [type, setType] = useState('');
  const [range, setRange] = useState('7d');
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const types = useMemo(() => {
    const set = new Set(latest.map((x) => x.type));
    return Array.from(set);
  }, [latest]);

  const selectedLatest = useMemo(() => {
    if (!type) return latest[0];
    return latest.find((x) => x.type === type) || latest[0];
  }, [latest, type]);

  const loadLatest = useCallback(async () => {
    setLoadingLatest(true);
    setError(null);
    try {
      const d = await api('GET', '/api/gold');
      setLatest(d.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingLatest(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const qs = new URLSearchParams({ range });
      if (type) qs.set('type', type);
      const [his, st] = await Promise.all([
        api('GET', `/api/gold/history?${qs.toString()}`),
        api('GET', `/api/gold/stats?${qs.toString()}`),
      ]);
      setHistory(his.items || []);
      setStats(st);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoadingHistory(false);
    }
  }, [range, type]);

  useEffect(() => {
    loadLatest();
  }, [loadLatest]);
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onSync = async () => {
    setSyncing(true);
    try {
      const r = await api('POST', '/api/gold/sync');
      toast.success(`Đã sync ${r.inserted} bản ghi mới`);
      await Promise.all([loadLatest(), loadHistory()]);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSyncing(false);
    }
  };

  const onSend = async () => {
    setSending(true);
    try {
      const r = await api('POST', '/api/gold/send-telegram', { kind: 'latest' });
      if (r.sent > 0) toast.success(`Đã gửi tới ${r.sent} bot`);
      else toast.warning('Không có bot Telegram nào active. Hãy thêm ở mục "Quản lý bot Telegram".');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const onExport = () => {
    const qs = new URLSearchParams({ range });
    if (type) qs.set('type', type);
    window.location.href = `/api/gold/export?${qs.toString()}`;
  };

  // Chart data: gom theo recordedAt cho 1 type → buy/sell
  const chartData = useMemo(() => {
    if (!type) {
      // Khi không chọn type cụ thể, dùng entire history (filter type đầu tiên có data nhiều nhất)
      const counts = history.reduce((acc, r) => ((acc[r.type] = (acc[r.type] || 0) + 1), acc), {});
      const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
      return history
        .filter((r) => r.type === top)
        .slice()
        .reverse()
        .map((r) => ({ t: r.recordedAt, buy: r.buy, sell: r.sell }));
    }
    return history
      .filter((r) => r.type === type)
      .slice()
      .reverse()
      .map((r) => ({ t: r.recordedAt, buy: r.buy, sell: r.sell }));
  }, [history, type]);

  return (
    <>
      <PageHeader
        title="Thống kê giá vàng"
        description="Đồng bộ từ SJC, gửi snapshot qua Telegram, xuất CSV."
        actions={
          <>
            <Button variant="outline" leftIcon={<RefreshCcw size={16} />} onClick={onSync} loading={syncing}>
              Cập nhật ngay
            </Button>
            <Button variant="secondary" leftIcon={<Send size={16} />} onClick={onSend} loading={sending}>
              Gửi Telegram
            </Button>
            <Button variant="ghost" leftIcon={<Download size={16} />} onClick={onExport}>
              Xuất CSV
            </Button>
          </>
        }
      />

      {/* Latest card */}
      {loadingLatest ? (
        <Card>
          <div className="flex h-32 items-center justify-center">
            <Spinner />
          </div>
        </Card>
      ) : error ? (
        <ErrorState message={error} onRetry={loadLatest} />
      ) : latest.length === 0 ? (
        <EmptyState
          icon={<Coins size={22} />}
          title="Chưa có dữ liệu giá vàng"
          description="Bấm “Cập nhật ngay” để sync giá từ SJC vào database."
          action={
            <Button leftIcon={<RefreshCcw size={16} />} onClick={onSync} loading={syncing}>
              Cập nhật ngay
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="flex flex-col gap-1">
              <CardSubtitle>Giá mới nhất</CardSubtitle>
              <CardTitle className="text-lg">{selectedLatest?.type || '—'}</CardTitle>
              <p className="mt-1 text-xs text-primary-500 dark:text-dark-muted">
                🕒 {formatDateTime(selectedLatest?.recordedAt)} ·{' '}
                <Badge>{selectedLatest?.source || '—'}</Badge>
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-primary-500 dark:text-dark-muted">Mua vào</p>
                <p className="text-2xl font-bold text-primary-700 dark:text-dark-text">
                  {formatCurrencyVnd(selectedLatest?.buy)}
                </p>
              </div>
              <div>
                <p className="text-xs text-primary-500 dark:text-dark-muted">Bán ra</p>
                <p className="text-2xl font-bold text-primary-900 dark:text-dark-text">
                  {formatCurrencyVnd(selectedLatest?.sell)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="flex flex-col gap-3">
            <CardTitle>Bộ lọc</CardTitle>
            <div>
              <label className="mb-1 block text-xs text-primary-600 dark:text-dark-muted">
                Loại vàng
              </label>
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">— Tất cả —</option>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-primary-600 dark:text-dark-muted">
                Khoảng thời gian
              </label>
              <Select value={range} onChange={(e) => setRange(e.target.value)}>
                {RANGES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </div>
          </Card>
        </div>
      )}

      {/* Stats summary */}
      {stats && stats.count > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Số bản ghi" value={stats.count} />
          <StatCard label="Min bán" value={formatCurrencyVnd(stats.min)} tone="success" />
          <StatCard label="Max bán" value={formatCurrencyVnd(stats.max)} tone="danger" />
          <StatCard label="TB bán" value={formatCurrencyVnd(stats.avg)} />
        </div>
      )}

      {/* Chart */}
      <Card>
        <CardTitle>Biểu đồ biến động</CardTitle>
        <CardSubtitle className="mt-1">
          {type || (chartData[0] && history[0]?.type) || 'Chọn loại vàng để xem chi tiết'}
        </CardSubtitle>
        <div className="mt-4">
          {loadingHistory ? (
            <div className="flex h-64 items-center justify-center">
              <Spinner />
            </div>
          ) : chartData.length === 0 ? (
            <EmptyState title="Chưa có dữ liệu trong khoảng đã chọn" />
          ) : (
            <PriceLineChart data={chartData} />
          )}
        </div>
      </Card>

      {/* History table */}
      <Card className="p-0">
        <div className="border-b border-primary-100 p-5 dark:border-dark-border">
          <CardTitle>Lịch sử giá vàng</CardTitle>
          <CardSubtitle className="mt-1">{history.length} bản ghi</CardSubtitle>
        </div>
        <DataTable
          loading={loadingHistory}
          data={history}
          rowKey={(r) => r.id}
          columns={[
            { key: 'recordedAt', header: 'Thời gian', render: (r) => formatDateTime(r.recordedAt) },
            { key: 'type', header: 'Loại', render: (r) => <span className="font-medium">{r.type}</span> },
            { key: 'buy', header: 'Mua', align: 'right', render: (r) => formatCurrencyVnd(r.buy) },
            { key: 'sell', header: 'Bán', align: 'right', render: (r) => formatCurrencyVnd(r.sell) },
            { key: 'source', header: 'Nguồn', render: (r) => <Badge>{r.source}</Badge> },
          ]}
          emptyMessage="Chưa có dữ liệu lịch sử trong khoảng đã chọn"
        />
      </Card>
    </>
  );
}

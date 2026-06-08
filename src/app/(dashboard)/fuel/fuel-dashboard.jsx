'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Download, Fuel, RefreshCcw, Send } from 'lucide-react';
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
  if (!res.ok || json?.success === false)
    throw new Error(json?.error?.message || `Request failed (${res.status})`);
  return json.data;
}

export function FuelDashboard() {
  const [latest, setLatest] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [fuelType, setFuelType] = useState('');
  const [range, setRange] = useState('30d');
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const types = useMemo(() => Array.from(new Set(latest.map((x) => x.fuelType))), [latest]);

  const loadLatest = useCallback(async () => {
    setLoadingLatest(true);
    setError(null);
    try {
      const d = await api('GET', '/api/fuel');
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
      if (fuelType) qs.set('fuelType', fuelType);
      const [his, st] = await Promise.all([
        api('GET', `/api/fuel/history?${qs.toString()}`),
        api('GET', `/api/fuel/stats?${qs.toString()}`),
      ]);
      setHistory(his.items || []);
      setStats(st);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoadingHistory(false);
    }
  }, [range, fuelType]);

  useEffect(() => {
    loadLatest();
  }, [loadLatest]);
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onSync = async () => {
    setSyncing(true);
    try {
      const r = await api('POST', '/api/fuel/sync');
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
      const r = await api('POST', '/api/fuel/send-telegram', { kind: 'latest' });
      if (r.sent > 0) toast.success(`Đã gửi tới ${r.sent} bot`);
      else toast.warning('Không có bot Telegram nào active.');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const onExport = () => {
    const qs = new URLSearchParams({ range });
    if (fuelType) qs.set('fuelType', fuelType);
    window.location.href = `/api/fuel/export?${qs.toString()}`;
  };

  const chartData = useMemo(() => {
    const target = fuelType || types[0];
    if (!target) return [];
    return history
      .filter((r) => r.fuelType === target)
      .slice()
      .reverse()
      .map((r) => ({ t: r.recordedAt, price: r.price }));
  }, [history, fuelType, types]);

  return (
    <>
      <PageHeader
        title="Thống kê giá xăng"
        description="Đồng bộ từ Petrolimex, gửi snapshot qua Telegram, xuất CSV."
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

      {/* Latest cards */}
      {loadingLatest ? (
        <Card>
          <div className="flex h-32 items-center justify-center"><Spinner /></div>
        </Card>
      ) : error ? (
        <ErrorState message={error} onRetry={loadLatest} />
      ) : latest.length === 0 ? (
        <EmptyState
          icon={<Fuel size={22} />}
          title="Chưa có dữ liệu giá xăng"
          description="Bấm “Cập nhật ngay” để sync giá từ Petrolimex."
          action={
            <Button leftIcon={<RefreshCcw size={16} />} onClick={onSync} loading={syncing}>
              Cập nhật ngay
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {latest.map((it) => (
            <Card key={it.fuelType}>
              <CardSubtitle>{it.fuelType}</CardSubtitle>
              <p className="mt-2 text-2xl font-bold text-primary-900 dark:text-dark-text">
                {formatCurrencyVnd(it.price)}
              </p>
              <p className="mt-1 text-xs text-primary-500 dark:text-dark-muted">
                🕒 {formatDateTime(it.recordedAt)} · <Badge>{it.source}</Badge>
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Filter & stats */}
      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-primary-600 dark:text-dark-muted">Loại</label>
            <Select value={fuelType} onChange={(e) => setFuelType(e.target.value)}>
              <option value="">— Tất cả —</option>
              {types.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-primary-600 dark:text-dark-muted">Khoảng</label>
            <Select value={range} onChange={(e) => setRange(e.target.value)}>
              {RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Select>
          </div>
        </div>
      </Card>

      {stats && stats.count > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Số bản ghi" value={stats.count} />
          <StatCard label="Min" value={formatCurrencyVnd(stats.min)} tone="success" />
          <StatCard label="Max" value={formatCurrencyVnd(stats.max)} tone="danger" />
          <StatCard label="Trung bình" value={formatCurrencyVnd(stats.avg)} />
        </div>
      )}

      {/* Chart */}
      <Card>
        <CardTitle>Biểu đồ biến động</CardTitle>
        <CardSubtitle className="mt-1">{fuelType || types[0] || 'Chọn loại để xem'}</CardSubtitle>
        <div className="mt-4">
          {loadingHistory ? (
            <div className="flex h-64 items-center justify-center"><Spinner /></div>
          ) : chartData.length === 0 ? (
            <EmptyState title="Chưa có dữ liệu trong khoảng đã chọn" />
          ) : (
            <PriceLineChart
              data={chartData}
              series={[{ key: 'price', name: 'Giá (VND/lít)', color: '#8B5E3C' }]}
            />
          )}
        </div>
      </Card>

      {/* History */}
      <Card className="p-0">
        <div className="border-b border-primary-100 p-5 dark:border-dark-border">
          <CardTitle>Lịch sử giá xăng</CardTitle>
          <CardSubtitle className="mt-1">{history.length} bản ghi</CardSubtitle>
        </div>
        <DataTable
          loading={loadingHistory}
          data={history}
          rowKey={(r) => r.id}
          columns={[
            { key: 'recordedAt', header: 'Thời gian', render: (r) => formatDateTime(r.recordedAt) },
            { key: 'fuelType', header: 'Loại', render: (r) => <span className="font-medium">{r.fuelType}</span> },
            { key: 'price', header: 'Giá', align: 'right', render: (r) => formatCurrencyVnd(r.price) },
            { key: 'source', header: 'Nguồn', render: (r) => <Badge>{r.source}</Badge> },
          ]}
          emptyMessage="Chưa có dữ liệu lịch sử"
        />
      </Card>
    </>
  );
}

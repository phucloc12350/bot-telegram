'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle, CardSubtitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatDateTime } from '@/lib/utils';

async function api(url) {
  const res = await fetch(url, { cache: 'no-store' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false)
    throw new Error(json?.error?.message || `Request failed (${res.status})`);
  return json.data;
}

export function TelegramLogs() {
  const [data, setData] = useState({ items: [], page: 1, pages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [botType, setBotType] = useState('');
  const [viewing, setViewing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20' });
      if (status) qs.set('status', status);
      if (botType) qs.set('botType', botType);
      const d = await api(`/api/telegram/logs?${qs.toString()}`);
      setData(d);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, status, botType]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader
        title="Lịch sử thông báo Telegram"
        description="Toàn bộ tin nhắn đã gửi (cron + thủ công + command)."
      />

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-primary-600 dark:text-dark-muted">
              Trạng thái
            </label>
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILED">FAILED</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-primary-600 dark:text-dark-muted">
              Loại bot
            </label>
            <Select
              value={botType}
              onChange={(e) => {
                setBotType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả</option>
              <option value="GOLD">GOLD</option>
              <option value="FUEL">FUEL</option>
              <option value="ALERT">ALERT</option>
              <option value="MANUAL">MANUAL</option>
              <option value="OTHER">OTHER</option>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" className="w-full" onClick={load}>
              Tải lại
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <DataTable
          loading={loading}
          data={data.items}
          rowKey={(r) => r.id}
          emptyMessage="Chưa có log"
          onRowClick={(r) => setViewing(r)}
          columns={[
            { key: 'sentAt', header: 'Thời gian', render: (r) => formatDateTime(r.sentAt) },
            { key: 'botType', header: 'Loại', render: (r) => <Badge tone="info">{r.botType}</Badge> },
            { key: 'trigger', header: 'Trigger', render: (r) => <Badge>{r.trigger}</Badge> },
            { key: 'chatId', header: 'Chat ID', render: (r) => <code className="text-xs">{r.chatId || '—'}</code> },
            {
              key: 'status',
              header: 'Status',
              render: (r) => (
                <Badge tone={r.status === 'SUCCESS' ? 'success' : 'danger'}>{r.status}</Badge>
              ),
            },
            {
              key: 'preview',
              header: 'Preview',
              render: (r) => (
                <span className="line-clamp-1 max-w-xs text-xs text-primary-600 dark:text-dark-muted">
                  {(r.message || '').replace(/<[^>]+>/g, '').slice(0, 80)}
                </span>
              ),
            },
          ]}
        />

        {data.pages > 1 && (
          <div className="flex items-center justify-between border-t border-primary-100 p-3 dark:border-dark-border">
            <p className="text-xs text-primary-500 dark:text-dark-muted">
              Trang {data.page}/{data.pages} · Tổng {data.total} bản ghi
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ← Trước
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= data.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau →
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Chi tiết log"
        size="lg"
      >
        {viewing && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-primary-500">Thời gian</p>
                <p className="font-medium">{formatDateTime(viewing.sentAt)}</p>
              </div>
              <div>
                <p className="text-xs text-primary-500">Status</p>
                <Badge tone={viewing.status === 'SUCCESS' ? 'success' : 'danger'}>{viewing.status}</Badge>
              </div>
              <div>
                <p className="text-xs text-primary-500">Bot type</p>
                <Badge tone="info">{viewing.botType}</Badge>
              </div>
              <div>
                <p className="text-xs text-primary-500">Trigger</p>
                <Badge>{viewing.trigger}</Badge>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-primary-500">Chat ID</p>
                <code className="text-xs">{viewing.chatId || '—'}</code>
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs text-primary-500">Message</p>
              <pre className="scrollbar-thin max-h-72 overflow-auto rounded border border-primary-100 bg-primary-50/40 p-3 text-xs dark:border-dark-border dark:bg-dark-bg/40">
                {viewing.message}
              </pre>
            </div>
            {viewing.errorMessage && (
              <div>
                <p className="mb-1 text-xs text-primary-500">Error</p>
                <pre className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  {viewing.errorMessage}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

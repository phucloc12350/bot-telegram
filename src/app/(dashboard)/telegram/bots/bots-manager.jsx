'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Bot, Pencil, Plus, Send, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle, CardSubtitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input, Label, FieldError } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatDateTime } from '@/lib/utils';

const formSchema = z.object({
  botName: z.string().min(1, 'Tên bot không được trống'),
  botType: z.enum(['GOLD', 'FUEL', 'ALERT', 'MANUAL', 'OTHER']),
  chatId: z.string().min(1, 'Chat ID không được trống'),
  isActive: z.boolean().default(true),
  cronExpression: z.string().optional().or(z.literal('')),
  messageTemplate: z.string().optional().or(z.literal('')),
});

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

export function BotsManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      botName: '',
      botType: 'GOLD',
      chatId: '',
      isActive: true,
      cronExpression: '',
      messageTemplate: '',
    },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api('GET', '/api/telegram/settings');
      setItems(d.items || []);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    reset({
      botName: '',
      botType: 'GOLD',
      chatId: '',
      isActive: true,
      cronExpression: '',
      messageTemplate: '',
    });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    reset({
      botName: row.botName,
      botType: row.botType,
      chatId: row.chatId,
      isActive: row.isActive,
      cronExpression: row.cronExpression || '',
      messageTemplate: row.messageTemplate || '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = { ...data, cronExpression: data.cronExpression || null, messageTemplate: data.messageTemplate || null };
      if (editing) {
        await api('PUT', `/api/telegram/settings/${editing.id}`, payload);
        toast.success('Cập nhật bot thành công');
      } else {
        await api('POST', '/api/telegram/settings', payload);
        toast.success('Tạo bot thành công');
      }
      setModalOpen(false);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onToggle = async (row) => {
    try {
      await api('PATCH', `/api/telegram/settings/${row.id}/toggle`);
      toast.success(`Đã ${row.isActive ? 'tắt' : 'bật'} ${row.botName}`);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const onDelete = async (row) => {
    if (!confirm(`Xoá bot "${row.botName}"?`)) return;
    try {
      await api('DELETE', `/api/telegram/settings/${row.id}`);
      toast.success('Đã xoá');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const onTestSend = async (row) => {
    try {
      const r = await api('POST', '/api/telegram/test-send', { chatId: row.chatId });
      if (r.ok) toast.success(`Đã gửi test tới ${row.botName}`);
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Quản lý bot Telegram"
        description="Cấu hình các bot gửi tự động (cron) và đích nhận tin."
        actions={
          <Button leftIcon={<Plus size={16} />} onClick={openCreate}>
            Thêm bot
          </Button>
        }
      />

      <Card className="p-0">
        <DataTable
          loading={loading}
          data={items}
          rowKey={(r) => r.id}
          emptyMessage="Chưa có bot nào. Bấm “Thêm bot” để cấu hình."
          columns={[
            {
              key: 'botName',
              header: 'Tên bot',
              render: (r) => (
                <div>
                  <div className="font-medium text-primary-900 dark:text-dark-text">{r.botName}</div>
                  <div className="text-xs text-primary-500 dark:text-dark-muted">{r.chatId}</div>
                </div>
              ),
            },
            { key: 'botType', header: 'Loại', render: (r) => <Badge tone="info">{r.botType}</Badge> },
            {
              key: 'cronExpression',
              header: 'Cron',
              render: (r) => (
                <code className="text-xs">{r.cronExpression || '—'}</code>
              ),
            },
            {
              key: 'isActive',
              header: 'Trạng thái',
              render: (r) => (
                <Badge tone={r.isActive ? 'success' : 'default'}>
                  {r.isActive ? 'Đang bật' : 'Đang tắt'}
                </Badge>
              ),
            },
            {
              key: 'updatedAt',
              header: 'Cập nhật',
              render: (r) => formatDateTime(r.updatedAt),
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (r) => (
                <div className="flex items-center justify-end gap-1">
                  <Button size="sm" variant="ghost" onClick={() => onTestSend(r)} title="Gửi test">
                    <Send size={14} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(r)} title="Sửa">
                    <Pencil size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant={r.isActive ? 'outline' : 'success'}
                    onClick={() => onToggle(r)}
                  >
                    {r.isActive ? 'Tắt' : 'Bật'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(r)} title="Xoá">
                    <Trash2 size={14} className="text-danger" />
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Card>
        <CardTitle>Mẹo cấu hình</CardTitle>
        <CardSubtitle className="mt-1">
          • <code>chatId</code> lấy bằng cách gửi tin nhắn cho bot rồi mở{' '}
          <code>https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code>
          <br />• <code>cronExpression</code> theo chuẩn 5 trường (vd: <code>0 8 * * *</code> =
          8h sáng mỗi ngày)
          <br />• Bot type <Badge tone="info">GOLD</Badge>/<Badge tone="info">FUEL</Badge> sẽ nhận
          message từ cron tương ứng và nút "Gửi Telegram" trong các trang module.
        </CardSubtitle>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Sửa bot: ${editing.botName}` : 'Thêm bot mới'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={handleSubmit(onSubmit)} loading={submitting}>
              {editing ? 'Cập nhật' : 'Tạo'}
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Tên bot *</Label>
              <Input placeholder="Daily Gold Report" {...register('botName')} error={errors.botName} />
              <FieldError message={errors.botName?.message} />
            </div>
            <div>
              <Label>Loại *</Label>
              <Select {...register('botType')}>
                <option value="GOLD">GOLD — Giá vàng</option>
                <option value="FUEL">FUEL — Giá xăng</option>
                <option value="ALERT">ALERT — Cảnh báo</option>
                <option value="MANUAL">MANUAL</option>
                <option value="OTHER">OTHER</option>
              </Select>
            </div>
          </div>

          <div>
            <Label>Chat ID *</Label>
            <Input placeholder="-1001234567890 hoặc 123456789" {...register('chatId')} error={errors.chatId} />
            <FieldError message={errors.chatId?.message} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Cron expression</Label>
              <Input placeholder="0 8 * * *" {...register('cronExpression')} />
              <p className="mt-1 text-xs text-primary-500 dark:text-dark-muted">
                Để trống nếu chỉ gửi thủ công.
              </p>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register('isActive')} className="h-4 w-4 rounded" />
                <span className="text-sm">Kích hoạt ngay</span>
              </label>
            </div>
          </div>

          <div>
            <Label>Message template (tuỳ chọn)</Label>
            <textarea
              rows={3}
              className="input-base"
              placeholder="Để trống để dùng template mặc định"
              {...register('messageTemplate')}
            />
          </div>
        </form>
      </Modal>
    </>
  );
}

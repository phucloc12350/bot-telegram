'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';

export function TelegramTestForm() {
  const [chatId, setChatId] = useState('');
  const [message, setMessage] = useState(
    '🤖 <b>Test message</b>\nĐây là tin nhắn kiểm thử từ Bot Telegram Dashboard.',
  );
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/telegram/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: chatId || undefined, message }),
      });
      const json = await res.json();
      if (!res.ok || json?.success === false)
        throw new Error(json?.error?.message || 'Gửi thất bại');
      toast.success('Đã gửi tin nhắn test');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="grid grid-cols-1 gap-3 lg:grid-cols-3" onSubmit={onSubmit}>
      <div>
        <Label>Chat ID</Label>
        <Input
          placeholder="Để trống → dùng TELEGRAM_DEFAULT_CHAT_ID"
          value={chatId}
          onChange={(e) => setChatId(e.target.value)}
        />
      </div>
      <div className="lg:col-span-2">
        <Label>Message (HTML)</Label>
        <textarea
          rows={3}
          className="input-base"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <div className="lg:col-span-3">
        <Button type="submit" leftIcon={<Send size={16} />} loading={submitting}>
          Gửi test
        </Button>
      </div>
    </form>
  );
}

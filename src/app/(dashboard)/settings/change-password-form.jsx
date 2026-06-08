'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input, Label, FieldError } from '@/components/ui/Input';

const schema = z
  .object({
    oldPassword: z.string().min(6, 'Tối thiểu 6 ký tự'),
    newPassword: z.string().min(6, 'Tối thiểu 6 ký tự'),
    confirm: z.string().min(6),
  })
  .refine((v) => v.newPassword === v.confirm, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['confirm'],
  });

export function ChangePasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: data.oldPassword,
          newPassword: data.newPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error?.message || 'Đổi mật khẩu thất bại');
      }
      toast.success('Đổi mật khẩu thành công');
      reset();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <Label>Mật khẩu hiện tại</Label>
        <Input type="password" autoComplete="current-password" {...register('oldPassword')} />
        <FieldError message={errors.oldPassword?.message} />
      </div>
      <div>
        <Label>Mật khẩu mới</Label>
        <Input type="password" autoComplete="new-password" {...register('newPassword')} />
        <FieldError message={errors.newPassword?.message} />
      </div>
      <div>
        <Label>Nhập lại mật khẩu mới</Label>
        <Input type="password" autoComplete="new-password" {...register('confirm')} />
        <FieldError message={errors.confirm?.message} />
      </div>
      <Button type="submit" loading={submitting}>
        Cập nhật
      </Button>
    </form>
  );
}

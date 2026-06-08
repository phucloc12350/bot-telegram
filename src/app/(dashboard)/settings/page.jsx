import { auth } from '@/lib/auth';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle, CardSubtitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ChangePasswordForm } from './change-password-form';
import { TelegramTestForm } from './telegram-test-form';

export const metadata = { title: 'Cài đặt' };
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <>
      <PageHeader title="Cài đặt" description="Tài khoản và tuỳ chọn hệ thống." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Tài khoản</CardTitle>
          <CardSubtitle className="mt-1">Thông tin admin đang đăng nhập</CardSubtitle>
          <dl className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-xs text-primary-500 dark:text-dark-muted">Tên</dt>
              <dd className="text-sm font-medium">{user?.name || '—'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-xs text-primary-500 dark:text-dark-muted">Email</dt>
              <dd className="text-sm font-medium">{user?.email || '—'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-xs text-primary-500 dark:text-dark-muted">Vai trò</dt>
              <dd>
                <Badge tone="info">{user?.role || 'ADMIN'}</Badge>
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardTitle>Đổi mật khẩu</CardTitle>
          <CardSubtitle className="mt-1">Tối thiểu 6 ký tự.</CardSubtitle>
          <div className="mt-4">
            <ChangePasswordForm />
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>Test gửi Telegram</CardTitle>
        <CardSubtitle className="mt-1">
          Kiểm tra kết nối bot bằng cách gửi tin nhắn test tới 1 chat ID.
        </CardSubtitle>
        <div className="mt-4">
          <TelegramTestForm />
        </div>
      </Card>
    </>
  );
}

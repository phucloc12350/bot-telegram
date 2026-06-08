import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { jsonOk, jsonError, handleApiError } from '@/lib/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(6).max(72),
});

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) return jsonError(401, 'Chưa đăng nhập');

    const body = await req.json();
    const { oldPassword, newPassword } = schema.parse(body);

    const user = await prisma.user.findUnique({ where: { id: Number(session.user.id) } });
    if (!user) return jsonError(404, 'User không tồn tại');

    const ok = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!ok) return jsonError(400, 'Mật khẩu hiện tại không đúng');

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return jsonOk({ updated: true });
  } catch (err) {
    return handleApiError(err);
  }
}

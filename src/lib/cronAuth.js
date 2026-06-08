import { NextResponse } from 'next/server';

/**
 * Verify request đến từ Vercel Cron hoặc client có secret hợp lệ.
 * Vercel Cron tự inject header: Authorization: Bearer <CRON_SECRET>
 * Khi gọi tay (ví dụ cron-job.org), cũng dùng cùng pattern này.
 */
export function verifyCronRequest(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Cho phép gọi tự do khi chưa set secret (DEV)
    return null;
  }
  const authz = req.headers.get('authorization') || '';
  const token = authz.startsWith('Bearer ') ? authz.slice(7) : authz;
  if (token !== secret) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }
  return null;
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const checks = { app: 'ok', db: 'unknown' };
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = 'ok';
  } catch {
    checks.db = 'fail';
  }
  const ok = checks.db === 'ok';
  return NextResponse.json(
    { success: ok, data: { ...checks, time: new Date().toISOString() } },
    { status: ok ? 200 : 503 },
  );
}

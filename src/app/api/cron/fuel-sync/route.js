import { NextResponse } from 'next/server';
import { syncFuelPrices, sendLatestFuelTelegram } from '@/server/services/fuel.service';
import { verifyCronRequest } from '@/lib/cronAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req) {
  const fail = verifyCronRequest(req);
  if (fail) return fail;

  try {
    const sync = await syncFuelPrices();
    const send = await sendLatestFuelTelegram({ trigger: 'CRON' });
    return NextResponse.json({
      ok: true,
      inserted: sync.inserted,
      sent: send.sent,
      time: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[cron/fuel-sync]', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export const POST = GET;

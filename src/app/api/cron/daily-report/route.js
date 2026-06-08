import { NextResponse } from 'next/server';
import {
  sendGoldStatsTelegram,
  sendLatestGoldTelegram,
} from '@/server/services/gold.service';
import {
  sendFuelStatsTelegram,
  sendLatestFuelTelegram,
} from '@/server/services/fuel.service';
import { verifyCronRequest } from '@/lib/cronAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req) {
  const fail = verifyCronRequest(req);
  if (fail) return fail;

  const result = { ok: true, time: new Date().toISOString(), parts: {} };
  try {
    const goldLatest = await sendLatestGoldTelegram({ trigger: 'CRON' });
    const goldStats = await sendGoldStatsTelegram({ range: '7d', trigger: 'CRON' });
    result.parts.gold = { latestSent: goldLatest.sent, statsSent: goldStats.sent };
  } catch (e) {
    result.parts.gold = { error: e.message };
  }

  try {
    const fuelLatest = await sendLatestFuelTelegram({ trigger: 'CRON' });
    const fuelStats = await sendFuelStatsTelegram({ range: '7d', trigger: 'CRON' });
    result.parts.fuel = { latestSent: fuelLatest.sent, statsSent: fuelStats.sent };
  } catch (e) {
    result.parts.fuel = { error: e.message };
  }

  return NextResponse.json(result);
}

export const POST = GET;

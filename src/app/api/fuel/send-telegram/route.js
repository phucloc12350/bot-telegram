import { sendLatestFuelTelegram, sendFuelStatsTelegram } from '@/server/services/fuel.service';
import { jsonOk, jsonError, handleApiError } from '@/lib/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const kind = body.kind || 'latest';

    if (kind === 'latest') return jsonOk(await sendLatestFuelTelegram({ trigger: 'MANUAL' }));
    if (kind === 'stats')
      return jsonOk(
        await sendFuelStatsTelegram({
          fuelType: body.fuelType || body.type,
          range: body.range || '7d',
          trigger: 'MANUAL',
        }),
      );
    return jsonError(400, 'Tham số "kind" không hợp lệ');
  } catch (err) {
    return handleApiError(err);
  }
}

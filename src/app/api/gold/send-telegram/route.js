import {
  sendLatestGoldTelegram,
  sendGoldStatsTelegram,
  sendGoldLatest3Telegram,
} from '@/server/services/gold.service';
import { jsonOk, jsonError, handleApiError } from '@/lib/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const kind = body.kind || 'latest';

    if (kind === 'latest') {
      const r = await sendLatestGoldTelegram({ trigger: 'MANUAL' });
      return jsonOk(r);
    }
    if (kind === 'stats') {
      const r = await sendGoldStatsTelegram({
        type: body.type,
        range: body.range || '7d',
        trigger: 'MANUAL',
      });
      return jsonOk(r);
    }
    if (kind === 'latest3') {
      const r = await sendGoldLatest3Telegram({ trigger: 'MANUAL' });
      return jsonOk(r);
    }
    return jsonError(400, 'Tham số "kind" không hợp lệ. Cho phép: latest | stats | latest3');
  } catch (err) {
    return handleApiError(err);
  }
}

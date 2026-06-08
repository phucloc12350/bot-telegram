import { toggleBotSetting } from '@/server/services/botSettings.service';
import { jsonOk, handleApiError } from '@/lib/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(_req, { params }) {
  try {
    const item = await toggleBotSetting(params.id);
    return jsonOk(item);
  } catch (err) {
    return handleApiError(err);
  }
}

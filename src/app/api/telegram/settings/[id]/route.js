import {
  updateBotSetting,
  deleteBotSetting,
} from '@/server/services/botSettings.service';
import { jsonOk, handleApiError } from '@/lib/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(req, { params }) {
  try {
    const body = await req.json();
    const item = await updateBotSetting(params.id, body);
    return jsonOk(item);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req, { params }) {
  try {
    await deleteBotSetting(params.id);
    return jsonOk({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}

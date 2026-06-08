import { listBotSettings, createBotSetting } from '@/server/services/botSettings.service';
import { jsonOk, handleApiError } from '@/lib/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await listBotSettings();
    return jsonOk({ items, count: items.length });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const item = await createBotSetting(body);
    return jsonOk(item, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

import { getGoldHistory } from '@/server/services/gold.service';
import { jsonOk, handleApiError } from '@/lib/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '7d';
    const type = searchParams.get('type') || undefined;
    const limit = Math.min(Number(searchParams.get('limit')) || 500, 2000);
    const items = await getGoldHistory({ range, type, limit });
    return jsonOk({ items, count: items.length, range, type });
  } catch (err) {
    return handleApiError(err);
  }
}

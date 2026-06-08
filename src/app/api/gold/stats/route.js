import { getGoldStats } from '@/server/services/gold.service';
import { jsonOk, handleApiError } from '@/lib/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '7d';
    const type = searchParams.get('type') || undefined;
    const stats = await getGoldStats({ range, type });
    return jsonOk({ ...stats, range, type });
  } catch (err) {
    return handleApiError(err);
  }
}

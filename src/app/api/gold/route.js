import { getLatestGoldByType } from '@/server/services/gold.service';
import { jsonOk, handleApiError } from '@/lib/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getLatestGoldByType();
    return jsonOk({ items: data, count: data.length });
  } catch (err) {
    return handleApiError(err);
  }
}

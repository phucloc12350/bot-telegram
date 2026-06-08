import { getFuelHistory } from '@/server/services/fuel.service';
import { buildCsvResponse } from '@/server/utils/csv';
import { handleApiError } from '@/lib/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '7d';
    const fuelType = searchParams.get('fuelType') || searchParams.get('type') || undefined;
    const items = await getFuelHistory({ range, fuelType, limit: 2000 });

    const stamp = new Date().toISOString().slice(0, 10);
    return buildCsvResponse(items, {
      filename: `fuel-${range}-${stamp}.csv`,
      fields: ['id', 'fuelType', 'price', 'source', 'recordedAt'],
    });
  } catch (err) {
    return handleApiError(err);
  }
}

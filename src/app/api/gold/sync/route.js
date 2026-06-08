import { syncGoldPrices } from '@/server/services/gold.service';
import { jsonOk, handleApiError } from '@/lib/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = await syncGoldPrices();
    return jsonOk({
      inserted: result.inserted,
      recordedAt: result.recordedAt,
      previewCount: result.items.length,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

import { syncFuelPrices } from '@/server/services/fuel.service';
import { jsonOk, handleApiError } from '@/lib/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const r = await syncFuelPrices();
    return jsonOk({ inserted: r.inserted, recordedAt: r.recordedAt });
  } catch (err) {
    return handleApiError(err);
  }
}

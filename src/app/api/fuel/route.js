import { getLatestFuelByType } from '@/server/services/fuel.service';
import { jsonOk, handleApiError } from '@/lib/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await getLatestFuelByType();
    return jsonOk({ items, count: items.length });
  } catch (err) {
    return handleApiError(err);
  }
}

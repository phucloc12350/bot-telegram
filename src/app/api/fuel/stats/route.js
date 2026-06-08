import { getFuelStats } from '@/server/services/fuel.service';
import { jsonOk, handleApiError } from '@/lib/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '7d';
    const fuelType = searchParams.get('fuelType') || searchParams.get('type') || undefined;
    const stats = await getFuelStats({ range, fuelType });
    return jsonOk({ ...stats, range, fuelType });
  } catch (err) {
    return handleApiError(err);
  }
}

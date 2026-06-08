import { getTodayLatest3Gold } from '@/server/services/gold.service';
import { jsonOk, handleApiError } from '@/lib/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await getTodayLatest3Gold();
    return jsonOk({ items, count: items.length });
  } catch (err) {
    return handleApiError(err);
  }
}

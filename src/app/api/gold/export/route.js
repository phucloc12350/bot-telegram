import { getGoldHistory } from '@/server/services/gold.service';
import { buildCsvResponse } from '@/server/utils/csv';
import { handleApiError } from '@/lib/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '7d';
    const type = searchParams.get('type') || undefined;
    const items = await getGoldHistory({ range, type, limit: 2000 });

    const rows = items.map((it) => ({
      id: it.id,
      type: it.type,
      buy: it.buy,
      sell: it.sell,
      source: it.source,
      recordedAt: it.recordedAt,
    }));

    const stamp = new Date().toISOString().slice(0, 10);
    return buildCsvResponse(rows, {
      filename: `gold-${range}-${stamp}.csv`,
      fields: ['id', 'type', 'buy', 'sell', 'source', 'recordedAt'],
    });
  } catch (err) {
    return handleApiError(err);
  }
}

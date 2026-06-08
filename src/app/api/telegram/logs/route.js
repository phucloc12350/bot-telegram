import { prisma } from '@/lib/db';
import { jsonOk, handleApiError } from '@/lib/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
    const status = searchParams.get('status');
    const botType = searchParams.get('botType');

    const where = {};
    if (status) where.status = status;
    if (botType) where.botType = botType;

    const [items, total] = await Promise.all([
      prisma.telegramLog.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.telegramLog.count({ where }),
    ]);

    return jsonOk({
      items: items.map((r) => ({
        ...r,
        id: String(r.id),
        sentAt: r.sentAt.toISOString(),
        createdAt: r.createdAt.toISOString(),
      })),
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

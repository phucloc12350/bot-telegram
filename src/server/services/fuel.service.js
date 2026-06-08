import { prisma } from '@/lib/db';
import { fetchLatestFuelPrices } from '@/server/providers/fuel.provider';
import { broadcastByBotType } from '@/server/services/telegram.service';
import { formatFuelLatestHtml, formatFuelStatsHtml } from '@/server/formatters/fuel.formatter';
import { rangeToDate } from '@/lib/utils';

export async function syncFuelPrices() {
  const { items, recordedAt } = await fetchLatestFuelPrices({ allowMock: true });
  if (!items.length) return { inserted: 0, items: [], recordedAt };
  const data = items.map((it) => ({
    fuelType: it.fuelType,
    price: it.price,
    source: it.source,
    recordedAt: it.recordedAt || recordedAt,
  }));
  await prisma.fuelPrice.createMany({ data });
  return { inserted: data.length, items, recordedAt };
}

export async function getLatestFuelByType() {
  const rows = await prisma.$queryRaw`
    SELECT DISTINCT ON (fuel_type) id, fuel_type AS "fuelType", price, source,
           recorded_at AS "recordedAt"
    FROM fuel_prices
    ORDER BY fuel_type, recorded_at DESC
  `;
  return rows.map(serializeRow);
}

export async function getFuelHistory({ fuelType, range = '7d', limit = 500 }) {
  const { from } = rangeToDate(range);
  const where = { recordedAt: { gte: from } };
  if (fuelType) where.fuelType = fuelType;
  const rows = await prisma.fuelPrice.findMany({
    where,
    orderBy: { recordedAt: 'desc' },
    take: limit,
  });
  return rows.map(serializeRow);
}

export async function getFuelStats({ fuelType, range = '7d' }) {
  const { from } = rangeToDate(range);
  const where = { recordedAt: { gte: from } };
  if (fuelType) where.fuelType = fuelType;
  const agg = await prisma.fuelPrice.aggregate({
    where,
    _min: { price: true },
    _max: { price: true },
    _avg: { price: true },
    _count: true,
  });
  return {
    count: agg._count,
    min: Number(agg._min.price ?? 0),
    max: Number(agg._max.price ?? 0),
    avg: Number(agg._avg.price ?? 0),
  };
}

export async function sendLatestFuelTelegram({ trigger = 'MANUAL' } = {}) {
  const latest = await getLatestFuelByType();
  const recordedAt = latest[0]?.recordedAt || new Date();
  const html = formatFuelLatestHtml(latest, recordedAt);
  const results = await broadcastByBotType({ botType: 'FUEL', message: html, trigger });
  return { sent: results.length, message: html };
}

export async function sendFuelStatsTelegram({ fuelType, range = '7d', trigger = 'MANUAL' } = {}) {
  const stats = await getFuelStats({ fuelType, range });
  const latestList = await getLatestFuelByType();
  const latest = fuelType ? latestList.find((x) => x.fuelType === fuelType) : latestList[0];
  const html = formatFuelStatsHtml({
    fuelType: fuelType || latest?.fuelType || 'Tất cả',
    range,
    stats,
    latest,
  });
  const results = await broadcastByBotType({ botType: 'FUEL', message: html, trigger });
  return { sent: results.length, message: html };
}

function serializeRow(r) {
  return {
    id: String(r.id),
    fuelType: r.fuelType,
    price: Number(r.price ?? 0),
    source: r.source,
    recordedAt: r.recordedAt instanceof Date ? r.recordedAt.toISOString() : r.recordedAt,
  };
}

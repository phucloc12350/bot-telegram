import { prisma } from '@/lib/db';
import { fetchLatestGoldPrices } from '@/server/providers/gold.provider';
import { broadcastByBotType } from '@/server/services/telegram.service';
import {
  formatGoldLatestHtml,
  formatGoldStatsHtml,
  formatGoldLatest3Html,
} from '@/server/formatters/gold.formatter';
import { rangeToDate } from '@/lib/utils';

/** Sync giá vàng từ provider vào DB. Trả về số bản ghi đã insert. */
export async function syncGoldPrices() {
  const { items, recordedAt } = await fetchLatestGoldPrices({ allowMock: true });
  if (!items.length) return { inserted: 0, items: [], recordedAt };

  const data = items.map((it) => ({
    type: it.type,
    buyPrice: it.buy,
    sellPrice: it.sell,
    source: it.source,
    recordedAt: it.recordedAt || recordedAt,
  }));

  await prisma.goldPrice.createMany({ data });
  return { inserted: data.length, items, recordedAt };
}

/** Lấy giá mới nhất theo từng `type`. */
export async function getLatestGoldByType() {
  const rows = await prisma.$queryRaw`
    SELECT DISTINCT ON (type) id, type, buy_price AS "buyPrice", sell_price AS "sellPrice",
           source, recorded_at AS "recordedAt"
    FROM gold_prices
    ORDER BY type, recorded_at DESC
  `;
  return rows.map(serializeRow);
}

/** Lịch sử theo type + range. */
export async function getGoldHistory({ type, range = '7d', limit = 500 }) {
  const { from } = rangeToDate(range);
  const where = { recordedAt: { gte: from } };
  if (type) where.type = type;
  const rows = await prisma.goldPrice.findMany({
    where,
    orderBy: { recordedAt: 'desc' },
    take: limit,
  });
  return rows.map(serializeRow);
}

/** 3 mốc gần nhất hôm nay (cross-type). */
export async function getTodayLatest3Gold() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const rows = await prisma.goldPrice.findMany({
    where: { recordedAt: { gte: start } },
    orderBy: { recordedAt: 'desc' },
    take: 3,
  });
  return rows.map(serializeRow);
}

/** Stats min/max/avg cho 1 type trong range. */
export async function getGoldStats({ type, range = '7d' }) {
  const { from } = rangeToDate(range);
  const where = { recordedAt: { gte: from } };
  if (type) where.type = type;
  const agg = await prisma.goldPrice.aggregate({
    where,
    _min: { sellPrice: true, buyPrice: true },
    _max: { sellPrice: true, buyPrice: true },
    _avg: { sellPrice: true, buyPrice: true },
    _count: true,
  });
  return {
    count: agg._count,
    min: Number(agg._min.sellPrice ?? 0),
    max: Number(agg._max.sellPrice ?? 0),
    avg: Number(agg._avg.sellPrice ?? 0),
    minBuy: Number(agg._min.buyPrice ?? 0),
    maxBuy: Number(agg._max.buyPrice ?? 0),
    avgBuy: Number(agg._avg.buyPrice ?? 0),
  };
}

/** Gửi snapshot mới nhất qua bot (broadcast tới tất cả bot GOLD active). */
export async function sendLatestGoldTelegram({ trigger = 'MANUAL' } = {}) {
  const latest = await getLatestGoldByType();
  const recordedAt = latest[0]?.recordedAt || new Date();
  const html = formatGoldLatestHtml(latest, recordedAt);
  const results = await broadcastByBotType({ botType: 'GOLD', message: html, trigger });
  return { sent: results.length, results, message: html };
}

/** Gửi stats 7 ngày qua bot. */
export async function sendGoldStatsTelegram({ type, range = '7d', trigger = 'MANUAL' } = {}) {
  const stats = await getGoldStats({ type, range });
  const latestList = await getLatestGoldByType();
  const latest = type ? latestList.find((x) => x.type === type) : latestList[0];
  const html = formatGoldStatsHtml({ type: type || latest?.type || 'Tất cả', range, stats, latest });
  const results = await broadcastByBotType({ botType: 'GOLD', message: html, trigger });
  return { sent: results.length, message: html };
}

/** Gửi 3 mốc gần nhất hôm nay qua bot. */
export async function sendGoldLatest3Telegram({ trigger = 'MANUAL' } = {}) {
  const rows = await getTodayLatest3Gold();
  const html = formatGoldLatest3Html(rows);
  const results = await broadcastByBotType({ botType: 'GOLD', message: html, trigger });
  return { sent: results.length, message: html };
}

// ---- helpers ----
function serializeRow(r) {
  return {
    id: String(r.id),
    type: r.type,
    buy: Number(r.buyPrice ?? r.buy ?? 0),
    sell: Number(r.sellPrice ?? r.sell ?? 0),
    source: r.source,
    recordedAt: r.recordedAt instanceof Date ? r.recordedAt.toISOString() : r.recordedAt,
  };
}

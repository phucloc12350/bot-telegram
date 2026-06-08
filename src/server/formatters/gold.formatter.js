import { formatCurrencyVnd, formatDateTime } from '@/lib/utils';

/** Build HTML message gửi Telegram cho snapshot giá vàng mới nhất. */
export function formatGoldLatestHtml(items, recordedAt) {
  if (!items?.length) return '<b>💰 Giá vàng</b>\nChưa có dữ liệu.';
  const lines = [
    `<b>💰 Giá vàng cập nhật</b>`,
    `🕒 ${formatDateTime(recordedAt)}`,
    '',
  ];
  for (const it of items.slice(0, 10)) {
    lines.push(`• <b>${escapeHtml(it.type)}</b>`);
    lines.push(`  Mua: ${formatCurrencyVnd(it.buy)} | Bán: ${formatCurrencyVnd(it.sell)}`);
  }
  if (items.length > 10) lines.push(`\n<i>...và ${items.length - 10} mục khác</i>`);
  return lines.join('\n');
}

/** Build report 7 ngày cho 1 type cụ thể. */
export function formatGoldStatsHtml({ type, range, stats, latest }) {
  if (!stats || stats.count === 0) {
    return `<b>📊 Thống kê vàng (${escapeHtml(type)})</b>\nChưa có dữ liệu trong khoảng ${range}.`;
  }
  const lines = [
    `<b>📊 Thống kê vàng</b>`,
    `Loại: <b>${escapeHtml(type)}</b>`,
    `Khoảng: ${range}`,
    `Số bản ghi: ${stats.count}`,
    '',
    `Min bán: ${formatCurrencyVnd(stats.min)}`,
    `Max bán: ${formatCurrencyVnd(stats.max)}`,
    `TB bán: ${formatCurrencyVnd(stats.avg)}`,
  ];
  if (latest) {
    lines.push('');
    lines.push(`Mới nhất: Mua ${formatCurrencyVnd(latest.buy)} | Bán ${formatCurrencyVnd(latest.sell)}`);
    lines.push(`🕒 ${formatDateTime(latest.recordedAt)}`);
  }
  return lines.join('\n');
}

/** 3 mốc gần nhất hôm nay. */
export function formatGoldLatest3Html(rows) {
  if (!rows?.length) return '<b>📈 3 mốc giá vàng gần nhất</b>\nChưa có dữ liệu hôm nay.';
  const lines = ['<b>📈 3 mốc giá vàng gần nhất hôm nay</b>', ''];
  for (const r of rows) {
    lines.push(`• <b>${escapeHtml(r.type)}</b> — 🕒 ${formatDateTime(r.recordedAt)}`);
    lines.push(`  Mua ${formatCurrencyVnd(r.buy)} | Bán ${formatCurrencyVnd(r.sell)}`);
  }
  return lines.join('\n');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

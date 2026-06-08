import { formatCurrencyVnd, formatDateTime } from '@/lib/utils';

export function formatFuelLatestHtml(items, recordedAt) {
  if (!items?.length) return '<b>⛽ Giá xăng dầu</b>\nChưa có dữ liệu.';
  const lines = [
    '<b>⛽ Giá xăng dầu cập nhật</b>',
    `🕒 ${formatDateTime(recordedAt)}`,
    '',
  ];
  for (const it of items) {
    lines.push(`• <b>${escapeHtml(it.fuelType)}</b>: ${formatCurrencyVnd(it.price)}/lít`);
  }
  return lines.join('\n');
}

export function formatFuelStatsHtml({ fuelType, range, stats, latest }) {
  if (!stats || stats.count === 0) {
    return `<b>📊 Thống kê giá xăng (${escapeHtml(fuelType)})</b>\nChưa có dữ liệu trong khoảng ${range}.`;
  }
  const lines = [
    '<b>📊 Thống kê giá xăng</b>',
    `Loại: <b>${escapeHtml(fuelType)}</b>`,
    `Khoảng: ${range}`,
    `Số bản ghi: ${stats.count}`,
    '',
    `Min: ${formatCurrencyVnd(stats.min)}`,
    `Max: ${formatCurrencyVnd(stats.max)}`,
    `TB: ${formatCurrencyVnd(stats.avg)}`,
  ];
  if (latest) {
    lines.push('');
    lines.push(`Mới nhất: ${formatCurrencyVnd(latest.price)} (🕒 ${formatDateTime(latest.recordedAt)})`);
  }
  return lines.join('\n');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

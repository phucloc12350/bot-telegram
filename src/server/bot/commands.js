import { prisma } from '@/lib/db';
import {
  getLatestGoldByType,
  getGoldStats,
  getTodayLatest3Gold,
} from '@/server/services/gold.service';
import { getLatestFuelByType, getFuelStats } from '@/server/services/fuel.service';
import {
  formatGoldLatestHtml,
  formatGoldStatsHtml,
  formatGoldLatest3Html,
} from '@/server/formatters/gold.formatter';
import { formatFuelLatestHtml, formatFuelStatsHtml } from '@/server/formatters/fuel.formatter';

const HELP = [
  '<b>📖 Danh sách lệnh</b>',
  '',
  '/gia_vang_hien_tai — Giá vàng mới nhất',
  '/thong_ke_gia_vang_7_ngay — Thống kê vàng 7 ngày',
  '/thong_ke_3_moc_gio_gan_nhat — 3 mốc giá vàng gần nhất hôm nay',
  '',
  '/gia_xang_hien_tai — Giá xăng mới nhất',
  '/thong_ke_gia_xang_7_ngay — Thống kê xăng 7 ngày',
  '',
  '/help — Hiển thị trợ giúp',
].join('\n');

const WELCOME = [
  '<b>👋 Chào mừng tới Bot Telegram Dashboard!</b>',
  '',
  'Bot này cung cấp dữ liệu giá vàng, giá xăng và các thống kê liên quan.',
  '',
  'Gõ /help để xem các lệnh khả dụng.',
].join('\n');

/**
 * Trả về { reply: string, botType: BotType } từ 1 command.
 */
export async function handleCommand(text) {
  const cmd = text.split(/\s+/)[0].toLowerCase().replace(/@\w+$/, '');

  switch (cmd) {
    case '/start':
      return { reply: WELCOME, botType: 'OTHER' };

    case '/help':
      return { reply: HELP, botType: 'OTHER' };

    case '/gia_vang_hien_tai': {
      const latest = await getLatestGoldByType();
      const recordedAt = latest[0]?.recordedAt || new Date();
      return { reply: formatGoldLatestHtml(latest, recordedAt), botType: 'GOLD' };
    }

    case '/thong_ke_gia_vang_7_ngay': {
      const stats = await getGoldStats({ range: '7d' });
      const latestList = await getLatestGoldByType();
      return {
        reply: formatGoldStatsHtml({
          type: latestList[0]?.type || 'Tất cả',
          range: '7d',
          stats,
          latest: latestList[0],
        }),
        botType: 'GOLD',
      };
    }

    case '/thong_ke_3_moc_gio_gan_nhat': {
      const rows = await getTodayLatest3Gold();
      return { reply: formatGoldLatest3Html(rows), botType: 'GOLD' };
    }

    case '/gia_xang_hien_tai': {
      const latest = await getLatestFuelByType();
      const recordedAt = latest[0]?.recordedAt || new Date();
      return { reply: formatFuelLatestHtml(latest, recordedAt), botType: 'FUEL' };
    }

    case '/thong_ke_gia_xang_7_ngay': {
      const stats = await getFuelStats({ range: '7d' });
      const latestList = await getLatestFuelByType();
      return {
        reply: formatFuelStatsHtml({
          fuelType: latestList[0]?.fuelType || 'Tất cả',
          range: '7d',
          stats,
          latest: latestList[0],
        }),
        botType: 'FUEL',
      };
    }

    default:
      return {
        reply: `❓ Không rõ lệnh <code>${escapeHtml(cmd)}</code>. Gõ /help để xem danh sách.`,
        botType: 'OTHER',
      };
  }
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function logIncomingCommand({ chatId, command, reply, botType, status, errorMessage }) {
  return prisma.telegramLog.create({
    data: {
      botType,
      trigger: 'COMMAND',
      chatId: chatId ? String(chatId) : null,
      message: `[CMD: ${command}]\n${reply}`,
      status,
      errorMessage: errorMessage || null,
      sentAt: new Date(),
    },
  });
}

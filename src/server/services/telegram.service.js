import { prisma } from '@/lib/db';
import { sendTelegramMessage } from '@/lib/telegram';

/**
 * Gửi message + log vào DB.
 * @param {{
 *   chatId: string,
 *   message: string,
 *   botType?: 'GOLD'|'FUEL'|'ALERT'|'MANUAL'|'OTHER',
 *   trigger?: 'CRON'|'COMMAND'|'MANUAL',
 *   parseMode?: 'HTML'|'MarkdownV2',
 * }} args
 */
export async function sendAndLog({
  chatId,
  message,
  botType = 'MANUAL',
  trigger = 'MANUAL',
  parseMode = 'HTML',
}) {
  const sentAt = new Date();
  try {
    await sendTelegramMessage(chatId, message, { parseMode });
    const log = await prisma.telegramLog.create({
      data: { botType, trigger, chatId, message, status: 'SUCCESS', sentAt },
    });
    return { ok: true, logId: String(log.id) };
  } catch (err) {
    const errorMessage =
      err?.response?.data?.description || err?.message || 'Telegram send failed';
    const log = await prisma.telegramLog.create({
      data: {
        botType,
        trigger,
        chatId: chatId || null,
        message,
        status: 'FAILED',
        errorMessage,
        sentAt,
      },
    });
    return { ok: false, error: errorMessage, logId: String(log.id) };
  }
}

/** Broadcast message tới mọi BotSetting active có botType khớp. */
export async function broadcastByBotType({ botType, message, trigger = 'CRON' }) {
  const bots = await prisma.botSetting.findMany({
    where: { botType, isActive: true },
  });

  if (bots.length === 0 && process.env.TELEGRAM_DEFAULT_CHAT_ID) {
    return [await sendAndLog({
      chatId: process.env.TELEGRAM_DEFAULT_CHAT_ID,
      message,
      botType,
      trigger,
    })];
  }

  const results = [];
  for (const bot of bots) {
    results.push(await sendAndLog({ chatId: bot.chatId, message, botType, trigger }));
  }
  return results;
}

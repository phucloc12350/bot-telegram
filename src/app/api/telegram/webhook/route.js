import { NextResponse } from 'next/server';
import { handleCommand, logIncomingCommand } from '@/server/bot/commands';
import { sendTelegramMessage } from '@/lib/telegram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Telegram POST update vào đây.
 * Bảo vệ bằng header `X-Telegram-Bot-Api-Secret-Token`
 * (đã đăng ký qua setWebhook với secret_token).
 */
export async function POST(req) {
  const secretHeader = req.headers.get('x-telegram-bot-api-secret-token');
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expected && secretHeader !== expected) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  let update;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid body' }, { status: 400 });
  }

  const message = update?.message;
  const text = message?.text;
  const chatId = message?.chat?.id;

  if (!text || !chatId || !text.startsWith('/')) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    const { reply, botType } = await handleCommand(text);
    await sendTelegramMessage(chatId, reply, { parseMode: 'HTML' });
    await logIncomingCommand({
      chatId,
      command: text,
      reply,
      botType,
      status: 'SUCCESS',
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const errorMessage = err?.response?.data?.description || err?.message || 'Unknown error';
    console.error('[telegram webhook]', errorMessage);
    await logIncomingCommand({
      chatId,
      command: text,
      reply: '',
      botType: 'OTHER',
      status: 'FAILED',
      errorMessage,
    }).catch(() => {});
    try {
      await sendTelegramMessage(chatId, '⚠️ Có lỗi xử lý lệnh, vui lòng thử lại sau.');
    } catch {}
    return NextResponse.json({ ok: false, error: errorMessage }, { status: 200 });
    // Trả 200 để Telegram không retry liên tục
  }
}

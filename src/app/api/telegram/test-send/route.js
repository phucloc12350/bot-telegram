import { sendAndLog } from '@/server/services/telegram.service';
import { jsonOk, jsonError, handleApiError } from '@/lib/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const chatId = body.chatId || process.env.TELEGRAM_DEFAULT_CHAT_ID;
    if (!chatId) return jsonError(400, 'Thiếu chatId');
    const message =
      body.message ||
      '🤖 <b>Test message</b>\nĐây là tin nhắn kiểm thử từ Bot Telegram Dashboard.';

    const r = await sendAndLog({ chatId, message, botType: 'MANUAL', trigger: 'MANUAL' });
    if (!r.ok) return jsonError(502, r.error || 'Gửi thất bại');
    return jsonOk(r);
  } catch (err) {
    return handleApiError(err);
  }
}

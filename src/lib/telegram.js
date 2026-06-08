import axios from 'axios';

const TG_API = 'https://api.telegram.org';

function token() {
  const t = process.env.TELEGRAM_BOT_TOKEN;
  if (!t) throw new Error('TELEGRAM_BOT_TOKEN chưa được cấu hình');
  return t;
}

function escapeMarkdownV2(text) {
  if (text == null) return '';
  return String(text).replace(/[_*\[\]()~`>#+\-=|{}.!\\]/g, (m) => `\\${m}`);
}

export async function sendTelegramMessage(chatId, text, options = {}) {
  if (!chatId) throw new Error('Thiếu chatId');
  const url = `${TG_API}/bot${token()}/sendMessage`;
  const res = await axios.post(
    url,
    {
      chat_id: chatId,
      text,
      parse_mode: options.parseMode ?? 'HTML',
      disable_web_page_preview: true,
      ...options.payload,
    },
    { timeout: 8000 },
  );
  return res.data;
}

export async function answerTelegramWebhook(chatId, text, options) {
  try {
    return await sendTelegramMessage(chatId, text, options);
  } catch (err) {
    console.error('[telegram] sendMessage failed:', err?.response?.data || err.message);
    return null;
  }
}

export async function setTelegramWebhook(url, secretToken) {
  const apiUrl = `${TG_API}/bot${token()}/setWebhook`;
  const res = await axios.post(
    apiUrl,
    { url, secret_token: secretToken, allowed_updates: ['message'] },
    { timeout: 8000 },
  );
  return res.data;
}

export async function deleteTelegramWebhook() {
  const apiUrl = `${TG_API}/bot${token()}/deleteWebhook`;
  const res = await axios.post(apiUrl, {}, { timeout: 8000 });
  return res.data;
}

export { escapeMarkdownV2 };

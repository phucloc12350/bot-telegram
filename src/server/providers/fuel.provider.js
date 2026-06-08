import axios from 'axios';
import * as cheerio from 'cheerio';

const PETROLIMEX_URL_DEFAULT = 'https://www.petrolimex.com.vn/';

/**
 * Petrolimex hiển thị giá trên trang chủ trong widget #content-tab-1.
 * Cấu trúc HTML có thể đổi theo thời gian → wrapper trong try/catch + fallback mock.
 */
function parsePetrolimexHtml(html) {
  const $ = cheerio.load(html);
  const items = [];
  const recordedAt = new Date();

  // Tìm bảng giá: thường có table với class "price-table" hoặc các row trong widget
  $('table tr').each((_, tr) => {
    const tds = $(tr).find('td');
    if (tds.length < 2) return;
    const name = $(tds[0]).text().trim();
    const priceText = $(tds[1]).text().trim();
    const price = Number(priceText.replace(/[^\d]/g, ''));
    if (name && price > 5000 && price < 100000) {
      items.push({
        fuelType: normalizeFuelType(name),
        price,
        source: 'petrolimex.com.vn',
        recordedAt,
      });
    }
  });

  // Dedupe theo fuelType (giữ giá cuối)
  const map = new Map();
  for (const it of items) map.set(it.fuelType, it);
  return { recordedAt, items: Array.from(map.values()) };
}

function normalizeFuelType(name) {
  const s = name.replace(/\s+/g, ' ').trim();
  // Pattern hay gặp: "Xăng RON 95-V", "Xăng RON 95-III", "Xăng E5 RON 92-II", "DO 0,05S-II", "DO 0,001S-V"
  return s;
}

function mockProvider() {
  const now = new Date();
  const rand = (min, max) => Math.floor(min + Math.random() * (max - min));
  return {
    recordedAt: now,
    items: [
      { fuelType: 'Xăng RON 95-V', price: 22500 + rand(-300, 300), source: 'mock', recordedAt: now },
      { fuelType: 'Xăng RON 95-III', price: 22000 + rand(-300, 300), source: 'mock', recordedAt: now },
      { fuelType: 'Xăng E5 RON 92-II', price: 21000 + rand(-300, 300), source: 'mock', recordedAt: now },
      { fuelType: 'DO 0,05S-II', price: 19500 + rand(-300, 300), source: 'mock', recordedAt: now },
      { fuelType: 'DO 0,001S-V', price: 19800 + rand(-300, 300), source: 'mock', recordedAt: now },
      { fuelType: 'Dầu hoả', price: 19200 + rand(-200, 200), source: 'mock', recordedAt: now },
    ],
  };
}

/**
 * Fetch giá xăng từ Petrolimex; fallback mock khi scrape fail / không bóc được.
 */
export async function fetchLatestFuelPrices(opts = {}) {
  const { allowMock = true } = opts;
  const url = process.env.FUEL_API_URL?.trim() || PETROLIMEX_URL_DEFAULT;

  try {
    const res = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      responseType: 'text',
    });
    const html = typeof res.data === 'string' ? res.data : String(res.data);
    const parsed = parsePetrolimexHtml(html);
    if (parsed.items.length > 0) return parsed;
    if (allowMock) {
      console.warn('[fuel provider] empty parsed, fallback mock');
      return mockProvider();
    }
    return parsed;
  } catch (err) {
    console.warn('[fuel provider] fetch failed:', err.message);
    if (allowMock) return mockProvider();
    throw err;
  }
}

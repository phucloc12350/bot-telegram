import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

const SJC_XML_DEFAULT = 'https://sjc.com.vn/xml/tygiavang.xml';

/**
 * Normalize 1 entry từ XML SJC sang shape chuẩn:
 * { type, buy, sell, source, recordedAt }
 */
function parseSjcXml(xml) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: true,
    trimValues: true,
  });
  const json = parser.parse(xml);
  const ratelist = json?.root?.ratelist;
  if (!ratelist) return { recordedAt: new Date(), items: [] };

  const updatedAttr =
    ratelist['@_updated'] ||
    ratelist['@_update'] ||
    json?.root?.['@_updated'] ||
    null;
  let recordedAt = new Date();
  if (updatedAttr) {
    // SJC dùng format: "08/06/2026 10:00:00 SA" - cố parse, fallback now
    const d = new Date(updatedAttr);
    if (!Number.isNaN(d.getTime())) recordedAt = d;
  }

  const cities = Array.isArray(ratelist.city) ? ratelist.city : ratelist.city ? [ratelist.city] : [];
  const items = [];

  for (const city of cities) {
    const cityName = city['@_name'] || 'Unknown';
    const cityItems = Array.isArray(city.item) ? city.item : city.item ? [city.item] : [];
    for (const it of cityItems) {
      const type = it['@_type'] || 'Unknown';
      const buy = Number(String(it['@_buy'] ?? '').replace(/[^\d]/g, '')) || 0;
      const sell = Number(String(it['@_sell'] ?? '').replace(/[^\d]/g, '')) || 0;
      if (!buy && !sell) continue;
      items.push({
        type: `${type} - ${cityName}`,
        buy,
        sell,
        source: 'sjc.com.vn',
        recordedAt,
      });
    }
  }

  return { recordedAt, items };
}

/** Mock provider khi không thể fetch SJC */
function mockProvider() {
  const now = new Date();
  const base = 78_000_000;
  const rand = (min, max) => Math.floor(min + Math.random() * (max - min));
  return {
    recordedAt: now,
    items: [
      { type: 'SJC 1L, 10L, 1KG - Hồ Chí Minh', buy: base + rand(-200_000, 200_000), sell: base + rand(100_000, 400_000), source: 'mock', recordedAt: now },
      { type: 'SJC 1L, 10L, 1KG - Hà Nội', buy: base + rand(-200_000, 200_000), sell: base + rand(100_000, 400_000), source: 'mock', recordedAt: now },
      { type: 'Nhẫn SJC 99,99 1 chỉ, 2 chỉ, 5 chỉ', buy: 64_500_000 + rand(-100_000, 100_000), sell: 65_500_000 + rand(0, 300_000), source: 'mock', recordedAt: now },
    ],
  };
}

/**
 * Fetch latest từ SJC XML; nếu fail → trả mock.
 * @param {{ allowMock?: boolean }} opts
 */
export async function fetchLatestGoldPrices(opts = {}) {
  const { allowMock = true } = opts;
  const url = process.env.GOLD_API_URL?.trim() || SJC_XML_DEFAULT;
  const apiKey = process.env.GOLD_API_KEY?.trim() || '';
  if (!apiKey) {
    console.warn('[gold provider] API key is not set');
    return mockProvider();
  } 
  const myHeaders = {
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (BotDashboard) AppleWebKit/537.36',
  };
  const requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow',
    timeout: 8000,
  };
  try {
    const res = await fetch(url, requestOptions);
    if (!res.ok) {
      console.warn('[gold provider] fetch failed:', res.statusText);
      if (allowMock) return mockProvider();
      throw new Error(res.statusText);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('[gold provider] fetch failed:', err.message);
    if (allowMock) return mockProvider();
    throw err;
  }
}

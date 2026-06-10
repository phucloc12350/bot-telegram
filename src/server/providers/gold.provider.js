import * as cheerio from 'cheerio';
import { XMLParser } from 'fast-xml-parser';

const URL_24H_DEFAULT = 'https://www.24h.com.vn/gia-vang-hom-nay-c425.html';
const SJC_XML_DEFAULT = 'https://sjc.com.vn/xml/tygiavang.xml';

const HEADERS_HTML = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
};

/**
 * Parse HTML từ 24h.com.vn:
 * <table class="gia-vang-search-data-table"> chứa các row:
 *   <tr data-seach="sjc">
 *     <td><h2>SJC</h2></td>
 *     <td><span class="fixW">133,300</span></td>   ← buy (đơn vị: nghìn VND)
 *     <td><span class="fixW">138,300</span></td>   ← sell
 *   </tr>
 * Số "133,300" = 133.3 triệu VND/lượng → nhân 1000 để ra VND đầy đủ.
 */
function parse24hHtml(html) {
  const $ = cheerio.load(html);
  const recordedAt = new Date();
  const items = [];

  $('table.gia-vang-search-data-table tbody tr').each((_, tr) => {
    const $tr = $(tr);
    const name = $tr.find('h2').first().text().trim();
    if (!name) return;
    const prices = $tr
      .find('td span.fixW')
      .map((_, span) => $(span).text().trim())
      .get();
    if (prices.length < 2) return;
    const toVnd = (s) => Number(String(s).replace(/[^\d]/g, '')) * 1000;
    const buy = toVnd(prices[0]);
    const sell = toVnd(prices[1]);
    if (!buy && !sell) return;
    items.push({
      type: name,
      buy,
      sell,
      source: '24h.com.vn',
      recordedAt,
    });
  });

  return { recordedAt, items };
}

/**
 * Parse XML từ SJC chính chủ (https://sjc.com.vn/xml/tygiavang.xml).
 * Schema: <root><ratelist updated="..."><city name="..."><item type="..." buy="..." sell="..."/></city></ratelist></root>
 * (Hiện SJC có Cloudflare challenge, gọi từ serverless thường 403 — fallback sang 24h.)
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

/** Fallback khi cả 2 nguồn fail — KHÔNG còn dùng giá trị 78M cũ vì sai thực tế. */
function mockProvider() {
  const now = new Date();
  return {
    recordedAt: now,
    items: [
      { type: 'SJC (mock)', buy: 133_000_000, sell: 138_300_000, source: 'mock', recordedAt: now },
    ],
  };
}

/**
 * Fetch latest. Ưu tiên 24h.com.vn (HTML scrape).
 * Nếu set GOLD_API_URL = SJC XML → thử SJC trước (sẽ 403 trừ khi có proxy).
 * @param {{ allowMock?: boolean }} opts
 */
export async function fetchLatestGoldPrices(opts = {}) {
  const { allowMock = true } = opts;
  const customUrl = process.env.GOLD_API_URL?.trim();

  const tryUrl = async (url) => {
    const res = await fetch(url, {
      method: 'GET',
      headers: HEADERS_HTML,
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const text = await res.text();
    const looksXml = text.trimStart().startsWith('<?xml') || url.endsWith('.xml');
    return looksXml ? parseSjcXml(text) : parse24hHtml(text);
  };

  const candidates = customUrl ? [customUrl, URL_24H_DEFAULT] : [URL_24H_DEFAULT, SJC_XML_DEFAULT];

  for (const url of candidates) {
    try {
      const parsed = await tryUrl(url);
      if (parsed.items.length) return parsed;
      console.warn(`[gold provider] ${url} returned 0 items, try next`);
    } catch (err) {
      console.warn(`[gold provider] ${url} failed: ${err.message}`);
    }
  }

  if (allowMock) {
    console.warn('[gold provider] all sources failed, using mock');
    return mockProvider();
  }
  throw new Error('All gold price sources failed');
}

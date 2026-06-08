import { Parser } from 'json2csv';

/**
 * Tạo CSV Response từ array of objects.
 * @param {Array<object>} rows
 * @param {{ filename?: string, fields?: string[] }} opts
 */
export function buildCsvResponse(rows, opts = {}) {
  const { filename = 'export.csv', fields } = opts;
  const parser = new Parser({ fields, withBOM: true });
  const csv = parser.parse(rows || []);
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

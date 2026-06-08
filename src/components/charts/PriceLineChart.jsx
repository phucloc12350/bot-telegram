'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { useTheme } from 'next-themes';
import { formatCurrencyVnd, formatDateTime } from '@/lib/utils';

/**
 * @param {{
 *   data: Array<{ t: string|number, buy?: number, sell?: number, price?: number }>,
 *   series?: Array<{ key: string, name: string, color: string }>,
 *   height?: number,
 *   yDomain?: [number|string, number|string],
 *   compact?: boolean,
 * }} props
 */
export function PriceLineChart({
  data,
  series = [
    { key: 'buy', name: 'Mua vào', color: '#B98760' },
    { key: 'sell', name: 'Bán ra', color: '#8B5E3C' },
  ],
  height = 320,
  yDomain = ['auto', 'auto'],
  compact = false,
}) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === 'dark';

  const gridColor = dark ? '#3A322B' : '#E8CDA9';
  const tickColor = dark ? '#A89684' : '#6F4A2F';
  const tooltipBg = dark ? '#2A241F' : '#FFFFFF';
  const tooltipBorder = dark ? '#3A322B' : '#E8CDA9';

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 10, right: 16, left: compact ? 0 : 8, bottom: 0 }}
        >
          <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="t"
            stroke={tickColor}
            fontSize={11}
            tickLine={false}
            tickFormatter={(v) => formatTick(v)}
          />
          <YAxis
            stroke={tickColor}
            fontSize={11}
            tickLine={false}
            domain={yDomain}
            tickFormatter={(v) => compactNumber(v)}
            width={compact ? 40 : 70}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(v) => formatDateTime(v)}
            formatter={(value, name) => [formatCurrencyVnd(value), name]}
          />
          {!compact && <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />}
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              name={s.name}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatTick(v) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function compactNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'tr';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k';
  return String(n);
}

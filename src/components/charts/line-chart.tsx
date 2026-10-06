'use client';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatNumber } from '@/lib/format';

const AXIS = { fontSize: 14, fill: 'var(--color-text-muted)' };
export interface TrendDatum {
  name: string;
  stock: number;
  actual: number;
}

export function TrendLineChart({ data }: { data: TrendDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={AXIS} />
        <YAxis tick={AXIS} width={80} tickFormatter={(v: number) => formatNumber(v)} />
        <Tooltip formatter={(v) => formatNumber(Number(v))} />
        <Legend />
        <Line
          type="monotone"
          dataKey="stock"
          name="Stock"
          stroke="var(--color-primary)"
          strokeWidth={2}
          dot={{ r: 5, strokeWidth: 2, fill: 'var(--color-surface)' }}
          activeDot={{ r: 7 }}
        />
        <Line
          type="monotone"
          dataKey="actual"
          name="Actual"
          stroke="var(--color-success)"
          strokeWidth={2}
          dot={{ r: 5, strokeWidth: 2, fill: 'var(--color-surface)' }}
          activeDot={{ r: 7 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

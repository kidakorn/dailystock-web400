'use client';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatNumber } from '@/lib/format';

const AXIS = { fontSize: 13, fill: 'var(--color-text-muted)' };
export interface BarDatum {
  name: string;
  plan: number;
  actual: number;
}

export function StockBarChart({ data, target }: { data: BarDatum[]; target: number }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={AXIS} />
        <YAxis tick={AXIS} width={56} tickFormatter={(v: number) => formatNumber(v)} />
        <Tooltip formatter={(v) => formatNumber(Number(v))} />
        <Legend />
        <ReferenceLine y={target} stroke="var(--color-danger)" strokeDasharray="4 3" />
        <Bar dataKey="plan" name="Plan" fill="var(--color-primary)" />
        <Bar dataKey="actual" name="Actual" fill="var(--color-success)" />
      </BarChart>
    </ResponsiveContainer>
  );
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const X_AXIS_TICK = (props: any) => {
  const { x, y, payload } = props;
  if (!payload) return null;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        dy={10}
        fontSize={11}
        fill="var(--color-text-muted)"
        textAnchor="end"
        transform="rotate(-45)"
      >
        {payload.value}
      </text>
    </g>
  );
};


export function StockBarChart({ data, target }: { data: BarDatum[]; target: number }) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 25 }}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={X_AXIS_TICK} interval={0} height={90} />
        <YAxis tick={AXIS} width={56} tickFormatter={(v: number) => formatNumber(v)} />
        <Tooltip formatter={(v) => formatNumber(Number(v))} />
        <Legend
          wrapperStyle={{
            position: 'relative',
            marginTop: '50px',
            textAlign: 'center',
            width: '100%'
          }}
        />
        <ReferenceLine y={target} stroke="var(--color-danger)" strokeDasharray="4 3" />
        <Bar dataKey="plan" name="Plan" fill="var(--color-primary)" />
        <Bar dataKey="actual" name="Actual" fill="var(--color-success)" />
      </BarChart>
    </ResponsiveContainer>
  );
}

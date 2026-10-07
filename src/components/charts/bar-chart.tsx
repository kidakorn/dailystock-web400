'use client';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatNumber } from '@/lib/format';

const AXIS = { fontSize: 14, fill: 'var(--color-text-muted)' };
export interface BarDatum {
  name: string;
  stock: number;
  actual: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const X_AXIS_TICK = (props: any) => {
  const { x, y, payload, onSelectProcess } = props;
  if (!payload) return null;
  const processName = String(payload.value);

  function handleKeyDown(event: React.KeyboardEvent<SVGTextElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onSelectProcess?.(processName);
  }

  return (
    <g
      transform={`translate(${x},${y})`}
    >
      <text
        dy={8}
        fontSize={10}
        fill={onSelectProcess ? 'var(--color-primary)' : 'var(--color-text-muted)'}
        textAnchor="end"
        textDecoration={onSelectProcess ? 'underline' : undefined}
        transform="rotate(-60)"
        role={onSelectProcess ? 'button' : undefined}
        tabIndex={onSelectProcess ? 0 : undefined}
        aria-label={onSelectProcess ? `View ${processName} subprocesses` : undefined}
        onClick={() => onSelectProcess?.(processName)}
        onKeyDown={handleKeyDown}
        style={{ cursor: onSelectProcess ? 'pointer' : undefined, pointerEvents: 'all' }}
      >
        {payload.value}
      </text>
    </g>
  );
};


export function StockBarChart({
  data,
  onSelectProcess,
}: {
  data: BarDatum[];
  onSelectProcess?: (name: string) => void;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 12 }}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          tick={(props) => <X_AXIS_TICK {...props} onSelectProcess={onSelectProcess} />}
          interval={0}
          height={104}
        />
        <YAxis tick={AXIS} width={76} tickFormatter={(v: number) => formatNumber(v)} />
        <Tooltip formatter={(v) => formatNumber(Number(v))} />
        <Legend
          wrapperStyle={{
            position: 'relative',
            marginTop: '0',
            textAlign: 'center',
            width: '100%'
          }}
        />
        <Bar dataKey="stock" name="Stock" fill="var(--color-success)" />
        <Bar dataKey="actual" name="Actual" fill="var(--color-primary)" />
      </BarChart>
    </ResponsiveContainer>
  );
}

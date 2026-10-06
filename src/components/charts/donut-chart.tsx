'use client';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatNumber } from '@/lib/format';
import styles from './charts.module.css';

export interface DonutDatum {
  label: string;
  value: number;
  tone: string;
}

export function StatusDonut({ data }: { data: DonutDatum[] }) {
  const total = data.reduce((t, d) => t + d.value, 0);
  return (
    <div className={styles.donut}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            stroke="none"
          >
            {data.map((d) => (
              <Cell key={d.label} fill={`var(--color-${d.tone})`} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => formatNumber(Number(v))} />
        </PieChart>
      </ResponsiveContainer>
      <div className={styles.donutTotal}>{formatNumber(total)}</div>
    </div>
  );
}

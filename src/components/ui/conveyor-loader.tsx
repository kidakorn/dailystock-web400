import styles from './conveyor-loader.module.css';

// Three parcels in the project's status colours riding a warehouse conveyor.
const BOXES = [
  { x: 30, tone: 'danger', delay: '0s' },
  { x: 110, tone: 'primary', delay: '-1.1s' },
  { x: 190, tone: 'warning', delay: '-2.2s' },
] as const;
const ROLLERS = [24, 84, 144, 204] as const;

export function ConveyorLoader({ label = 'Loading data' }: { label?: string }) {
  return (
    <div className={styles.wrap}>
      <svg className={styles.svg} viewBox="0 0 260 110" aria-hidden="true">
        {BOXES.map((b) => (
          <g key={b.x} className={styles.box} style={{ animationDelay: b.delay }}>
            <rect
              x={b.x}
              y={32}
              width={38}
              height={36}
              fill={`var(--color-${b.tone})`}
              stroke="var(--color-charcoal-900)"
              strokeWidth={2}
            />
            <path
              d={`M${b.x + 19} 32v36M${b.x} 44h38`}
              stroke="var(--color-charcoal-900)"
              strokeOpacity={0.45}
              strokeWidth={2}
              fill="none"
            />
          </g>
        ))}
        <rect x={0} y={68} width={260} height={14} fill="var(--color-charcoal-700)" />
        <rect x={0} y={68} width={260} height={3} fill="var(--color-charcoal-900)" />
        {ROLLERS.map((cx) => (
          <g key={cx} className={styles.roller}>
            <circle
              cx={cx}
              cy={92}
              r={9}
              fill="var(--color-charcoal-800)"
              stroke="var(--color-border)"
              strokeWidth={2}
            />
            <path d={`M${cx - 6} 92h12`} stroke="var(--color-border)" strokeWidth={2} />
          </g>
        ))}
        <path
          d="M24 101v7M84 101v7M144 101v7M204 101v7"
          stroke="var(--color-charcoal-700)"
          strokeWidth={3}
        />
      </svg>
      <p className={styles.label}>{label}</p>
    </div>
  );
}

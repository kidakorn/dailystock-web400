import { z } from 'zod';

/*
 * Zod schemas are the single source of truth: TypeScript types are inferred
 * from them (src/types), and the same schemas validate data at runtime. When
 * the mock JSON is replaced by a real API, a shape mismatch fails loudly here
 * instead of rendering NaN deep inside a chart.
 */
export const packageStatusSchema = z.enum(['Active', 'Pending', 'Cancelled']);

export const packageSchema = z.object({
  code: z.string(),
  name: z.string(),
  process: z.string(),
  plant: z.string(),
  status: packageStatusSchema,
  qty: z.number(),
  actual: z.number(),
  progress: z.number(),
  spark: z.array(z.number()),
});

export const stockRowSchema = z.object({
  product: z.string(),
  process: z.string(),
  plant: z.string(),
  plan: z.number(),
  actual: z.number(),
  in: z.number(),
  out: z.number(),
  status: z.enum(['OK', 'Warning', 'Critical']),
  remark: z.string(),
});

export const stockGroupSchema = z.object({
  code: z.string(),
  name: z.string(),
  rows: z.array(stockRowSchema),
});

const tone = z.enum(['success', 'warning', 'danger']);

export const dashboardSchema = z.object({
  exceptions: z.number(),
  processes: z.object({
    labels: z.array(z.string()),
    plan: z.array(z.number()),
    actual: z.array(z.number()),
    target: z.number(),
  }),
  status: z.array(z.object({ label: z.string(), value: z.number(), tone })),
  trend: z.object({
    labels: z.array(z.string()),
    plan: z.array(z.number()),
    actual: z.array(z.number()),
  }),
  alerts: z.array(
    z.object({
      time: z.string(),
      package: z.string(),
      message: z.string(),
      level: z.enum(['High', 'Medium', 'Low']),
    }),
  ),
  systems: z.array(z.object({ name: z.string(), status: z.enum(['Normal', 'Warning']) })),
  spark: z.record(z.string(), z.array(z.number())),
});

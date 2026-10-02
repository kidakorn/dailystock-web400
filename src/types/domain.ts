import type { z } from 'zod';
import type {
  dashboardSchema,
  packageSchema,
  packageStatusSchema,
  stockGroupSchema,
  stockRowSchema,
} from '@/lib/data/schemas';

export type PackageStatus = z.infer<typeof packageStatusSchema>;
export type PackageItem = z.infer<typeof packageSchema>;
export type StockRow = z.infer<typeof stockRowSchema>;
export type StockGroup = z.infer<typeof stockGroupSchema>;
export type DashboardData = z.infer<typeof dashboardSchema>;

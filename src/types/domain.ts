import type { z } from 'zod';
import type {
  dashboardSchema,
  packageGroupsSchema,
  packagePairsSchema,
  packageSchema,
  packageStatusSchema,
  processSeqSchema,
  stockGroupSchema,
  stockLineSchema,
  stockRowSchema,
} from '@/lib/data/schemas';

export type PackageStatus = z.infer<typeof packageStatusSchema>;
export type PackageItem = z.infer<typeof packageSchema>;
export type StockRow = z.infer<typeof stockRowSchema>;
export type StockGroup = z.infer<typeof stockGroupSchema>;
export type DashboardData = z.infer<typeof dashboardSchema>;
export type StockLine = z.infer<typeof stockLineSchema>;
export type ProcessSeqEntry = z.infer<typeof processSeqSchema>;
export type PackageGroups = z.infer<typeof packageGroupsSchema>;
export type PackagePairs = z.infer<typeof packagePairsSchema>;

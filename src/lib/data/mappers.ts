import { z } from 'zod';
import { stockLineSchema } from './schemas';

// Raw WGPGBL columns from GET /api/web/services/WGPGBL (docs/odbc_api/API.md).
export const rawWgpgblRowSchema = z.object({
  CDGPGS: z.number().int(),
  NMGPGS: z.string(),
  KBGPGS: z.string(),
  CDPROC: z.number().int(),
  NMPROC: z.string(),
  CDSBPR: z.string(),
  NMSBPR: z.string(),
  QTST34: z.number(),
  QTBW34: z.number(),
  QTSTKP: z.number(),
  QTWRKP: z.number(),
  QTPDSH: z.number(),
  D6DATC: z.number().int(),
});

export type RawWgpgblRow = z.infer<typeof rawWgpgblRowSchema>;
export type StockLine = z.infer<typeof stockLineSchema>;

/** Converts AS400 D6DATC (DDMMYY, leading zero dropped) to an ISO date. */
export function snapshotFromAs400Date(value: number): string {
  const digits = String(value).padStart(6, '0');
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = 2000 + Number(digits.slice(4, 6));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error(`Invalid AS400 date: ${value}`);
  }
  return `${year}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
}

// Same rules as scripts/import-wgpgbl.py: blank KBGPGS means "0", and a trailing ".0" is dropped from CDSBPR.
export function mapWgpgblRow(raw: RawWgpgblRow): StockLine {
  return stockLineSchema.parse({
    snapshot: snapshotFromAs400Date(raw.D6DATC),
    packageCode: raw.CDGPGS,
    packageName: raw.NMGPGS,
    packageKind: raw.KBGPGS || '0',
    processCode: raw.CDPROC,
    processName: raw.NMPROC,
    subProcessCode: raw.CDSBPR.trim().replace(/\.0$/, ''),
    subProcessName: raw.NMSBPR,
    balance: raw.QTST34,
    balDay: raw.QTBW34,
    stock: raw.QTSTKP,
    actual: raw.QTWRKP,
    pending: raw.QTPDSH,
  });
}

export function mapWgpgblRows(raws: RawWgpgblRow[]): StockLine[] {
  const lines = raws.map(mapWgpgblRow);
  const keys = new Set<string>();
  for (const line of lines) {
    const key = [line.snapshot, line.packageCode, line.processCode, line.subProcessCode].join('|');
    if (keys.has(key)) throw new Error(`Duplicate WGPGBL key: ${key}`);
    keys.add(key);
  }
  return lines;
}

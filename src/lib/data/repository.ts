import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import { z } from 'zod';
import {
  dashboardSchema,
  packageGroupsSchema,
  packageSchema,
  processSeqSchema,
  stockGroupSchema,
  stockLineSchema,
} from './schemas';

/*
 * Data access layer. Pages call these functions and never touch files or
 * fetch directly, so swapping mock JSON for an API changes this file only.
 * 'server-only' makes the build fail if a client component imports it.
 * react's cache() de-duplicates calls within one request.
 */
const DATA_DIR = path.join(process.cwd(), 'data');

async function readJson<T>(file: string, schema: z.ZodType<T>): Promise<T> {
  const raw = await fs.readFile(path.join(DATA_DIR, file), 'utf-8');
  return schema.parse(JSON.parse(raw));
}

export const getDashboard = cache(() => readJson('dashboard.json', dashboardSchema));
export const getPackages = cache(() => readJson('packages.json', z.array(packageSchema)));
export const getStock = cache(() => readJson('stock.json', z.array(stockGroupSchema)));

// Real AS400 data (see scripts/import-wgpgbl.py and scripts/extract-workbook-config.py).
export const getStockLines = cache(() => readJson('wgpgbl.json', z.array(stockLineSchema)));
export const getProcessSeq = cache(() => readJson('process-seq.json', z.array(processSeqSchema)));
export const getPackageGroups = cache(() => readJson('package-groups.json', packageGroupsSchema));

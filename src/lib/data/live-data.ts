'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { z } from 'zod';
import type { GroupPackageEntry, StockLine } from '@/types/domain';
import { ApiError, fetchMgpgstRows, fetchWgpgblRows } from './api-client';
import { mapWgpgblRows, rawWgpgblRowSchema } from './mappers';
import { mgpgstSchema } from './schemas';

// Each dataset loads when its page opens. Until then the build-time JSON the page was rendered with is shown.
export type Dataset = 'lines' | 'master';

type LiveState = {
  stockLines?: StockLine[];
  masterEntries?: GroupPackageEntry[];
  failed?: Partial<Record<Dataset, string>>;
};
type LoadResult = { count: number; payload: unknown[] };

const EMPTY: LiveState = {};
const EMPTY_FAILURES: Partial<Record<Dataset, string>> = {};
let state: LiveState = EMPTY;
const listeners = new Set<() => void>();
const inFlight: Partial<Record<Dataset, Promise<LoadResult>>> = {};

function setState(next: LiveState) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getState() {
  return state;
}

async function loadLines(): Promise<LoadResult> {
  const stockLines = mapWgpgblRows(z.array(rawWgpgblRowSchema).parse(await fetchWgpgblRows()));
  setState({ stockLines });
  return { count: stockLines.length, payload: stockLines };
}

async function loadMaster(): Promise<LoadResult> {
  const rawMaster = await fetchMgpgstRows();
  const masterEntries = mgpgstSchema.parse(rawMaster);
  setState({ masterEntries });
  return { count: masterEntries.length, payload: rawMaster };
}

const LOADERS: Record<Dataset, () => Promise<LoadResult>> = { lines: loadLines, master: loadMaster };

/** Always fetches from the API; concurrent calls for the same dataset share one request. */
export function loadDataset(dataset: Dataset): Promise<LoadResult> {
  const pending =
    inFlight[dataset] ??
    LOADERS[dataset]()
      .then((result) => {
        setState({ failed: { ...state.failed, [dataset]: undefined } });
        return result;
      })
      .catch((cause: unknown) => {
        setState({ failed: { ...state.failed, [dataset]: reasonOf(cause) } });
        throw cause;
      })
      .finally(() => {
        delete inFlight[dataset];
      });
  inFlight[dataset] = pending;
  return pending;
}

const REASONS: Record<string, string> = {
  'API timed out': 'เชื่อมต่อ API เกินเวลาที่กำหนด',
  'API unavailable': 'ไม่สามารถเชื่อมต่อ API',
  'API returned an error': 'API ส่งข้อผิดพลาดกลับมา',
  'API response has no rows': 'ไม่พบข้อมูลในการตอบกลับจาก API',
  'MGPGST has more rows than the page limit': 'จำนวนข้อมูลเกินขีดจำกัดการดึง',
};

export function reasonOf(cause: unknown): string {
  if (!(cause instanceof ApiError)) return 'รูปแบบข้อมูลไม่ถูกต้อง';
  const status = /^API responded (\d+)$/.exec(cause.message)?.[1];
  if (status === '429') return 'ส่งคำขอถี่เกินไป กรุณาลองใหม่ภายหลัง';
  if (status === '503') return 'ฐานข้อมูลไม่พร้อมใช้งานหรือคิวเต็ม';
  if (status) return `เซิร์ฟเวอร์ตอบกลับ HTTP ${status}`;
  return REASONS[cause.message] ?? cause.message;
}

function isLoaded(dataset: Dataset) {
  return dataset === 'lines' ? Boolean(state.stockLines) : Boolean(state.masterEntries);
}

/** Loads a dataset once per session when its page opens; failures show in StaleDataBanner. */
function useAutoLoad(dataset: Dataset) {
  useEffect(() => {
    if (isLoaded(dataset)) return;
    loadDataset(dataset).catch(() => undefined);
  }, [dataset]);
}

export function useLiveStockLines(initial: StockLine[]): StockLine[] {
  useAutoLoad('lines');
  return useSyncExternalStore(subscribe, getState, () => EMPTY).stockLines ?? initial;
}

export function useLoadFailures(): Partial<Record<Dataset, string>> {
  return useSyncExternalStore(subscribe, getState, () => EMPTY).failed ?? EMPTY_FAILURES;
}

export function useLiveMasterEntries(initial: GroupPackageEntry[]): GroupPackageEntry[] {
  useAutoLoad('master');
  return useSyncExternalStore(subscribe, getState, () => EMPTY).masterEntries ?? initial;
}


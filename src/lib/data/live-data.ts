'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { toast } from 'react-toastify';
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
};
type LoadResult = { count: number; payload: unknown[] };

const EMPTY: LiveState = {};
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
    LOADERS[dataset]().finally(() => {
      delete inFlight[dataset];
    });
  inFlight[dataset] = pending;
  return pending;
}

export function reasonOf(cause: unknown) {
  return cause instanceof ApiError ? cause.message : 'unexpected response format';
}

function isLoaded(dataset: Dataset) {
  return dataset === 'lines' ? Boolean(state.stockLines) : Boolean(state.masterEntries);
}

/** Loads a dataset once per session when its page opens; on failure the built-in data stays visible. */
function useAutoLoad(dataset: Dataset) {
  useEffect(() => {
    if (isLoaded(dataset)) return;
    loadDataset(dataset).catch((cause: unknown) => {
      toast.error(`Using built-in data: ${reasonOf(cause)}`);
    });
  }, [dataset]);
}

export function useLiveStockLines(initial: StockLine[]): StockLine[] {
  useAutoLoad('lines');
  return useSyncExternalStore(subscribe, getState, () => EMPTY).stockLines ?? initial;
}

export function useLiveMasterEntries(initial: GroupPackageEntry[]): GroupPackageEntry[] {
  useAutoLoad('master');
  return useSyncExternalStore(subscribe, getState, () => EMPTY).masterEntries ?? initial;
}


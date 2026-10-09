import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { mgpgstSchema, packageGroupsSchema, processSeqSchema, stockLineSchema } from './schemas';

// Reads the real files in data/, so a bad import or a hand edit fails here instead of on a page.
const load = (file: string): unknown =>
  JSON.parse(readFileSync(path.join(process.cwd(), 'data', file), 'utf-8'));

describe('data files', () => {
  it('wgpgbl.json matches the schema and every line key is unique', () => {
    const lines = z.array(stockLineSchema).parse(load('wgpgbl.json'));
    const keys = lines.map((l) =>
      [l.snapshot, l.packageCode, l.processCode, l.subProcessCode].join('|'),
    );
    expect(lines.length).toBeGreaterThan(0);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('a package code always has one name', () => {
    const lines = z.array(stockLineSchema).parse(load('wgpgbl.json'));
    const names = new Map<number, Set<string>>();
    for (const l of lines)
      names.set(l.packageCode, (names.get(l.packageCode) ?? new Set()).add(l.packageName));
    expect([...names.values()].every((s) => s.size === 1)).toBe(true);
  });

  it('process-seq.json matches the schema with unique process/sub-process keys', () => {
    const seq = z.array(processSeqSchema).parse(load('process-seq.json'));
    const keys = seq.map((s) => `${s.processCode}|${s.subProcessCode}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('mgpgst.json matches the schema with unique group/package keys', () => {
    const master = mgpgstSchema.parse(load('mgpgst.json'));
    const keys = master.map((m) => `${m.CDGPGS}|${m.CDPAKG}`);
    expect(master.length).toBeGreaterThan(0);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('package-groups.json matches the schema and has IC2 and IC3', () => {
    const groups = packageGroupsSchema.parse(load('package-groups.json'));
    expect(groups.IC2?.length).toBeGreaterThan(0);
    expect(groups.IC3?.length).toBeGreaterThan(0);
  });
});

import { describe, expect, it } from 'vitest';
import { mgpgstSchema } from './schemas';
import { mapWgpgblRow, mapWgpgblRows, snapshotFromAs400Date, type RawWgpgblRow } from './mappers';

const raw: RawWgpgblRow = {
  CDGPGS: 1,
  NMGPGS: 'DIP-14/16/S22',
  KBGPGS: '',
  CDPROC: 50,
  NMPROC: 'WAFER CUT 4 PART',
  CDSBPR: '',
  NMSBPR: '',
  QTST34: 10,
  QTBW34: 2,
  QTSTKP: 7,
  QTWRKP: 5,
  QTPDSH: 3,
  D6DATC: 300926,
};

describe('snapshotFromAs400Date', () => {
  it('reads DDMMYY and pads a dropped leading zero', () => {
    expect(snapshotFromAs400Date(300926)).toBe('2026-09-30');
    expect(snapshotFromAs400Date(80724)).toBe('2024-07-08');
  });

  it('rejects a date that does not exist', () => {
    expect(() => snapshotFromAs400Date(310226)).toThrow('Invalid AS400 date: 310226');
  });
});

describe('mapWgpgblRow', () => {
  it('maps raw AS400 columns to the stock line shape', () => {
    expect(mapWgpgblRow(raw)).toEqual({
      snapshot: '2026-09-30',
      packageCode: 1,
      packageName: 'DIP-14/16/S22',
      packageKind: '0',
      processCode: 50,
      processName: 'WAFER CUT 4 PART',
      subProcessCode: '',
      subProcessName: '',
      balance: 10,
      balDay: 2,
      stock: 7,
      actual: 5,
      pending: 3,
    });
  });

  it('drops a trailing .0 from the sub-process code', () => {
    expect(mapWgpgblRow({ ...raw, CDSBPR: '12.0' }).subProcessCode).toBe('12');
  });

  it('fails when the package kind is outside 0, 1, 2', () => {
    expect(() => mapWgpgblRow({ ...raw, KBGPGS: '9' })).toThrow();
  });
});

describe('mapWgpgblRows', () => {
  it('rejects two rows with the same snapshot, package, process and sub-process', () => {
    expect(() => mapWgpgblRows([raw, { ...raw, QTST34: 99 }])).toThrow('Duplicate WGPGBL key');
  });
});

describe('mgpgstSchema', () => {
  it('turns a blank KBGPGS into null', () => {
    const row = {
      CDGPGS: 34,
      NMGPGS: 'TO-220F',
      CDPAKG: 1,
      KBGPGS: '',
      D6DATC: 190224,
      TMTIMC: 160000,
      CNJNMC: 'WONOTE12',
      CNFUNC: 'CNTRANS',
      D6DATU: 0,
      TMTIMU: 0,
      CNJNMU: '',
      CNFUNU: '',
      UPDATE_IDENT: 0,
    };
    expect(mgpgstSchema.parse([row])[0]?.KBGPGS).toBeNull();
  });
});

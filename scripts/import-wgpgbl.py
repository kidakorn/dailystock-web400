"""Imports the AS400 WGPGBL export into data/wgpgbl.json (one object per source row).

Mirrors the Power Query steps in Daily_Stock.xlsx: a blank KBGPGS becomes "0", D6DATC (DDMMYY with the
leading zero dropped) becomes an ISO date, and the QT* columns get the names used in your workbook.

Usage:   python3 import-wgpgbl.py <WGPGBL.xlsx|WGPGBL_R.xls> [output dir = ../data] [sheet name or index = 0]
Needs:   pandas, plus openpyxl for .xlsx or xlrd for .xls.  Rerunning overwrites wgpgbl.json.
"""
import json
import sys

import pandas as pd

SRC = sys.argv[1] if len(sys.argv) > 1 else 'WGPGBL.xlsx'
OUT = sys.argv[2] if len(sys.argv) > 2 else '../data'
SHEET = sys.argv[3] if len(sys.argv) > 3 else 0
if isinstance(SHEET, str) and SHEET.isdigit():
    SHEET = int(SHEET)

# AS400 column -> name used by the web app (the QT* names follow the renames in the workbook's Power Query).
RENAME = {
    'CDGPGS': 'packageCode', 'NMGPGS': 'packageName', 'KBGPGS': 'packageKind',
    'CDPROC': 'processCode', 'NMPROC': 'processName', 'CDSBPR': 'subProcessCode', 'NMSBPR': 'subProcessName',
    'QTST34': 'balance', 'QTBW34': 'balDay', 'QTSTKP': 'stock', 'QTWRKP': 'actual', 'QTPDSH': 'pending',
}
INTS = ['CDGPGS', 'CDPROC', 'QTST34', 'QTBW34', 'QTSTKP', 'QTWRKP', 'QTPDSH', 'D6DATC']

df = pd.read_excel(SRC, sheet_name=SHEET, dtype=str, keep_default_na=False)
df.columns = [str(c).strip() for c in df.columns]
missing = [c for c in [*RENAME, 'D6DATC'] if c not in df.columns]
if missing:
    raise SystemExit(f'Missing columns in {SRC}: {missing}')
for c in df.columns:
    df[c] = df[c].astype(str).str.strip()

for c in INTS:  # fail with the Excel row number instead of silently producing NaN
    num = pd.to_numeric(df[c], errors='coerce')
    if num.isna().any():
        raise SystemExit(f'Column {c} is not numeric at Excel row(s) {[int(i) + 2 for i in df.index[num.isna()][:5]]}')
    df[c] = num.astype('int64')

df['CDSBPR'] = df['CDSBPR'].str.replace(r'\.0$', '', regex=True)
df['KBGPGS'] = df['KBGPGS'].replace('', '0')  # same as the Power Query "Replaced Value" step
if not df['KBGPGS'].isin(['0', '1', '2']).all():
    raise SystemExit(f'Unexpected KBGPGS values: {sorted(df.loc[~df["KBGPGS"].isin(["0", "1", "2"]), "KBGPGS"].unique())}')

df['snapshot'] = pd.to_datetime(df['D6DATC'].astype(str).str.zfill(6), format='%d%m%y').dt.strftime('%Y-%m-%d')
out = df.rename(columns=RENAME)[['snapshot', *RENAME.values()]].sort_values(
    ['snapshot', 'packageName', 'processCode', 'subProcessCode'], kind='stable')

key = ['snapshot', 'packageCode', 'processCode', 'subProcessCode']
dup = out[out.duplicated(key, keep=False)]
if len(dup):
    raise SystemExit(f'{len(dup)} rows share the same snapshot/package/process/sub-process key, e.g.\n{dup.head(4).to_string()}')

with open(f'{OUT}/wgpgbl.json', 'w', encoding='utf-8') as f:
    json.dump(out.to_dict('records'), f, ensure_ascii=False, separators=(',', ':'), default=int)
print(f'{len(out)} rows, {out.packageCode.nunique()} packages, snapshots: {sorted(out.snapshot.unique())}')

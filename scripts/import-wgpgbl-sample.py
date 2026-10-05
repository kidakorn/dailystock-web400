"""Builds data/packages.json and data/stock.json from the WGPGBL Excel export (a sample of N packages).

IMPORTANT: the MAPPING and the status rules below are PROVISIONAL. The app still uses mock-era field
names (plan / actual / in / out) and the meaning of the QT* columns has not been confirmed, so edit
only this file once it is, then rerun:  python3 import-wgpgbl-sample.py WGPGBL.xlsx ../data
Requires: pandas, openpyxl.  Running it overwrites packages.json and stock.json.
"""
import json
import sys

import pandas as pd

SRC = sys.argv[1] if len(sys.argv) > 1 else 'WGPGBL.xlsx'
OUT = sys.argv[2] if len(sys.argv) > 2 else '../data'
N_PACKAGES = 15
MAPPING = {'plan': 'QTST34', 'actual': 'QTSTKP', 'in': 'QTWRKP', 'out': 'QTPDSH'}  # QTBW34 is not shown anywhere yet
QTY = ['QTST34', 'QTBW34', 'QTSTKP', 'QTWRKP', 'QTPDSH']
PLANT = 'N/A'  # the export has no plant column


def to_iso(d):
    """D6DATC is DDMMYY with the leading zero dropped, e.g. 50526 -> 2026-05-05."""
    s = str(int(d)).zfill(6)
    return f'20{s[4:6]}-{s[2:4]}-{s[0:2]}'


df = pd.read_excel(SRC, dtype=str, keep_default_na=False)
for c in df.columns:
    df[c] = df[c].str.strip()
for c in QTY + ['CDGPGS', 'CDPROC', 'D6DATC']:
    df[c] = pd.to_numeric(df[c])
df['date'] = df['D6DATC'].map(to_iso)
latest, previous = df['date'].max(), df['date'].min()
now, before = df[df['date'] == latest], df[df['date'] == previous]

# Pick the packages with the most lines (the richest ones); ties broken by code so reruns are identical.
counts = now.groupby('CDGPGS').size().reset_index(name='n').sort_values(['n', 'CDGPGS'], ascending=[False, True])
chosen = sorted(counts['CDGPGS'].head(N_PACKAGES).tolist())

proc = lambda r: f"{int(r['CDPROC'])} {r['NMPROC']}"
packages, groups = [], []
for pid in chosen:
    g = now[now['CDGPGS'] == pid].sort_values(['CDPROC', 'CDSBPR'])
    main = g[g['CDSBPR'] == '']  # sub-process lines are shown in stock.json but not added into package totals
    prev_main = before[(before['CDGPGS'] == pid) & (before['CDSBPR'] == '')]
    code, name = f'{int(pid):02d}', g['NMGPGS'].iloc[0]  # 2-digit code so text sorting matches numeric order
    qty, actual = int(main[MAPPING['plan']].sum()), int(main[MAPPING['actual']].sum())
    packages.append({
        'code': code, 'name': name,
        'process': proc(main.loc[main['QTSTKP'].idxmax()]), 'plant': PLANT,
        'status': 'Active' if g[QTY].to_numpy().sum() > 0 else 'Cancelled',  # provisional rule
        'qty': qty, 'actual': actual, 'progress': round(actual / qty * 100) if qty else 0,
        'spark': [int(prev_main[MAPPING['actual']].sum()), actual],  # only two snapshot dates exist
    })
    rows = []
    for _, r in g.iterrows():
        empty = int(r[QTY].sum()) == 0
        label = proc(r) + (f" / {r['CDSBPR']} {r['NMSBPR']}" if r['CDSBPR'] else '')
        rows.append({
            'product': label, 'process': proc(r), 'plant': PLANT,
            'plan': int(r[MAPPING['plan']]), 'actual': int(r[MAPPING['actual']]),
            'in': int(r[MAPPING['in']]), 'out': int(r[MAPPING['out']]),
            'status': 'Warning' if empty else 'OK', 'remark': 'No quantity' if empty else '',  # provisional rule
        })
    groups.append({'code': code, 'name': name, 'rows': rows})

for fname, data in [('packages.json', packages), ('stock.json', groups)]:
    with open(f'{OUT}/{fname}', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=1, ensure_ascii=False)
print(f'snapshot {latest} (previous {previous}); packages: {[(p["code"], p["name"]) for p in packages]}')
print(f'stock rows: {sum(len(g["rows"]) for g in groups)}')

"""Regenerates mock JSON. Seeded so reruns give identical data."""
import json, random
random.seed(7)
P = ["Receiving", "Sorting", "Packing", "Staging", "Shipping", "Returns"]
plan = [42000, 38000, 45000, 36000, 40000, 22000]
dash = {
  "exceptions": 3,
  "processes": {"labels": P, "plan": plan, "actual": [int(p * random.uniform(.8, 1.05)) for p in plan], "target": 40000},
  "status": [{"label": "Active", "value": 212480, "tone": "success"},
             {"label": "Pending", "value": 36144, "tone": "warning"},
             {"label": "Cancelled", "value": 6, "tone": "danger"}],
  "trend": {"labels": ["D-6", "D-5", "D-4", "D-3", "D-2", "D-1", "Today"],
            "plan": [200, 205, 210, 212, 215, 218, 220], "actual": [190, 200, 204, 211, 209, 216, 221]},
  "alerts": [{"time": "21:09", "package": "P-1004", "message": "Stock below minimum", "level": "High"},
             {"time": "20:45", "package": "P-1009", "message": "Count mismatch", "level": "High"},
             {"time": "19:30", "package": "P-1012", "message": "Process delayed", "level": "Medium"},
             {"time": "18:12", "package": "P-1002", "message": "Pending over 24h", "level": "Medium"},
             {"time": "16:50", "package": "P-1007", "message": "Low progress", "level": "Low"}],
  "systems": [{"name": "LANSA Web", "status": "Normal"}, {"name": "IBM i (AS400)", "status": "Normal"},
              {"name": "Database", "status": "Normal"}, {"name": "File Transfer", "status": "Warning"},
              {"name": "Web Service", "status": "Normal"}, {"name": "Batch Job", "status": "Normal"}]}
pk = []
for i in range(36):
    st = random.choices(["Active", "Pending", "Cancelled"], [6, 3, 1])[0]
    qty = random.randint(2000, 30000)
    act = 0 if st == "Cancelled" else int(qty * random.uniform(.3, 1))
    pk.append({"code": f"P-{1001 + i}", "name": f"{random.choice(['Housing','Cover','Shaft','Plate','Gear','Valve'])} {chr(65 + i % 6)}",
               "process": random.choice(P), "status": st, "qty": qty, "actual": act, "progress": round(act / qty * 100)})
groups = []
for g in range(6):
    rows = []
    for r in range(4):
        pl = random.randint(800, 6000); ac = int(pl * random.uniform(.7, 1.05)); pr = round(ac / pl * 100)
        rows.append({"product": f"Item {g + 1}-{r + 1}", "process": random.choice(P), "plan": pl, "actual": ac, "in": random.randint(50, 900), "out": random.randint(50, 900),
                     "status": "OK" if pr >= 95 else "Warning" if pr >= 80 else "Critical", "remark": "" if pr >= 95 else "Check count"})
    groups.append({"code": pk[g]["code"], "name": pk[g]["name"], "rows": rows})
rs = random.Random(11)  # separate RNG: adding spark data must not reshuffle the existing mock data
def walk(end): return [max(0, round(end * (1 - (6 - i) * rs.uniform(.005, .04)))) for i in range(7)]
dash["spark"] = {"total": walk(sum(x["value"] for x in dash["status"])), "active": walk(212480), "cancelled": walk(6), "pending": walk(36144), "exceptions": walk(3)}
for p in pk: p["spark"] = walk(p["progress"]) if p["progress"] else [0] * 7
PL = ["Plant 1", "Plant 2", "Plant 3"]
for p in pk: p["plant"] = rs.choice(PL)
for g in groups:
    for r in g["rows"]: r["plant"] = rs.choice(PL)
for n, d in [("dashboard", dash), ("packages", pk), ("stock", groups)]:
    json.dump(d, open(f"../data/{n}.json", "w"), indent=1)

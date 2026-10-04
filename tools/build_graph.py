"""Turn a raw Overpass dump of Thiruvanmiyur/Adyar (Chennai) into a compact
   routable street graph that ships inside the app. Run offline, once.
   python3 tools/build_graph.py ../chennai_raw.json src/data/chennai.json"""
import json, math, sys
from collections import defaultdict, Counter

RAW = sys.argv[1] if len(sys.argv) > 1 else '/home/user/chennai_raw.json'
OUT = sys.argv[2] if len(sys.argv) > 2 else '/home/user/nizhal-app/src/data/chennai.json'

raw = json.load(open(RAW))
ways = [e for e in raw['elements'] if e['type'] == 'way' and 'geometry' in e]
print('ways', len(ways))

# ---- local equirectangular projection (metres) -------------------------
lats = [g['lat'] for w in ways for g in w['geometry']]
lons = [g['lon'] for w in ways for g in w['geometry']]
lat0, lon0 = sum(lats)/len(lats), sum(lons)/len(lons)
K = 111320.0
def proj(lat, lon):
    return ((lon - lon0) * K * math.cos(math.radians(lat0)), -(lat - lat0) * K)
def dist(a, b):
    return math.hypot(a[0]-b[0], a[1]-b[1])

CLASS = {'primary':0,'primary_link':0,'secondary':1,'secondary_link':1,'tertiary':2,
         'tertiary_link':2,'residential':3,'unclassified':3,'living_street':4,'pedestrian':4}

# ---- how many ways touch each osm node -> intersections ----------------
touch = Counter()
for w in ways:
    for nid in w['nodes']:
        touch[nid] += 1

nodemap, nodes = {}, []
def node_id(osmid, lat, lon):
    if osmid in nodemap: return nodemap[osmid]
    x, y = proj(lat, lon)
    nodemap[osmid] = len(nodes)
    nodes.append([round(x,1), round(y,1), lat, lon])
    return nodemap[osmid]

edges = []
for w in ways:
    t = w.get('tags', {})
    hw = t.get('highway')
    if hw not in CLASS: continue
    cls = CLASS[hw]
    lit = 1 if t.get('lit') in ('yes','24/7') else (0 if t.get('lit') == 'no' else -1)
    side = 1 if t.get('sidewalk') in ('both','left','right','yes') else (0 if t.get('sidewalk')=='no' else -1)
    named = 1 if t.get('name') else 0
    lanes = int(t['lanes']) if str(t.get('lanes','')).isdigit() else 0
    ids, geo = w['nodes'], w['geometry']
    # split the way at every intersection
    cut = [0] + [i for i in range(1, len(ids)-1) if touch[ids[i]] > 1] + [len(ids)-1]
    for s, e in zip(cut, cut[1:]):
        if e <= s: continue
        pts = [proj(g['lat'], g['lon']) for g in geo[s:e+1]]
        L = sum(dist(pts[i], pts[i+1]) for i in range(len(pts)-1))
        if L < 4: continue
        a = node_id(ids[s], geo[s]['lat'], geo[s]['lon'])
        b = node_id(ids[e], geo[e]['lat'], geo[e]['lon'])
        if a == b: continue
        # keep intermediate shape points, thinned
        shape = [[round(p[0],1), round(p[1],1)] for p in pts[1:-1]][:12]
        edges.append({'a':a,'b':b,'len':round(L,1),'cls':cls,'lit':lit,
                      'side':side,'named':named,'lanes':lanes,
                      'name':t.get('name',''),'geom':shape})

print('raw edges', len(edges), 'nodes', len(nodes))

# ---- largest connected component ---------------------------------------
adj = defaultdict(list)
for i, e in enumerate(edges):
    adj[e['a']].append((e['b'], i)); adj[e['b']].append((e['a'], i))
seen, best = set(), []
for s in range(len(nodes)):
    if s in seen: continue
    comp, st = [], [s]; seen.add(s)
    while st:
        n = st.pop(); comp.append(n)
        for m, _ in adj[n]:
            if m not in seen: seen.add(m); st.append(m)
    if len(comp) > len(best): best = comp
keep = set(best)
edges = [e for e in edges if e['a'] in keep and e['b'] in keep]
used = sorted({n for e in edges for n in (e['a'], e['b'])})
remap = {o: i for i, o in enumerate(used)}
nodes = [nodes[o] for o in used]
for e in edges: e['a'] = remap[e['a']]; e['b'] = remap[e['b']]
print('connected: edges', len(edges), 'nodes', len(nodes))

# ---- degree (topological isolation signal) ------------------------------
deg = Counter()
for e in edges: deg[e['a']] += 1; deg[e['b']] += 1

xs = [n[0] for n in nodes]; ys = [n[1] for n in nodes]
meta = {
  'city': 'Chennai', 'area': 'Thiruvanmiyur / Adyar',
  'source': 'OpenStreetMap contributors, ODbL',
  'bbox': [12.968, 80.240, 13.000, 80.272],
  'origin': [lat0, lon0],
  'extent': [min(xs), min(ys), max(xs), max(ys)],
  'litTagged': sum(1 for e in edges if e['lit'] != -1),
  'sidewalkTagged': sum(1 for e in edges if e['side'] != -1),
  'totalKm': round(sum(e['len'] for e in edges)/1000, 1),
}
print(meta)



# ================= POIs =================
POI = '/home/user/chennai_poi.json'
SAFE = {'pharmacy':'pharmacy','hospital':'hospital','clinic':'clinic','police':'police',
        'fuel':'fuel','bus_station':'transit','atm':'atm','bank':'bank',
        'restaurant':'food','fast_food':'food','cafe':'food','supermarket':'shop',
        'convenience':'shop','marketplace':'shop'}
pois = []
try:
    pd = json.load(open(POI))
    for e in pd['elements']:
        t = e.get('tags', {})
        kind = SAFE.get(t.get('amenity')) or SAFE.get(t.get('shop'))
        if not kind and t.get('shop'): kind = 'shop'
        if not kind: continue
        x, y = proj(e['lat'], e['lon'])
        pois.append({'x': round(x,1), 'y': round(y,1), 'lat': round(e['lat'],6), 'lon': round(e['lon'],6),
                     'k': kind, 'n': (t.get('name') or kind.title())[:34],
                     'h': t.get('opening_hours','')})
except FileNotFoundError:
    print('no POI file')
print('pois', len(pois))

# real frontage: how many POIs sit within 60 m of the segment midpoint
from math import hypot
GRID = 120
buckets = {}
for i, p in enumerate(pois):
    buckets.setdefault((int(p['x']//GRID), int(p['y']//GRID)), []).append(i)
for e in edges:
    a, b = nodes[e['a']], nodes[e['b']]
    mx, my = (a[0]+b[0])/2, (a[1]+b[1])/2
    c = 0
    gx, gy = int(mx//GRID), int(my//GRID)
    for dx in (-1,0,1):
        for dy in (-1,0,1):
            for i in buckets.get((gx+dx, gy+dy), []):
                if hypot(pois[i]['x']-mx, pois[i]['y']-my) < 90: c += 1
    e['poi'] = c
withpoi = sum(1 for e in edges if e['poi'] > 0)
print('edges with a real POI within 90 m:', withpoi)
meta['pois'] = len(pois)
meta['edgesWithPoi'] = withpoi

json.dump({'meta': meta,
           'nodes': [[n[0], n[1], round(n[2],6), round(n[3],6)] for n in nodes],
           'edges': edges, 'pois': pois},
          open(OUT, 'w'), separators=(',', ':'))
import os; print('wrote', OUT, os.path.getsize(OUT)//1024, 'KB')

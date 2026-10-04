"""Renders the architecture diagrams used in docs/ and the .docx.
Pure PIL so it runs anywhere. Romanised text only (no Tamil font on CI)."""
from PIL import Image, ImageDraw, ImageFont
import os
OUT = 'docs/img'
os.makedirs(OUT, exist_ok=True)

EBONY, TEAL, RUST, AQUA, MIST = '#1C2E40', '#008083', '#C9510D', '#1EDBCE', '#D2D7B2'
INK2, INK3, LINE, BG, CARD = '#4A6071', '#7C8F9D', '#E2E8E7', '#F4F6F5', '#FFFFFF'
GOLD, GREEN = '#C08A2A', '#4E9E7E'

def font(sz, bold=False):
    for p in ['/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if bold else ''),
              '/usr/share/fonts/truetype/liberation/LiberationSans%s.ttf' % ('-Bold' if bold else '')]:
        if os.path.exists(p):
            return ImageFont.truetype(p, sz)
    return ImageFont.load_default()

def wrap(d, text, f, w):
    words, lines, cur = text.split(), [], ''
    for wd in words:
        t = (cur + ' ' + wd).strip()
        if d.textlength(t, font=f) <= w: cur = t
        else: lines.append(cur); cur = wd
    if cur: lines.append(cur)
    return lines

# ============================================================ 1. LAYERS
LAYERS = [
 ('A','City Risk Pipeline','build time, offline', EBONY,
  'Open data becomes a scored street graph before anyone installs the app.',
  [('OpenStreetMap extract','2,970 segments - 212.5 km',1),
   ('Amenity layer','213 real places -> measured frontage',1),
   ('r(segment, hour)','lighting - frontage - footpath - isolation',1),
   ('Offline bundle','477 KB compiled into the app',1),
   ('VIIRS night-lights','satellite lighting, city scale',0),
   ('GNN + PU-learning','undo survivorship bias',0)]),
 ('B','On-Device Engine','the phone - nothing leaves', TEAL,
  'Five sensing layers become twelve features, one score and five states.',
  [('Accelerometer','RMS - jerk - spectral entropy',1),
   ('Location','speed - vehicle onset - divergence',1),
   ('Microphone (opt-in)','F0 - 1-4 kHz - roughness - 2 s RAM',1),
   ('Autoencoder 9-5-3-5-9','trained on normal behaviour only',1),
   ('Fusion + context','12 features -> one score 0-1',1),
   ('State machine','OFF - ARMED - HEIGHTENED - CHECK-IN - ALERT',1),
   ('BLE / WiFi density','isolation sensing, needs native',0)]),
 ('C','Zero-Knowledge Relay','our only server', RUST,
  'Accepts an opaque encrypted blob and forwards it. That is the entire API.',
  [('Device keypair = identity','ECDSA + ECDH P-256, no accounts',1),
   ('QR pairing','contacts never touch the server',1),
   ('HKDF -> AES-256-GCM','signed, random recipient tag',1),
   ('SMS / 2G fallback','works with no data network',1),
   ('Forwarder + rate limit','stateless, stores nothing',0)]),
 ('D','Escalation','humans', GOLD,
  'A ladder, not a siren. Each rung costs more and demands more evidence.',
  [('T+0 silent arming','breadcrumb begins on device',1),
   ('T+10 s check-in','tap, biometric or voice cancels',1),
   ('T+30 s guardians','verified users within 400 m',0),
   ('T+60 s contacts','live location + breadcrumb',1),
   ('T+90 s 112','requires 3+ corroborating layers',0)]),
 ('E','City Data Layer','the business', GREEN,
  'Aggregate, anonymous, and the only thing anybody pays for.',
  [('Risk reduction per rupee','works ranked against a lamp budget',1),
   ('Data provenance','measured vs modelled, shown honestly',1),
   ('Before/after audit','did the money reduce risk?',0),
   ('Corporations - transit - employers','campuses, IT parks, hospitals',0)]),
]

W = 1700
PAD, LH = 40, 34
f_h1, f_h2, f_sm, f_xs, f_tag = font(30, True), font(20, True), font(14), font(12), font(11, True)

# measure
heights = []
for _,_,_,_,_,boxes in LAYERS:
    rows = (len(boxes)+2)//3
    heights.append(96 + rows*84)
H = 150 + sum(heights) + 26*(len(LAYERS)-1) + 60

im = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(im)
d.text((PAD, 38), 'NIZHAL - System Architecture', font=f_h1, fill=EBONY)
d.text((PAD, 80), 'Five layers. Solid = running in the prototype. Dashed = roadmap, stated openly.', font=f_sm, fill=INK2)
d.line([(PAD,118),(W-PAD,118)], fill=LINE, width=2)

y = 140
for (letter,name,where,col,summary,boxes), hgt in zip(LAYERS, heights):
    d.rounded_rectangle([PAD, y, W-PAD, y+hgt], 16, fill=CARD, outline=LINE, width=1)
    d.rounded_rectangle([PAD, y, PAD+8, y+hgt], 4, fill=col)
    d.ellipse([PAD+26, y+22, PAD+66, y+62], fill=col)
    d.text((PAD+46, y+34), letter, font=f_h2, fill='#FFFFFF', anchor='mm')
    d.text((PAD+84, y+22), name, font=f_h2, fill=EBONY)
    d.text((PAD+84, y+48), where, font=f_xs, fill=INK3)
    d.text((PAD+84, y+68), summary, font=f_sm, fill=INK2)
    ship = sum(b[2] for b in boxes)
    d.rounded_rectangle([W-PAD-250, y+22, W-PAD-136, y+46], 12, fill='#EAF3F2')
    d.text((W-PAD-193, y+34), '%d shipped' % ship, font=f_tag, fill='#016E71', anchor='mm')
    d.rounded_rectangle([W-PAD-128, y+22, W-PAD-20, y+46], 12, fill='#F1F4F3')
    d.text((W-PAD-74, y+34), '%d roadmap' % (len(boxes)-ship), font=f_tag, fill=INK3, anchor='mm')

    bw = (W - 2*PAD - 60) // 3
    for i,(t,s,shipped) in enumerate(boxes):
        bx = PAD + 24 + (i%3)*(bw+6); by = y + 96 + (i//3)*84
        if shipped:
            d.rounded_rectangle([bx,by,bx+bw-10,by+70], 10, fill='#FBFCFC', outline=col, width=2)
        else:
            for xx in range(bx, bx+bw-10, 9):
                d.line([(xx,by),(min(xx+5,bx+bw-10),by)], fill=INK3, width=1)
                d.line([(xx,by+70),(min(xx+5,bx+bw-10),by+70)], fill=INK3, width=1)
            for yy in range(by, by+70, 9):
                d.line([(bx,yy),(bx,min(yy+5,by+70))], fill=INK3, width=1)
                d.line([(bx+bw-10,yy),(bx+bw-10,min(yy+5,by+70))], fill=INK3, width=1)
        d.text((bx+14, by+14), t, font=font(15, True), fill=EBONY if shipped else INK2)
        for j,ln in enumerate(wrap(d, s, f_xs, bw-34)[:2]):
            d.text((bx+14, by+38+j*15), ln, font=f_xs, fill=INK3)
    if (letter, ) != (LAYERS[-1][0],):
        cx = W//2
        d.line([(cx, y+hgt+4),(cx, y+hgt+20)], fill='#9FB0BC', width=3)
        d.polygon([(cx-6,y+hgt+18),(cx+6,y+hgt+18),(cx,y+hgt+26)], fill='#9FB0BC')
    y += hgt + 26

im.save(f'{OUT}/layers.png')
print('layers.png', im.size)

# ============================================================ 2. ALERT SEQUENCE
ACT = ['Sensors','Engine','Crypto','Relay','Contacts']
STEPS = [(0,1,'12 features @ 4 Hz','on device'),
         (1,1,'score >= 0.62 -> CHECK-IN','still nothing sent'),
         (1,1,'10 s silent vibrate','one tap cancels'),
         (1,2,'seal payload','AES-256-GCM + sign'),
         (2,3,'POST /relay/alert','opaque blob only'),
         (3,4,'forward','relay cannot decrypt')]
W2 = 1500; H2 = 220 + len(STEPS)*84
im2 = Image.new('RGB',(W2,H2),BG); d2 = ImageDraw.Draw(im2)
d2.text((40,34),'What happens during one alert', font=f_h1, fill=EBONY)
d2.text((40,76),'Steps 1-4 never leave the phone. Step 5 is the first byte transmitted, and it is ciphertext.', font=f_sm, fill=INK2)
colw = (W2-160)//len(ACT)
xs = [80+colw//2+i*colw for i in range(len(ACT))]
for i,a in enumerate(ACT):
    col = TEAL if i<3 else (RUST if i==3 else GOLD)
    d2.rounded_rectangle([xs[i]-88,126,xs[i]+88,164], 10, fill=col)
    d2.text((xs[i],145), a, font=font(16,True), fill='#FFFFFF', anchor='mm')
    d2.line([(xs[i],168),(xs[i],H2-46)], fill='#CFD8D7', width=2)
d2.rounded_rectangle([xs[0]-96,118,xs[2]+96,H2-36], 14, outline=TEAL, width=2)
d2.text((xs[0]-88,H2-30),'THE PHONE  -  nothing inside this boundary is ever transmitted', font=f_tag, fill=TEAL)
y=200
for i,(a,b,label,note) in enumerate(STEPS):
    yy = y+i*84
    d2.ellipse([46,yy-12,74,16+yy], fill=EBONY)
    d2.text((60,yy+2), str(i+1), font=font(14,True), fill='#FFFFFF', anchor='mm')
    if a==b:
        d2.arc([xs[a],yy-14,xs[a]+90,yy+22],-90,90, fill=INK2, width=3)
        d2.polygon([(xs[a]+2,yy+14),(xs[a]+18,yy+14),(xs[a]+10,yy+26)], fill=INK2)
        d2.text((xs[a]+102,yy-6), label, font=font(15,True), fill=EBONY)
        d2.text((xs[a]+102,yy+14), note, font=f_xs, fill=INK3)
    else:
        d2.line([(xs[a],yy+4),(xs[b]-12,yy+4)], fill=INK2, width=3)
        d2.polygon([(xs[b]-12,yy-4),(xs[b]-12,yy+12),(xs[b],yy+4)], fill=INK2)
        mid=(xs[a]+xs[b])//2
        d2.text((mid,yy-18), label, font=font(15,True), fill=EBONY, anchor='mm')
        d2.text((mid,yy+20), note, font=f_xs, fill=INK3, anchor='mm')
im2.save(f'{OUT}/alert_sequence.png')
print('alert_sequence.png', im2.size)

# ============================================================ 3. CODE MAP
W3,H3 = 1500, 860
im3 = Image.new('RGB',(W3,H3),BG); d3 = ImageDraw.Draw(im3)
d3.text((40,34),'Code architecture', font=f_h1, fill=EBONY)
d3.text((40,76),'core/ never imports React. No screen imports an API implementation. Those two rules are the whole design.', font=f_sm, fill=INK2)
GROUPS = [
 ('app/', 'shell - route table - hash router', EBONY, ['App.tsx','routes.ts','useRouter.ts'], 40, 130),
 ('features/', 'one folder per surface', GREEN,
  ['marketing/','onboarding/','citizen/','city/','devtools/','architecture/'], 40, 300),
 ('ui/', 'presentational only', MIST, ['Phone.tsx','CityMap.tsx','Icons.tsx'], 40, 540),
 ('engine/', 'the 5-state machine, one file', RUST, ['useSafetyEngine.ts','escalation.ts'], 560, 130),
 ('services/api/', 'THE BACKEND SEAM', GOLD, ['contract.ts','localApi.ts','httpApi.ts'], 560, 300),
 ('core/', 'pure logic - zero React', TEAL, ['geo/city.ts','geo/routing.ts','ml/fusion.ts','ml/autoencoder.ts','sensors/imu.ts','sensors/audio.ts','crypto/identity.ts'], 560, 470),
 ('data/', 'generated, committed', INK3, ['chennai.json  477 KB','model.json  trained'], 1080, 130),
 ('tools/', 'regenerate the data', INK3, ['build_graph.py','train_autoencoder.py'], 1080, 300),
 ('deploy/ + docs/', 'ship it', INK3, ['Dockerfile','nginx.conf','docker-compose.yml','relay/relay.py','openapi.yaml','ARCHITECTURE.md'], 1080, 470),
]
for name, sub, col, items, x, y in GROUPS:
    h = 74 + len(items)*24
    d3.rounded_rectangle([x,y,x+400,y+h], 14, fill=CARD, outline=col, width=2)
    d3.rounded_rectangle([x,y,x+400,y+38], 14, fill=col)
    d3.rectangle([x,y+24,x+400,y+38], fill=col)
    d3.text((x+16,y+11), name, font=font(17,True), fill='#FFFFFF')
    d3.text((x+16,y+46), sub, font=f_xs, fill=INK3)
    for i,it in enumerate(items):
        d3.text((x+22,y+68+i*24), '- '+it, font=font(14), fill=INK2)
d3.line([(440,180),(556,180)], fill='#9FB0BC', width=3)
d3.polygon([(556,174),(556,186),(566,180)], fill='#9FB0BC')
d3.line([(760,420),(760,462)], fill='#9FB0BC', width=3)
d3.polygon([(754,462),(766,462),(760,472)], fill='#9FB0BC')
d3.text((600,790),'services/api/contract.ts is the only place the client learns a backend exists.', font=font(16,True), fill=RUST)
d3.text((600,816),'Swap localApi -> httpApi with one env var. No screen changes.', font=f_sm, fill=INK2)
im3.save(f'{OUT}/code_map.png')
print('code_map.png', im3.size)

# ============================================================ 4. DEPLOYMENT
W4,H4 = 1500, 720
im4 = Image.new('RGB',(W4,H4),BG); d4 = ImageDraw.Draw(im4)
d4.text((40,34),'Deployment topology', font=f_h1, fill=EBONY)
d4.text((40,76),'Default: one static bundle, no server at all. Optional: add the relay. Nothing else exists.', font=f_sm, fill=INK2)
def card(x,y,w,h,title,sub,lines,col,dashed=False):
    if dashed:
        for xx in range(x,x+w,12):
            d4.line([(xx,y),(min(xx+7,x+w),y)], fill=col, width=2)
            d4.line([(xx,y+h),(min(xx+7,x+w),y+h)], fill=col, width=2)
        for yy in range(y,y+h,12):
            d4.line([(x,yy),(x,min(yy+7,y+h))], fill=col, width=2)
            d4.line([(x+w,yy),(x+w,min(yy+7,y+h))], fill=col, width=2)
    else:
        d4.rounded_rectangle([x,y,x+w,y+h], 14, fill=CARD, outline=col, width=2)
    d4.text((x+18,y+16), title, font=font(18,True), fill=col)
    d4.text((x+18,y+42), sub, font=f_xs, fill=INK3)
    for i,l in enumerate(lines):
        d4.text((x+18,y+70+i*22), l, font=font(14), fill=INK2)
card(40,130,400,230,'Phone / browser','the entire product','- static HTML + JS + CSS\n- 477 KB street graph\n- trained model weights\n- service worker cache\n- Web Crypto keypair'.split('\n'), TEAL)
card(40,390,400,180,'CDN / static host','Netlify, Vercel, Pages, S3','- npm run build -> dist/\n- HTTPS required for sensors\n- Permissions-Policy header'.split('\n'), EBONY)
card(560,130,400,230,'Zero-knowledge relay','OPTIONAL - only for delivery','- FastAPI, under 60 lines\n- accepts ciphertext only\n- no user table\n- rate limited per tag\n- forwards and forgets'.split('\n'), RUST, dashed=True)
card(560,390,400,180,'SMS gateway','OPTIONAL - 2G fallback','- used when data is down\n- same sealed payload\n- sms: intent on device'.split('\n'), GOLD, dashed=True)
card(1080,130,380,440,'What we deliberately\nDO NOT run','the security argument','- no user database\n- no location store\n- no contact graph\n- no audio anywhere\n- no analytics SDK\n- no third-party AI API\n- no ad network\n\nSeize the server and you\nget a queue of ciphertext\nand a rate-limit counter.'.split('\n'), GREEN)
d4.line([(450,240),(552,240)], fill='#9FB0BC', width=3)
d4.polygon([(552,234),(552,246),(562,240)], fill='#9FB0BC')
d4.text((452,210),'AES-256-GCM blob', font=f_tag, fill=INK3)
im4.save(f'{OUT}/deployment.png')
print('deployment.png', im4.size)

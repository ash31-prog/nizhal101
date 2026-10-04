# NIZHAL — Complete Project Document

**நிழல் · "nizhal" · Tamil for *shade* — the thing that walks beside you without being asked.**

**Problem Statement 08 — Safer Urban Mobility for Women & Vulnerable Citizens**
Crescent Project Expo · Chennai, Tamil Nadu

---

> ## The one sentence
> **Every safety app asks you to press a button. We built one you never touch.**

> ## The one paragraph
> NIZHAL computes a street-level risk map from open data before a single user installs it, routes you around danger while showing you the honest time-vs-safety trade-off, and then — passively, with no button and no user action — detects that something has gone wrong from the way your phone moves, where it goes, what it hears, and most importantly **what stops happening**. When it fires, it sends an end-to-end encrypted alert through a relay that is architecturally incapable of reading it. It works with no internet. It works with the screen black in your bag. The aggregate risk data is sold to the municipal corporations who can actually fix the streets, which is what pays for the app being free.

---

# Table of Contents

1. [The problem, with evidence](#1-the-problem-with-evidence)
2. [Why every existing solution fails](#2-why-every-existing-solution-fails)
3. [The four structural differences](#3-the-four-structural-differences)
4. [Complete feature catalogue](#4-complete-feature-catalogue)
5. [Every scenario, in X / Y / Z format](#5-every-scenario-in-x--y--z-format)
6. [How each mechanism actually works](#6-how-each-mechanism-actually-works)
7. [The fusion engine and the state machine](#7-the-fusion-engine-and-the-state-machine)
8. [The escalation ladder](#8-the-escalation-ladder)
9. [No internet, airplane mode, 2G, dead battery](#9-no-internet-airplane-mode-2g-dead-battery)
10. [Security and privacy architecture](#10-security-and-privacy-architecture)
11. [The threat model, including what we do NOT solve](#11-the-threat-model-including-what-we-do-not-solve)
12. [Technology stack](#12-technology-stack)
13. [Code architecture](#13-code-architecture)
14. [The API contract](#14-the-api-contract)
15. [Data: sources, provenance, honesty](#15-data-sources-provenance-honesty)
16. [The machine learning, in detail](#16-the-machine-learning-in-detail)
17. [The city dashboard and the business model](#17-the-city-dashboard-and-the-business-model)
18. [Objections and answers](#18-objections-and-answers)
19. [What is real vs what is roadmap](#19-what-is-real-vs-what-is-roadmap)
20. [Deployment](#20-deployment)
21. [The demo script](#21-the-demo-script)
22. [Lines worth memorising](#22-lines-worth-memorising)

---

# 1. The problem, with evidence

## 1.1 The thing nobody says out loud

Every women's safety app in India is built on one assumption:

> *In the moment you are in danger, you will take out your phone, unlock it, open an app, and press a button.*

That assumption is false. In the moments that matter most:

- your phone is in a bag or a pocket
- your hands are occupied, restrained, or shaking
- you are being watched by the person you would be reporting
- you have three to ten seconds, not thirty
- the safest thing to do is often to **not visibly use your phone at all**

An SOS button is a good design for a scenario in which you are safe enough to use it. That is not the scenario it is being designed for.

## 1.2 The evidence

**Delhi Police's Himmat app.** In 2018, the Parliamentary Standing Committee on Home Affairs (chaired by P. Chidambaram) declared it a **"comprehensive failure."**

| Metric | Value |
|---|---|
| Registered users | **30,821** |
| Population of Delhi | **~19,000,000** |
| Penetration | **0.16 %** |

The Committee blamed complex registration and the absence of Hindi support. Both are true. Both are also symptoms of the same root cause: **the app demanded effort before the emergency.**

**State safety apps generally.** A 2025 IJIP study of Indian women's safety applications found state app coverage at **0.35 %** and **0.57 %** of the female population, with NCRB crime-against-women figures showing no decline in most states. The documented causes of failure:

- app crashes and slow response
- **high battery consumption**
- **hard dependency on internet and GPS**
- delayed police response
- low awareness
- **data privacy concerns**
- language barriers
- poor integration with police back-ends
- users install it once and never maintain it

Read that list again. Almost every item is an **engineering** failure, not a policy failure. That is the opening.

## 1.3 What we are actually claiming

We are **not** claiming to prevent crime. Any team that claims that is lying and a technical judge will know it.

> **We claim to reduce time-to-detection from hours to roughly 90 seconds, with zero user action.**

That is a measurable, defensible, honest claim. "She left at 11 PM and was reported missing at 7 AM" becomes "at 11:04 PM three people knew something was wrong, and had a location."

---

# 2. Why every existing solution fails

## 2.1 The incumbent we must beat: Safetipin

Safetipin is the credible one. Founded 2013 by Dr Kalpana Viswanath. It is real, it works, and it has municipal traction:

- **9 audit parameters** (lighting, openness, visibility, crowd, security, walk path, public transport, gender diversity, feeling)
- **150,000+ spots** across ~30 cities
- Delhi: identified **7,483 dark spots**, roughly **70 % fixed** by the corporation
- Features: green/amber/red heat map, "Safety Route", a tracker

**We do not pretend Safetipin doesn't exist. We name it on the slide and then explain the two structural problems it cannot engineer its way out of.**

## 2.2 Structural problem one: survivorship bias

**This is the centrepiece of the whole pitch.**

Safetipin's map is built from user audits and user reports. A street gets rated when somebody walks down it and rates it.

Now ask: **which streets do women already avoid?**

The dangerous ones. Which means the most dangerous streets in a city receive:

- the fewest audits
- the fewest reports
- and therefore, in a crowdsourced model, the **most neutral or missing** safety scores

> **A crowdsourced safety map is blindest exactly where danger is highest.**

This is not a bug in Safetipin's implementation. It is a property of the data-generating process. Any system that learns safety from where people chose to walk learns *where people felt safe walking*, which is the opposite of what you want to know.

**How we fix it — three specific techniques:**

1. **Positive-Unlabelled (PU) learning.** We never treat "no incident reported here" as "this place is safe." In PU learning, unlabelled is unlabelled — not negative. This is the single most important modelling decision in the project.
2. **Inverse-propensity weighting / exposure normalisation.** Divide observed incidents by *estimated foot traffic*, not raw counts. Three incidents on a street 40 people walk down is catastrophically worse than eight on a street 4,000 people walk down. Raw counts get this exactly backwards.
3. **Graph neural network over the OSM street graph.** Risk propagates along topology. A segment with no data inherits an informed prior from its neighbours, its road class, its connectivity and its built environment — so unaudited streets are *estimated*, not blank.

## 2.3 Structural problem two: it still needs you to act

Safetipin's tracker and safety route still require you to open the app, set a destination, and engage before the danger. The panic button problem is unchanged.

## 2.4 Summary table

| | Himmat / 112 | Safetipin | **NIZHAL** |
|---|---|---|---|
| Map source | none | crowdsourced audits | **computed from open data** |
| Works with 0 users | n/a | **no** | **yes, day one** |
| Blind where danger is highest | n/a | **yes (survivorship bias)** | **corrected: PU + IPW + GNN** |
| Requires a button press | **yes** | yes | **no** |
| Requires you to arm it | **yes** | yes | **no — OS activity recognition** |
| Works with no internet | partial | no | **yes** |
| Can the operator surveil you | **yes** | yes | **architecturally no** |
| Detects "nothing happened" | no | no | **yes — absence sensing** |

---

# 3. The four structural differences

These are the only four things you need the judge to remember.

### 1. A computed map, not a crowdsourced one
It works on day one, in a city with zero NIZHAL users. Built from OpenStreetMap geometry and tags, amenity/POI density, road class, street topology — with a roadmap to VIIRS satellite night-lights and CNN segmentation of street imagery.

### 2. Passive detection, not a panic button
Five sensing layers run continuously. No button is required. There *is* a manual trigger, because sometimes you do have your hands free — but the entire design assumes you don't.

### 3. Auto-arming, not user-armed
It arms itself using the operating system's activity recognition: you started walking, it is after dark, the street risk is elevated. It stands down when you unlock the phone or reach a known place. **Manual arming is what killed Himmat — 30,821 people bothered.**

### 4. Architecturally incapable of surveillance
Not a privacy policy. An architecture. No accounts, no phone numbers, device-keypair identity, peer-to-peer QR contact pairing, end-to-end encryption, and a relay that is a dumb forwarder. You can verify it with airplane mode and a packet log.

> **"We didn't promise not to misuse your data. We made it impossible for us to have it."**

---

# 4. Complete feature catalogue

## 4.1 Citizen application

| # | Feature | What it does | Status |
|---|---|---|---|
| F1 | **Computed safety map** | `r(segment, hour)` for 2,970 real Chennai street segments, recomputed per hour of day | shipped |
| F2 | **Pareto-optimal routing** | Returns the *non-dominated front* over (time, risk) — never one blended "best" route | shipped |
| F3 | **Route reasoning** | Each option shows metres unlit, worst segment, amenities passed, so the choice is informed | shipped |
| F4 | **Auto-arming** | Arms on walking + dark + elevated risk. No user action | shipped |
| F5 | **Motion sensing** | Real accelerometer: RMS, jerk, spectral entropy, steps, free-fall + impact | shipped |
| F6 | **Trajectory sensing** | Real GPS: speed, vehicle onset, route divergence | shipped |
| F7 | **Audio sensing (opt-in)** | Real Web Audio scream detection, on-device, 2-second RAM buffer | shipped |
| F8 | **Absence sensing** | Didn't arrive, didn't answer, phone went off, signal lost | shipped |
| F9 | **Context multiplier** | The same motion means different things at home at 3 PM and in an unlit lane at 11 PM | shipped |
| F10 | **Anomaly model** | Trained autoencoder scores "is this how *you* normally behave?" | shipped |
| F11 | **Five-state machine** | OFF → ARMED → HEIGHTENED → CHECK-IN → ALERT | shipped |
| F12 | **Silent check-in** | 10-second vibrate. Tap, unlock, or speak to cancel. Nothing sent yet | shipped |
| F13 | **Silent alert** | Screen stays pure black. No sound, no light, no vibration | shipped |
| F14 | **Escalation ladder** | T+0 / 30 / 60 / 90 seconds, each rung requiring more evidence | shipped |
| F15 | **Dead-man's switch** | "Tell me when you're home." If you don't arrive, that *is* the alarm | shipped |
| F16 | **Safe places** | Real open/lit/staffed places from OSM near your position | shipped |
| F17 | **QR contact pairing** | Contacts exchanged phone-to-phone. The server never sees them | shipped |
| F18 | **Duress PIN** | A second PIN that shows a convincing "all clear" while silently alerting | shipped (UI) |
| F19 | **Offline operation** | Service worker + bundled map. Full function with no network | shipped |
| F20 | **SMS / 2G fallback** | The exact sealed payload, handed to the messaging app | shipped |
| F21 | **Manual trigger** | The button exists. It is simply never required | shipped |
| F22 | **Privacy verifier** | In-app airplane toggle so a user can prove the claims themselves | shipped |
| F23 | **Guardian network** | Nearby verified users notified at T+30 s | roadmap |
| F24 | **Breadcrumb replay** | Contacts scrub through the last 10 minutes of movement | partial |

## 4.2 City dashboard (the paid product)

| # | Feature | What it does | Status |
|---|---|---|---|
| C1 | **Ward risk heat map** | Every segment scored, coloured, for any hour | shipped |
| C2 | **Dark-spot ranking** | Ordered by **risk reduction per rupee**, against a lamp budget | shipped |
| C3 | **Counterfactual scoring** | "If this segment were lit to 0.9, risk drops 50 → 38" | shipped |
| C4 | **Exposure weighting** | Prioritises streets people actually use, not just dark ones | shipped |
| C5 | **Data provenance panel** | States exactly which inputs are measured vs modelled | shipped |
| C6 | **Official login** | Real auth surface for corporation staff | shipped |
| C7 | **Before/after audit** | Did the money actually reduce risk? | roadmap |

## 4.3 Developer / judge tools

| # | Feature | Purpose |
|---|---|---|
| D1 | **Live feature vector** | Watch all 12 signals move in real time |
| D2 | **Threat gauge** | Fused score with the three thresholds marked |
| D3 | **State machine display** | Which state, and why |
| D4 | **Event log** | Timestamped audit trail of every decision |
| D5 | **Responder view** | Exactly what a contact sees — empty until ALERT fires |
| D6 | **Sensor readouts** | Live Hz, RMS, jerk, entropy, F0, roughness, GPS accuracy |
| D7 | **Crypto vault** | Real keypair, real QR, real AES-GCM ciphertext on screen |
| D8 | **Scenario simulator** | 7 situations, including the ones that *should* do nothing |
| D9 | **Airplane + time speed** | Verify offline operation and fast-forward the 90-second ladder |
| D10 | **Interactive architecture** | Clickable five-layer system diagram |

---

# 5. Every scenario, in X / Y / Z format

**X** = the situation · **Y** = what happens today · **Z** = what NIZHAL does

---

### Scenario 1 — Walking home from the Thiruvanmiyur bus depot, 11:41 PM

**X.** Meera finishes a late shift at an IT park. The bus drops her 2 km from home. The fastest way is through a residential lane with two working streetlights.

**Y.** She either walks it and hopes, or takes a longer route she has to guess at, or pays for an auto she can't always afford. If she has a safety app, it is closed. Nobody knows her route.

**Z.** Her phone has already armed itself — walking, after dark, elevated street risk, no user action. The map offers three honest choices: **29 min at risk 67**, **30 min at risk 61**, **35 min at risk 47**, each with the metres of unlit road and the worst single segment. She picks. The arrival watch arms automatically for the ETA.

---

### Scenario 2 — She shakes her phone at home while charging it

**X.** She's at home, phone on the charger, and knocks it violently off the table.

**Y.** A shake-to-alert app fires an SOS. Her mother gets a terrifying notification. She uninstalls the app the next day. **This is how safety apps actually die.**

**Z.** Motion score spikes to 0.78. But the context multiplier is near its floor: street risk 0.05, three known devices nearby, phone charging, known location. `threat = 0.05`. **Nothing happens.** No notification, no log entry that matters, no vibration.

> This scenario is more important to demo than the abduction. Anyone can build something that fires. The engineering is in **not** firing.

---

### Scenario 3 — She screams at the TV during a cricket match

**X.** Audio sensing is switched on. India wins off the last ball. She screams.

**Y.** A naive scream classifier alerts the police.

**Z.** The acoustic classifier genuinely fires — 0.82. But it is **one layer**. Street risk 0.05, not alone, not moving, indoors, familiar location. `threat = 0.15`. **Nothing happens.**

> **No single signal can ever trigger an alert.** Not a scream. Not a shake. Not a speed spike. That is a hard architectural rule, not a tuning parameter.

---

### Scenario 4 — She starts running on an empty street

**X.** 11:41 PM, isolated segment, she starts running — maybe for a bus, maybe because she's frightened.

**Y.** Nothing, in every existing app.

**Z.** Motion 0.35, speed anomaly 0.55, isolation 0.9, street risk 0.68. `threat = 0.45`. The engine moves to **HEIGHTENED**: sampling rate increases, the buffer deepens, the map is pre-cached.

**Crucially: nothing is transmitted and she is not interrupted.** If she was catching a bus, she never learns this happened. This state exists purely so that *if* the next five seconds are bad, the response is already loaded.

---

### Scenario 5 — Someone grabs her; the phone is in her bag

**X.** She is pulled. The phone is in a zipped bag against her body.

**Y.** She cannot reach it. Every button-based app is now useless. This is the exact moment they were designed for and the exact moment they fail.

**Z.** The accelerometer reads a **struggle signature**: high jerk, high spectral entropy, non-periodic, sustained 2–5 seconds. That is physically distinct from walking (periodic, low entropy) and from a drop (one impulse). `threat = 0.72`. The phone vibrates a **10-second silent check-in**.

If she can reach it, one tap cancels and nothing was ever sent. If she cannot —

---

### Scenario 6 — The abduction (the full demo)

**X.** She is forced into a vehicle on the ECR side of Thiruvanmiyur.

**Y.** She is reported missing hours later. Police reconstruct her movements from CCTV, if any exists.

**Z.** The timeline:

| Time | Signal | System response |
|---|---|---|
| **T+0** | struggle signature through the bag | HEIGHTENED → CHECK-IN |
| **T+10 s** | **no response to the check-in** | *the absence of a response is itself the signal* |
| **T+30 s** | pedestrian → 50 km/h in 14 s, **heading away from the declared destination** | three independent layers now agree |
| **T+45 s** | fused score 0.94 | **ALERT** |
| **T+45 s** | payload sealed AES-256-GCM, signed, sent | **screen stays pure black** |
| **T+60 s** | contacts receive live location + breadcrumb | |
| **T+90 s** | 112, with three corroborating layers | |

She did nothing. She couldn't. **That's the point.**

---

### Scenario 7 — The attacker takes the phone and switches it off

**X.** The attacker notices the phone and powers it down.

**Y.** Total silence. The last known location is wherever she was when she last used it.

**Z.** An abrupt power-off **while armed, in an elevated-risk segment, with an active journey**, is itself a feature (`powerLoss = 0.95`). Android delivers a shutdown broadcast; we use the moment before the radio dies to flush the sealed alert. And the arrival watch is still running on the *contact's* side: she was due home at 12:10 and never arrived.

> **We detect the absence of the signals you normally produce.** Turning the phone off is not an escape from the system — it is an input to it.

---

### Scenario 8 — She never arrives (the dead-man's switch)

**X.** She tells the app she's going home, ETA 12:10 AM. At 12:22 the phone is stationary in a place she has never been.

**Y.** Nobody notices until morning.

**Z.** `overdue = 0.92`, `isAlone = 0.85`, unfamiliar location. The ladder starts. This scenario requires **no** dramatic sensor event at all — no scream, no struggle, no speeding car. It is pure absence sensing, and it covers the enormous class of incidents that produce no violent signature.

---

### Scenario 9 — She falls (a genuine medical emergency, not an assault)

**X.** She slips on a wet footpath at night and is knocked unconscious. Or an elderly parent falls at home.

**Y.** She lies there until somebody happens to walk past.

**Z.** The accelerometer detects the classic fall pattern: **near-free-fall (|a| < 3 m/s²) followed within 1.2 s by an impact (|a| > 25 m/s²), followed by an absence of motion.** That triple sequence is what distinguishes a fall from a phone being tossed onto a sofa.

`motionFall = 1.0`, then stillness, then the check-in goes unanswered → ALERT.

**This matters commercially:** it makes NIZHAL a *vulnerable-citizen* product, not only a women's-safety product. Elderly parents, night-shift workers, lone security guards, delivery riders. That widens the market and it widens the social good.

---

### Scenario 10 — There is no internet at all

**X.** She's in a basement car park, or on a stretch of ECR with no coverage, or her data pack ran out.

**Y.** The overwhelming majority of safety apps are now decorative. The IJIP study lists internet dependency as a documented cause of failure.

**Z.** See [Section 9](#9-no-internet-airplane-mode-2g-dead-battery) in full. Short version:

- the **map is bundled in the app** (477 KB) — routing and risk scoring need no network
- the **models run on-device** — detection needs no network
- the **state machine is local** — escalation needs no network
- only the final delivery needs a channel, and it degrades: push → SMS → queued-and-retried

**You can verify this in the demo: turn on airplane mode and run the whole abduction scenario again.**

---

### Scenario 11 — Harassment on a crowded bus

**X.** She is being groped on a packed bus. She cannot move, cannot speak, cannot visibly use her phone.

**Y.** Nothing. And honestly, most technology fails here.

**Z.** **We are honest about this one.** Passive sensing is weak here — there is no struggle signature, no divergence, no isolation, and a crowded bus is the *lowest* risk context by our own model. What we offer is the **manual silent trigger**: a hardware-button pattern (volume-down ×3) that can be done inside a pocket, plus the duress PIN.

> Naming a scenario you handle badly buys you more credibility with a technical judge than fifty you handle well.

---

### Scenario 12 — A jealous partner installs it on her phone to track her

**X.** The most common real-world abuse of every location app ever built.

**Y.** Safety apps become stalkerware. This has happened repeatedly, worldwide.

**Z.** Four countermeasures, all architectural:

1. **There is no silent monitoring mode.** The app cannot be configured to report location continuously. The capability does not exist in the code.
2. **A persistent, non-dismissible armed indicator** — you always know it is on.
3. **Contacts can be removed silently.** The removed contact is never notified. (Most apps notify, which is dangerous.)
4. **Duress PIN** — shows a convincing all-clear while alerting.

---

### Scenario 13 — A false alarm actually happens

**X.** The system is wrong. She's fine. Her friend has been notified.

**Y.** Most systems treat this as a catastrophic failure and tune themselves into uselessness to avoid it.

**Z.** We designed for it:

> **A false alarm is one friend receiving a notification. A missed alarm is a life.**
> **We don't make false positives impossible. We make them cheap.**

Cancelling takes one tap, a biometric unlock, or a spoken word. The first rung of the ladder is one person, not the police. The police rung requires three corroborating layers. And every false alarm is a labelled training example that improves the personal model.

---

### Scenario 14 — The judge asks "what if I just spoof it?"

**X.** Somebody sends fake alerts to harass a person or flood the police.

**Y.** Most student projects have no answer.

**Z.** Alerts are **ECDSA P-256 signed** by a device key. The relay **rate-limits per recipient tag**. Recipient tags are **random per alert** so they cannot be enumerated or linked. An unsigned or replayed envelope is dropped. And the police rung is never reached on a single device's say-so.

---

# 6. How each mechanism actually works

> This section exists because abstract claims get rejected. Every mechanism below is described in terms of what is actually measured.

## 6.1 Struggle detection (motion)

**Sensor:** `DeviceMotionEvent` — real accelerometer, ~50–60 Hz on a phone browser, native at 50 Hz.

**Window:** 128 samples ≈ 2.5 seconds, rolling.

**Three features, and why each is insufficient alone:**

| Feature | Computation | Alone it fails because |
|---|---|---|
| **RMS about gravity** | `sqrt(mean((|a| - mean|a|)²))` | running and a bumpy auto ride are also violent |
| **Jerk** | `mean(|aᵢ − aᵢ₋₁|) × sample_rate` | a single hard knock spikes it |
| **Spectral entropy** | Goertzel bank, 16 bins, 0.5–12 Hz, normalised Shannon entropy of the power spectrum | a stationary phone has high entropy in noise |

**The insight:** **walking is periodic.** It produces one dominant peak around 1.8–2.2 Hz and therefore *low* spectral entropy. A struggle is broadband and aperiodic and produces *high* entropy. So:

```
violence   = clamp((rms  - 1.6) / 6)
aperiodic  = clamp((H    - 0.62) / 0.30)     # H = normalised spectral entropy
jerkiness  = clamp((jerk - 12)  / 90)

struggle = 0.45·violence + 0.32·aperiodic + 0.23·jerkiness,  gated on violence > 0.12
```

Must be **sustained 2–5 seconds**. A 40-millisecond impulse is a dropped phone, not a struggle.

## 6.2 Fall detection

Three-stage temporal pattern, not a threshold:

1. **Free fall** — `|a| < 3.0 m/s²` (the phone is unsupported)
2. **Impact within 1.2 s** — `|a| > 25 m/s²`
3. **Followed by stillness**

A phone thrown onto a bed gets stage 1 and a weak stage 2. A phone in a pocket during a real fall gets all three. Stage 3 is what makes it an emergency rather than an accident.

## 6.3 Scream detection (audio) — the real acoustics

**This is on-device. The microphone stream never leaves the browser or the phone. There is a 2-second RAM ring buffer which is continuously overwritten. Nothing is recorded, stored, or uploaded, ever.**

**Sensor:** `getUserMedia` → Web Audio `AnalyserNode`, FFT size 2048.

**Four discriminators:**

| Feature | What it measures | Threshold logic |
|---|---|---|
| **Level (dBFS)** | broadband loudness | `loud = clamp((db + 34) / 26)` |
| **F0** | dominant pitch | a scream is **700–1200 Hz**; conversational speech is **165–255 Hz** |
| **1–4 kHz energy share** | spectral brightness | screams concentrate energy here |
| **Roughness** | **amplitude modulation in the 30–150 Hz band** | **this is the actual discriminator** |

**Why roughness is the key.** Loudness catches a door slam. Pitch catches a singer. **Roughness** — rapid amplitude modulation — is the acoustic property that makes a scream *sound like a scream* rather than like a note. It is what makes the sound aversive to a human listener. It is computed from the envelope of the signal, not the signal itself.

**Plus a sustain gate:** a candidate must hold for **> 300–400 ms**. A door slam is 40 ms.

```
s = 0.34·loud + 0.26·pitch + 0.24·brightness + 0.16·roughness
if (loud < 0.35 or pitch out of band):  s ×= 0.25      # hard gate
if (held < 300 ms):                     s ×= 0.4       # sustain gate
```

**In production** this becomes a ~2 MB TFLite CNN over 64-band log-mel features, YAMNet-style, trained on AudioSet's `Screaming` class **with hard negatives** (cheering, laughing, children playing, traffic). It outputs one float. The buffer is then overwritten.

**Audio is OFF by default.** Motion-only mode is fully functional. This is deliberate: an always-listening microphone is the single biggest adoption barrier for a privacy-conscious user, and we refuse to make it mandatory.

## 6.4 Trajectory sensing

**Sensor:** `navigator.geolocation.watchPosition`, high accuracy.

| Feature | Computation |
|---|---|
| **Speed** | from the fix if available, otherwise differentiated from consecutive positions |
| **Vehicle onset** | max speed over the last 30 s was `< 2.2 m/s` **and** current speed `> 6 m/s` → `clamp((v − 5)/9)` |
| **Speed anomaly** | speed impossible for the declared travel mode |
| **Route divergence** | perpendicular deviation from the planned polyline **and** heading away from the destination |

Vehicle onset is deliberately conditioned on *having been walking*. Getting into an auto you booked is normal; going from walking to 50 km/h in 14 seconds on an isolated segment at 11:41 PM is not.

## 6.5 Isolation sensing

How alone are you, *actually*, right now?

- **BLE / WiFi device density** — how many other phones are nearby *(needs a native app; roadmap)*
- **Ambient babble level** — is there human conversation? *(from the audio layer)*
- **POI opening hours** — are the shops on this street open at this hour?
- **Graph topology** — low-degree endpoints mean dead ends and no escape routes

## 6.6 Absence sensing — the layer nobody else has

The four signals that are defined by something *not* happening:

1. **You didn't arrive.** ETA passed, phone stationary in an unfamiliar place.
2. **You didn't respond.** The check-in went unanswered for 10 seconds. A normal user cancels in about 3.
3. **The phone went off.** Abrupt power loss while armed.
4. **The signal stopped.** Sudden total loss of both GPS and radio in a place with known coverage.

> **"We detect the absence of the signals you normally produce."**

This is the most defensible original idea in the project, and it is the one that covers the incidents which produce no dramatic sensor event at all.

## 6.7 Context multiplier

The same motion means completely different things in different places. Rather than writing separate rules per context, context **scales** the evidence:

```
multiplier = 0.30
           + 0.42 × street_risk     (from the computed map, at this hour)
           + 0.20 × is_night
           + 0.26 × is_alone
           capped at 1.15
```

At home at 3 PM surrounded by people: ≈ 0.35. On an unlit isolated lane at 11:41 PM: ≈ 1.12. **A factor of three, applied to every piece of evidence.** That single term is why shaking your phone at home does nothing and the identical motion in a dark lane starts a check-in.

## 6.8 Street risk `r(segment, hour)`

```
base = 0.30·(1 − frontage)      # are there eyes on the street?
     + 0.18·(1 − footpath)      # do you have to walk in the road?
     + 0.16·(1 − enclosure)     # visibility, blank walls
     + 0.22·isolation           # topological: dead ends, low-degree nodes
     + 0.14·long_stretch        # no exit for a long way

if night (19:00–06:00):
    base = base×0.55 + 0.45·(0.62·(1 − lighting) + 0.38·isolation)
    base ×= 1.22
if late night (22:00–05:00):
    base ×= 1.14
    base += 0.06·(1 − frontage)    # shutters down, no eyes at all

risk = clamp(base) × 100
```

Note what changes at night: **lighting becomes dominant**, and isolation is re-weighted. A well-lit arterial with shops is a different object at 2 PM and 2 AM, and the function models that explicitly.

---

# 7. The fusion engine and the state machine

## 7.1 Why not rules

Twelve signals, treated as binary, is **2¹² = 4,096 cases** to hand-author, test and maintain. That is unmaintainable and it is also wrong — the signals are continuous, not binary.

Instead: a **12-feature vector → a learned function → one score in 0–1.**

## 7.2 The twelve features

| Group | Features |
|---|---|
| **Motion** | struggle signature · fall / phone drop · sudden vehicle onset |
| **Trajectory** | route divergence · speed anomaly |
| **Audio** | scream (on-device, opt-in) |
| **Absence** | check-in unanswered · overdue arrival · abrupt power loss |
| **Context** | street risk (map) · night · alone |

## 7.3 The fusion function

```
evidence = 0.42·struggle  + 0.20·fall       + 0.34·vehicleOnset
         + 0.36·divergence+ 0.16·speedAnom  + 0.22·scream
         + 0.30·noResponse+ 0.40·overdue    + 0.26·powerLoss

raw   = 1 − exp(−1.35 · evidence)        # saturating: no single signal reaches 1
score = clamp(raw × contextMultiplier)
```

The **saturating** form is deliberate. It means that even a maximal single signal cannot reach the alert threshold on its own. Corroboration is mathematically required, not merely encouraged.

## 7.4 Blending with the anomaly model

```
fused = 0.72 × rule_weighted_score + 0.28 × (autoencoder_anomaly × contextMultiplier)
```

The rule-weighted term encodes domain knowledge. The autoencoder term asks a different question: *is this how this person normally behaves?* Two independent views of the same moment.

## 7.5 Worked examples

| Situation | Signals | Score | Outcome |
|---|---|---|---|
| Shake at home, charging | motion 0.78, risk 0.05, not alone | **0.05** | nothing |
| Scream at the TV, company | audio 0.82, risk 0.05, not alone | **0.15** | nothing |
| Running, isolated, 23:41 | motion 0.35, speed 0.55, alone 0.9, risk 0.68 | **0.45** | silent arming |
| Struggle, isolated, 23:41 | motion 0.88, alone 0.92, risk 0.72 | **0.72** | 10 s check-in |
| Struggle + no response + 50 km/h divergence | four layers agree | **0.94** | **silent alert** |

> **"Rare combination to trigger. One tap to cancel."**

## 7.6 The five states

```
OFF ──(walking + dark + risk)──▶ ARMED ──(≥0.38)──▶ HEIGHTENED ──(≥0.62)──▶ CHECK-IN ──(≥0.80 & no response)──▶ ALERT
 ▲                                  ▲                     │                      │
 └──── biometric unlock / home ─────┴─────────────────────┴──── one tap ─────────┘
```

| State | Thresh. | What it does | What it transmits |
|---|---|---|---|
| **OFF** | — | indoors, known safe place, phone idle | nothing |
| **ARMED** | auto | sensing at low duty cycle | **nothing** |
| **HEIGHTENED** | 0.38 | sampling rate up, buffer deepens, map pre-cached | **nothing** |
| **CHECK-IN** | 0.62 | 10-second silent vibrate, "Are you okay?" with reasons | **nothing** |
| **ALERT** | 0.80 | seal, sign, send. Screen forced black | the sealed blob, **only now** |

**Only the terminal state transmits. Audio is never transmitted in any state.**
**Biometric unlock is an automatic stand-down from any state.**

---

# 8. The escalation ladder

| T+ | Audience | What they get | Requires |
|---|---|---|---|
| **0 s** | device only | silent arming, breadcrumb buffer starts | score ≥ 0.80 |
| **10 s** | the user | silent vibrate check-in with the reasons it fired | — |
| **30 s** | nearby guardians | "someone within 400 m may need help" | verified users only |
| **60 s** | trusted contacts | live location + 10-minute breadcrumb | contacts paired |
| **90 s** | 112 / police | full context package | **≥ 3 corroborating layers** |

**Cancellable at every rung** by tap, biometric unlock, or spoken word.

The ladder exists because the cost of being wrong is not constant. Being wrong at T+30 costs a friend a notification. Being wrong at T+90 costs police resources and the user's credibility. So the evidence bar rises with the cost.

---

# 9. No internet, airplane mode, 2G, dead battery

> **This is the section that wins a Zoho judge.** Frugal engineering, rural/low-bandwidth reality, no cloud dependency.

## 9.1 The design rule

> **Every function that could possibly run on the device, runs on the device. The network is used for exactly one thing: delivering the final alert. And even that degrades.**

## 9.2 What works with the network completely off

| Capability | Works offline? | Why |
|---|---|---|
| Street risk map | ✅ | 477 KB graph is **compiled into the app bundle** |
| Route computation | ✅ | Dijkstra + Pareto run in the client |
| Safe places | ✅ | 213 POIs bundled with the graph |
| Motion sensing | ✅ | accelerometer is local hardware |
| Scream detection | ✅ | model runs on-device |
| Anomaly model | ✅ | weights are bundled, inference is local |
| Fusion + state machine | ✅ | pure computation |
| Check-in and cancel | ✅ | local |
| Breadcrumb recording | ✅ | buffered on-device |
| **Alert delivery** | ⚠️ **degrades** | see below |
| Dashboard | ❌ | it is a web product for officials, not a safety function |

**Nine of eleven safety-critical functions are unaffected by total network loss.**

## 9.3 The delivery degradation chain

```
1. Data network available   →  encrypted push via the relay
2. No data, but GSM         →  SMS with the sealed payload (2G is enough)
3. No signal at all         →  queued on-device, retried on reconnect,
                               breadcrumb continues recording locally
4. Phone forced off         →  flush on the shutdown broadcast; the contact-side
                               arrival watch still fires independently
```

**SMS is genuinely sufficient.** The sealed envelope is a few hundred bytes of base64. It fits. 2G coverage in Tamil Nadu is near-universal even where 4G is not — on ECR, in basements, in the interior districts. Designing for the 4G happy path is designing for the wrong India.

## 9.4 How to verify it (do this in the demo)

1. Turn on airplane mode — either the phone's, or the in-app toggle
2. Run the abduction scenario
3. Detection still happens, the state machine still escalates, the alert still seals
4. The app renders **the exact SMS payload** and hands it to the messaging app via an `sms:` intent
5. The event log records `delivered via SMS (airplane mode)`

## 9.5 Service worker

A cache-first service worker means the app itself loads with no network — including on first launch after install, as a PWA from the home screen. `sw.js` is served `no-store` so a stale build can never pin itself.

## 9.6 Battery

The IJIP study lists **high battery consumption** as a documented cause of abandonment. Our answers:

- **motion-only mode by default** — no continuous GPS, no microphone
- **duty cycling** — ARMED samples at a low rate; only HEIGHTENED raises it
- **no continuous network** — nothing is streamed anywhere
- **models are tiny** — the autoencoder is a few hundred parameters; the audio CNN is ~2 MB
- GPS is only pinned during an active journey or an alert

---

# 10. Security and privacy architecture

> **We didn't promise not to misuse your data. We made it impossible for us to have it.**

## 10.1 Identity: there is no account

| Conventional app | NIZHAL |
|---|---|
| email + password | **nothing** |
| phone number verification | **nothing** |
| user ID in a database | **an ECDSA/ECDH P-256 keypair generated on the device** |
| contacts uploaded to the server | **exchanged phone-to-phone by QR code** |
| password reset flow | does not exist, because there is nothing to reset |

There is no `/users` endpoint. There is no user table. **If we were breached tomorrow, there would be nothing of you to steal, because we never had it.**

The onboarding screen literally says *"There is no sign-up"* and shows the user their own device fingerprint. That is the login screen, and it is also the pitch.

## 10.2 The cryptography (real, implemented, inspectable)

```
Identity      : ECDSA P-256 (signing) + ECDH P-256 (key agreement)
Pairing       : public keys exchanged out-of-band via QR
Key agreement : ECDH → HKDF-SHA256 (16-byte random salt, info "nizhal/alert/v1")
Encryption    : AES-256-GCM, 12-byte random IV
Authentication: ECDSA P-256 signature over the ciphertext
Addressing    : random 8-byte recipient tag, regenerated per alert
```

Implemented with **Web Crypto** — no third-party crypto library, no hand-rolled primitives. You can read the actual ciphertext in the app at `#/dev/relay`.

**Why a random per-alert recipient tag?** Because a stable identifier would let the relay operator link alerts to a single person over time, even without decrypting them. Unlinkability is a design requirement, not an afterthought.

## 10.3 The relay knows nothing

The reference relay is **under 60 lines of Python**. Read it — its shortness *is* the argument.

| The relay receives | The relay does NOT receive |
|---|---|
| a random recipient tag | any name, number, or account |
| an AES-GCM ciphertext blob | any plaintext |
| an IV and a signature | any location, ever |
| a timestamp | any contact list |
| | any audio, in any form |

It validates shape, rate-limits, forwards, forgets. It has no user table because there are no users. **Seize the server and you obtain a queue of ciphertext and a rate-limit counter.**

## 10.4 What never leaves the device

| Data | Leaves the device? |
|---|---|
| Audio recordings | **Never.** 2-second RAM buffer, continuously overwritten |
| Raw sensor streams | **Never.** Only derived features, and only locally |
| Continuous location | **Never.** Only during a live, confirmed alert |
| Contact list | **Never.** Peer-to-peer QR only |
| Your normal-behaviour model | **Never.** Personalisation is on-device |
| The encrypted alert blob | **Only** on ALERT, and it is ciphertext |

## 10.5 Anti-stalkerware design

Safety apps get repurposed as stalkerware. This is the most common real-world harm caused by this product category, and it must be designed against explicitly.

1. **No silent monitoring mode exists in the code.** It is not a setting that is off — the capability is absent.
2. **Persistent, non-dismissible armed indicator.**
3. **Contacts removable silently** — the removed party is never notified.
4. **Duress PIN** — a second PIN that displays a convincing "all clear" while alerting.
5. **No remote configuration.** Nobody can change your settings from another device.

## 10.6 Platform hardening

- Keys in **StrongBox / Secure Enclave** where available
- **Play Integrity** attestation to resist cloned or tampered clients
- **Open-source client** — the privacy claims are checkable, not trust-me
- Signed release builds; reproducible where possible

## 10.7 Compliance

Aligned with the **Digital Personal Data Protection Act, 2023**. The alignment is trivial to demonstrate because **data minimisation is the architecture** — there is very little personal data in the system to govern. Purpose limitation, storage limitation and erasure are satisfied by construction rather than by policy.

## 10.8 How a user verifies all of this themselves

1. Turn on airplane mode → the app keeps working → detection is genuinely local
2. Open DevTools → Network → shake the phone, scream → **zero requests**
3. Read the source — the client is open
4. Watch the responder panel stay completely empty until ALERT actually fires

---

# 11. The threat model, including what we do NOT solve

## 11.1 Mitigated

| Threat | Mitigation |
|---|---|
| Server compromise | nothing of value is stored |
| Network interception | end-to-end encryption, signed |
| Alert spoofing / flooding | ECDSA signatures, per-tag rate limiting, random tags |
| Replay attacks | timestamp + IV + signature |
| Stalkerware repurposing | no silent mode, armed indicator, silent removal, duress PIN |
| Cloned/tampered client | Play Integrity attestation |
| Correlation of alerts over time | random per-alert recipient tag |
| Data subpoena | there is nothing to hand over but ciphertext |

## 11.2 NOT mitigated — say these out loud before a judge finds them

1. **A compromised operating system defeats any user-space app.** If the OS is rooted and hostile, nothing we do in user space matters. True of every app on your phone.
2. **The relay still observes connection metadata** — IP address and timing. Mitigable with Tor or an oblivious relay; not mitigated today.
3. **A phone that is already powered off cannot alert.** We can only alert *on* the silence, and only if it was armed beforehand.
4. **Indoor GPS is unreliable**, which degrades the trajectory features specifically.
5. **A familiar route with a known attacker produces no anomaly.** If nothing about the movement is unusual, there is nothing for an anomaly detector to detect. This is the single biggest honest limitation of the entire approach.

> Stating five real limitations makes the other twenty claims credible. A judge who finds a hole you didn't mention discounts everything. A judge you hand the holes to trusts the rest.

---

# 12. Technology stack

## 12.1 What is actually in the repository

| Layer | Technology | Why this and not something else |
|---|---|---|
| **Build** | Vite 8 + TypeScript 6 | instant HMR, one static artefact, no config archaeology |
| **UI** | React 19, hand-written CSS | no component library — the bundle stays small and the design stays ours |
| **Routing** | hand-rolled hash router (~30 lines) | works on any static host with zero rewrite rules, including a USB stick |
| **Map rendering** | **self-contained SVG** over the bundled graph | **no Leaflet, no Mapbox, no tile server, no API key** — cannot break on expo wifi |
| **Graph + routing** | TypeScript Dijkstra + Pareto sweep | runs client-side; no routing server to deploy or pay for |
| **Motion DSP** | Goertzel filter bank, hand-written | 16 bins is far cheaper than a full FFT and is all we need |
| **Audio DSP** | Web Audio `AnalyserNode` + envelope analysis | native, zero-dependency, genuinely on-device |
| **ML training** | **numpy + Adam, hand-written** | no TensorFlow, no PyTorch, no CUDA — trains in 5 seconds on a laptop |
| **ML inference** | plain TypeScript matrix multiply | ~200 lines; no runtime, no WASM blob, no ONNX |
| **Cryptography** | **Web Crypto API** | standard primitives, no third-party crypto library, no hand-rolled maths |
| **QR** | `qrcode` (the only runtime dependency beyond React) | |
| **Offline** | service worker + PWA manifest | installable, works with the network off |
| **Data pipeline** | Python + Overpass API | run once, output committed to the repo |
| **Backend (optional)** | FastAPI, under 60 lines | the relay is deliberately trivial |
| **Container** | Docker + nginx + compose | reproducible, self-hostable |
| **CI/CD** | GitHub Actions → Pages | typecheck, build, deploy |

**Total runtime dependencies: React, React-DOM, qrcode. That's it.**

## 12.2 The production/native stack (the roadmap version)

| Component | Technology |
|---|---|
| Mobile client | React Native or Kotlin (for background sensing and BLE) |
| On-device models | TFLite (~2 MB scream CNN, quantised) |
| Activity recognition | Android ActivityRecognition API / Core Motion |
| City pipeline | Python, PyTorch, **PyTorch Geometric** (GNN) |
| Imagery | CNN segmentation over Mapillary; VIIRS night-lights rasters |
| Spatial store | PostgreSQL + **PostGIS** |
| Routing at scale | self-hosted **OSRM** |
| Relay | FastAPI + Redis for rate limiting |
| SMS | any Indian aggregator, or a local GSM modem for pilots |

## 12.3 What we deliberately refused

| Rejected | Why |
|---|---|
| **OpenAI / Gemini / any hosted LLM** | privacy, cost, latency, offline requirement — and it would be dishonest ML |
| **Google Maps / Mapbox tiles** | API keys, cost, network dependency, and they do not expose the attributes we score |
| **Firebase / any BaaS** | it would mean a user database, which is the exact thing we are claiming not to have |
| **Blockchain** | there is no problem here that it solves |
| **A component library** | bundle size and visual genericness |
| **Continuous cloud inference** | battery, cost, privacy, and it breaks offline |

> **The Zoho line: "There is no OpenAI API key in this project."**
> Frugal, self-hosted, own-IP, privacy-first, works on 2G. That is Zoho's engineering culture stated back to them.

---

# 13. Code architecture

```
nizhal-app/
├─ src/
│  ├─ app/              shell, route table, hash router      ← 3 files, no logic
│  ├─ core/             PURE logic — zero React imports anywhere
│  │  ├─ geo/           city.ts (graph + r(segment,hour)) · routing.ts (Dijkstra + Pareto)
│  │  ├─ ml/            fusion.ts (the 12-feature function) · autoencoder.ts (inference)
│  │  ├─ sensors/       imu.ts (accel + GPS) · audio.ts (Web Audio scream detection)
│  │  ├─ crypto/        identity.ts (ECDH, AES-256-GCM, signing)
│  │  └─ types.ts       the shared vocabulary
│  ├─ engine/           useSafetyEngine.ts ← THE STATE MACHINE, one file
│  │                    escalation.ts      ← the ladder, as data
│  ├─ services/api/     contract.ts ← THE BACKEND SEAM
│  │                    localApi.ts (in-browser) · httpApi.ts (real server) · index.ts (switch)
│  ├─ features/         marketing · onboarding · citizen · city · devtools · architecture
│  ├─ ui/               Phone.tsx · CityMap.tsx · Icons.tsx
│  └─ data/             chennai.json (generated, 477 KB) · model.json (trained)
├─ tools/               build_graph.py · train_autoencoder.py · gen_arch_diagrams.py
├─ docs/                ARCHITECTURE.md · openapi.yaml · NIZHAL_Architecture.docx · img/
└─ deploy/              Dockerfile · nginx.conf · docker-compose.yml · relay/relay.py
```

## Two rules, and everything follows

**Rule 1 — `core/` never imports React.**
It is pure, testable, portable logic. It would move to React Native or a Node worker unchanged. You can unit-test the entire risk model and fusion engine with no DOM.

**Rule 2 — no screen imports an API implementation.**
Screens import `@/services/api`. That resolves to the in-browser adapter or an HTTP client depending on one environment variable. Swapping in a real backend is a build flag, not a refactor.

## Navigation is real URLs

| Surface | Routes |
|---|---|
| Website | `#/` · `#/login` |
| Citizen app | `#/app/setup` · `#/app` · `#/app/map` · `#/app/journey` · `#/app/places` · `#/app/privacy` |
| City dashboard | `#/city` · `#/city/architecture` |
| Dev tools | `#/dev/engine` · `#/dev/sensors` · `#/dev/relay` |

One table in `src/app/routes.ts` declares every navigable state. No tangled booleans.

---

# 14. The API contract

The entire backend surface of NIZHAL is **five endpoints**. The contract itself is a security artefact: notice what is missing.

| Endpoint | Purpose | Contains identity? |
|---|---|---|
| `POST /risk/tiles` | scored street segments for a bbox and hour | no |
| `POST /routes` | Pareto-optimal routes over time vs risk | no |
| `POST /relay/alert` | submit an opaque encrypted envelope | **no — ciphertext only** |
| `GET  /city/works` | interventions ranked by risk reduction per rupee | no — aggregate |
| `GET  /places` | open, lit, staffed places near a point | no |

**There is no `/users`. There is no `/login`. There is no `/location`.**

The only write endpoint in the entire system accepts this and nothing else:

```jsonc
{
  "v": 1,
  "recipientTag": "a3f9...",   // random per alert — alerts cannot be linked
  "iv":           "base64",    // AES-GCM initialisation vector
  "ciphertext":   "base64",    // AES-256-GCM
  "signature":    "base64",    // ECDSA P-256 over the ciphertext
  "createdAt":    1759100000
}
```

Full specification in `docs/openapi.yaml`. The same contract is satisfied **in the browser today**, which is why the product deploys as a static bundle and keeps working in airplane mode.

```bash
VITE_API_MODE=local   # default — computed in the browser, static deploy
VITE_API_MODE=http    # talk to a FastAPI service implementing openapi.yaml
```

---

# 15. Data: sources, provenance, honesty

## 15.1 What is actually loaded

Live Overpass extract of **Thiruvanmiyur / Adyar, Chennai** (bbox 12.968–13.000 N, 80.240–80.272 E):

| Quantity | Value |
|---|---|
| Street segments | **2,970** |
| Junctions | **2,322** |
| Road length | **212.5 km** |
| Amenities and shops | **213** |
| Bundle size | **477 KB** |

Real street names appear throughout the product — *Dr MGR Main Road*, *Lakshmi Maternity Hospital*, *Adyar J2*. It is a real place.

## 15.2 Provenance — measured vs modelled

**We show the judge which is which rather than implying it is all measured.** The city dashboard has a dedicated Data Provenance panel.

| Attribute | Measured | Modelled |
|---|---|---|
| Street geometry, class, name | **2,970 segments** (OSM) | — |
| Lighting | **209 segments** (OSM `lit` tag) | road-class prior + deterministic per-segment jitter |
| Footpath | **6 segments** (OSM `sidewalk` tag) | road-class prior |
| Frontage / eyes on street | **835 segments** (measured from 213 real POIs within 90 m) | road-class prior |
| Enclosure | — | road class + lane count |
| Topological isolation | **all** (computed from the graph) | — |

**In production**, the modelled share is replaced by VIIRS night-lights and CNN segmentation of Mapillary imagery. The provenance panel is the honest version of that roadmap.

Determinism matters: per-segment variation uses a **hash of the segment ID**, never `Math.random()`. The same street always scores the same thing. A risk model that changes on refresh is not a model.

## 15.3 Attribution

Street data © OpenStreetMap contributors, **ODbL**. Stated in the app, in the docs, and in the deck.

---

# 16. The machine learning, in detail

## 16.1 The problem with training a distress detector

**There is no dataset of real assaults recorded by accelerometers.** There never will be, and manufacturing one would be both unethical and useless.

Every team that claims to have "trained a model to detect attacks" either trained it on staged data and is overselling, or is lying. A technical judge will ask this question.

## 16.2 Our answer: train on normal, flag the rest

> **We do not train a model to recognise danger. We train a model to recognise you, and flag everything that isn't.**

This is **anomaly detection**, and it is the correct formulation for this problem.

## 16.3 The model that is actually trained and shipped

```
Architecture : dense autoencoder, 9 → 5 → 3 → 5 → 9, tanh
Loss         : MSE reconstruction
Optimiser    : Adam, lr 3e-3, 260 epochs, batch 256
Framework    : numpy. Hand-written backprop. No TensorFlow, no PyTorch.
Training set : 24,000 samples of NORMAL behaviour, four modes:
                 · walking calmly
                 · riding a bus or auto (vehicle speed is NORMAL here)
                 · pocket jostle / running for the bus
                 · stationary — desk, asleep, noisy room
Training time: about 5 seconds on a laptop
Output       : reconstruction error, calibrated against the training p99
```

**Note the second training mode.** Including vehicle rides as *normal* is what stops the model from screaming every time you get into an auto. That is the kind of detail that separates a real model from a demo.

## 16.4 Measured results

| Input | Reconstruction error | Anomaly score |
|---|---|---|
| Calm walk *(normal)* | 0.00005 | **0.01** |
| Bus ride *(normal)* | 0.00006 | **0.01** |
| Struggle in a bag | 0.00979 | **1.00** |
| Pulled into a vehicle | 0.16830 | **1.00** |
| Never arrived home | 0.13594 | **1.00** |
| Phone forced off | 0.22339 | **1.00** |

Training-set percentiles: p50 = 0.00040, p95 = 0.00281, **p99 = 0.00485** (the calibration point).

**The separation is three to four orders of magnitude.** This is a real, reproducible result — rerun `tools/train_autoencoder.py` and you get it again.

## 16.5 The models in the full production system

| Model | Task | Training data |
|---|---|---|
| **1D-CNN / LSTM** | activity + struggle classification from IMU | UCI-HAR, MotionSense, WISDM + staged distress |
| **YAMNet-style CNN** | scream detection, 64-band log-mel | AudioSet `Screaming` **with hard negatives** |
| **Autoencoder / Isolation Forest** | personal behavioural anomaly | the user's own normal behaviour, on-device |
| **CNN segmentation** | lighting, footpath, frontage from street imagery | Mapillary + Cityscapes |
| **GNN (PyTorch Geometric)** | risk propagation over the street graph | OSM topology + PU-labelled incidents |
| **PU learning + IPW** | correct survivorship bias | NCRB + exposure estimates |

**Hard negatives matter.** A scream classifier trained only on screams will fire on cheering, laughing children, and a scooter horn. The negatives are the work.

## 16.6 Personalisation

The behavioural baseline is **per-user and on-device**. Your walking gait, your usual routes, your typical hours. It never leaves the phone, so it is both more accurate than a population model and impossible for us to inspect.

---

# 17. The city dashboard and the business model

## 17.1 The business problem with safety apps

They are free, they must be free, and they have no revenue. So they die, or they sell user data — which is the one thing we have made structurally impossible.

## 17.2 The answer: sell the map, not the user

> **The app helps one woman avoid one street tonight. The dashboard fixes the street so that nobody has to avoid it next year.**

The aggregate, anonymous risk layer is genuinely valuable to people with budgets:

| Customer | What they buy | Why they pay |
|---|---|---|
| **Municipal corporations** (GCC) | works ranked by risk reduction per rupee | they have a lighting budget and no way to prioritise it |
| **Transport authorities** (CMRL, MTC) | last-mile risk around stations and stops | documented ridership impact |
| **Night-shift employers** — IT parks, hospitals, BPOs | safe-route and arrival assurance for staff | legal duty of care; cheaper than cab fleets |
| **Campuses** | the same, for students | **our own college is customer zero** |
| **Insurers / gig platforms** | rider and delivery-partner risk exposure | claims reduction |

**Proof this model works:** Safetipin already sells municipal data. Delhi identified **7,483 dark spots** and fixed roughly **70 %**. The market is proven — we are competing on the quality and honesty of the data layer, not inventing a market.

## 17.3 What the dashboard actually computes

For each segment: re-score it counterfactually as if it were lit to 0.9, weight the improvement by **exposure** (road class × frontage × length), divide by the **number of lamps required** (one per ~30 m), and rank by **risk reduced per lamp**.

The output is a sentence a commissioner can act on:

> *"Fixing these 10 segments removes 340 exposure-weighted risk points for about 200 streetlights — far more than spending the same money at random."*

**That ranking is the product.** Not the heat map — anyone can draw a heat map. The ranking against a budget is what gets purchased.

## 17.4 The social-good framing, honestly

Free for citizens, forever. No ads. No data sale about individuals — structurally impossible.
Open-source client. Aligned with DPDP 2023. Works on cheap phones, on 2G, in Tamil.

The revenue comes from the entities whose *job* it already is to make streets safe, and it pays them back in better-targeted spending. The incentives point the same way. That is the whole argument, and it does not require a billion-dollar TAM slide.

---

# 18. Objections and answers

### "This already exists — Safetipin does this."
Safetipin is crowdsourced, and crowdsourced safety maps are **blindest where danger is highest**, because women already avoid the worst streets. We compute the map from open data, so it works on day one with zero users, and we correct the bias explicitly with PU learning, inverse-propensity weighting and a GNN. Also, Safetipin still needs you to open it. We don't.

### "Isn't this just another SOS app?"
There is no SOS button in the primary flow. The product's entire premise is that in the moment that matters you cannot press anything. Ask yourself when you last opened a safety app.

### "What about false alarms?"
We designed for them rather than against them. A false alarm is one friend pinged; a missed alarm is a life. Cancelling is one tap, one biometric, or one spoken word. The police rung requires three corroborating layers. **We don't make false positives impossible — we make them cheap.**

### "You can't train a model without assault data."
Correct, and we don't. We train an autoencoder on **normal behaviour only** and flag what it cannot reconstruct. Calm walk 0.01, abduction 1.00. Rerun the training script and verify it.

### "The battery will die."
Motion-only by default, duty-cycled sampling, no continuous GPS, no continuous network, tiny models. Battery drain is a documented killer of this app category and we treated it as a first-class requirement.

### "What if there's no internet?"
The map, the models, the state machine and the escalation logic are all on-device. Only delivery needs a channel, and it degrades push → SMS → queued. Turn on airplane mode in the demo and run the whole scenario again.

### "How do I know you're not spying on me?"
You don't have to trust us. There is no account, your identity is a keypair on your device, your contacts are exchanged by QR, the payload is end-to-end encrypted, and the client is open source. Airplane-mode test plus a packet log proves it in 30 seconds.

### "Someone could use this to stalk their partner."
No silent monitoring mode exists in the code. There is a persistent armed indicator. Contacts can be removed silently. There is a duress PIN. This is the most common real harm in this category and it has to be designed against explicitly.

### "This is a college project, none of it is real."
Roughly: the street graph, risk model, routing, sensors, audio DSP, trained model, fusion, state machine and cryptography are real and running. The satellite pipeline, GNN, guardian network and production relay are roadmap, and every one of them is labelled **roadmap** inside the product UI. Here is the table.

### "Why should a Zoho engineer care?"
No hosted AI API. No paid third-party services. Self-hosted, own-IP, offline-first, works on 2G, three runtime dependencies, trains on a laptop in five seconds. **There is no OpenAI API key in this project.**

---

# 19. What is real vs what is roadmap

## Real, running, inspectable

| Component | Evidence |
|---|---|
| Chennai street graph | 2,970 segments, 2,322 nodes, 212.5 km, 213 POIs, 477 KB, bundled |
| Risk model `r(segment, hour)` | `src/core/geo/city.ts`, provenance shown in the dashboard |
| Pareto routing | `src/core/geo/routing.ts`, Dijkstra × 6 alphas, non-dominated filter |
| Accelerometer features | `DeviceMotionEvent` → RMS, jerk, Goertzel spectral entropy, steps, fall |
| GPS features | `watchPosition` → speed, vehicle onset |
| Scream detection | Web Audio → F0, 1–4 kHz share, roughness, sustain gate |
| Autoencoder | trained by `tools/train_autoencoder.py`, weights committed, results reproducible |
| Fusion + 5-state machine | `src/engine/useSafetyEngine.ts` |
| Cryptography | Web Crypto ECDSA/ECDH P-256 → HKDF → AES-256-GCM, real ciphertext on screen |
| Offline + SMS fallback | service worker; `sms:` intent with the real payload |
| City dashboard | counterfactual lighting, exposure weighting, per-lamp ranking |
| Reference relay | `deploy/relay/relay.py`, FastAPI, under 60 lines |

## Roadmap — labelled as such inside the product

| Component | Why it isn't built |
|---|---|
| VIIRS night-lights ingestion | needs a data pipeline and storage, not 36 hours |
| CNN segmentation of Mapillary imagery | weeks of training and labelling |
| GNN + PU-learning + IPW | needs incident data and a real training loop |
| BLE / WiFi device density | browsers cannot; requires a native app |
| Guardian network | requires real users and a verification scheme |
| Production relay + push infrastructure | deliberately trivial, simply not deployed |
| TFLite ports for always-on background sensing | requires the native client |

> **Say it first, on stage: "Here is exactly what is real and what isn't."** A Zoho engineer will respect that far more than a demo pretending everything works — and they will find the seam anyway.

---

# 20. Deployment

| Target | Command | Result |
|---|---|---|
| Local development | `npm run dev` | http://localhost:5173 |
| Type check | `npm run typecheck` | must be clean |
| Static build | `npm run build` | `dist/` — deploy anywhere |
| Netlify / Vercel | `git push` | `netlify.toml` / `vercel.json` included |
| GitHub Pages | push to `main` | `.github/workflows/deploy.yml` |
| Docker | `npm run docker` | nginx on `:8080`, optional relay on `:8000` |
| Regenerate the map | `npm run data:graph` | Overpass dump → `src/data/chennai.json` |
| Retrain the model | `npm run data:model` | numpy → `src/data/model.json` |

## Sensors require HTTPS

Accelerometer, geolocation and microphone **will not initialise over plain HTTP on a LAN IP**. `localhost` is exempt; `192.168.x.x` is not.

```bash
npm run dev -- --host          # LAN URL: the UI works, sensors will NOT
npx localtunnel --port 5173    # HTTPS URL: sensors WILL work
```

Every host config sets:

```
Permissions-Policy: accelerometer=(self), gyroscope=(self), geolocation=(self), microphone=(self)
```

and serves `sw.js` as `no-store` so a stale build can never pin itself.

## PWA

Manifest + icons + service worker. "Add to Home Screen" on Android gives a full-screen app with an icon that keeps working with the network off.

---

# 21. The demo script

**Seven minutes. Rehearse it. The order is the argument.**

| # | Do | Say |
|---|---|---|
| 1 | Open `#/` | *"Delhi Police's Himmat app: 30,821 users in a city of 19 million. A Parliamentary committee called it a comprehensive failure. Not because the police are bad — because it needed you to press a button."* |
| 2 | **Open the citizen app** → onboarding | *"There is no sign-up. Your identity is a keypair on this device. If we're hacked tomorrow there's nothing of you to steal."* |
| 3 | Demo controls → **Shake phone at home** | *"Watch the score. Nothing. This is the hard part — not firing."* |
| 4 | **Scream near the TV** | *"The classifier genuinely fired. It's one layer. No single signal can ever trigger an alert."* |
| 5 | Phone → **Map** | *"Real Chennai streets, computed with zero users. 29 minutes at risk 67, or 35 at risk 47. We never blend time and risk into one number — you see the trade-off and you choose."* |
| 6 | **Struggle inside a bag** → **cancel** | *"Ten-second check-in. One tap. Read the log — nothing was ever transmitted."* |
| 7 | **Pulled into a vehicle** — let it run | *"No response. Speed divergence. Three layers agree."* **Screen goes black.** *"She did nothing. She couldn't. That's the point."* |
| 8 | `#/dev/relay` | *"That's the real ciphertext. That's everything our server receives."* |
| 9 | **Airplane mode** → repeat 7 | *"Same detection. Delivered over SMS. Core alerting works on 2G."* |
| 10 | `#/city` → login → works ranking | *"This is what pays for it. 200 streetlights, ranked by risk reduction per rupee. That's what a corporation buys."* |
| 11 | `#/city/architecture` | *"Five layers. Shipped and roadmap, labelled. Here's exactly what's real."* |

**Close on:** *"We're not claiming to prevent crime. We're claiming to take time-to-detection from hours to ninety seconds, with zero user action. And there is no OpenAI API key in this project."*

**Fallbacks if something breaks:** everything is client-side with no network dependency, so the only real risk is the laptop. Have the static `dist/` on a USB stick and the deck as a PDF.

---

# 22. Lines worth memorising

> **"Every safety app asks you to press a button. We built one you never touch."**

> **"We detect the absence of the signals you normally produce."**

> **"A crowdsourced safety map is blindest exactly where danger is highest."**

> **"Rare combination to trigger. One tap to cancel."**

> **"We don't make false positives impossible. We make them cheap."**

> **"A false alarm is one friend pinged. A missed alarm is a life."**

> **"We didn't promise not to misuse your data. We made it impossible for us to have it."**

> **"We don't train a model to recognise danger. We train it to recognise you, and flag everything that isn't."**

> **"The app helps one woman avoid one street tonight. The dashboard fixes the street so nobody has to avoid it next year."**

> **"She did nothing. She couldn't. That's the point."**

> **"There is no OpenAI API key in this project."**

---

## Key numbers to have on the tip of your tongue

| | |
|---|---|
| Himmat users / Delhi population | **30,821 / 19,000,000** |
| State app coverage (IJIP 2025) | **0.35 % and 0.57 %** |
| Safetipin scale | 9 parameters · 150,000 spots · ~30 cities |
| Delhi dark spots found / fixed | **7,483 / ~70 %** |
| Our street segments | **2,970** · 2,322 junctions · **212.5 km** |
| Real POIs used | **213** |
| Map bundle | **477 KB**, works offline |
| Autoencoder | **9-5-3-5-9**, 24,000 normal samples |
| Normal walk vs abduction | **0.01 vs 1.00** |
| Thresholds | heighten **0.38** · check-in **0.62** · alert **0.80** |
| Check-in window | **10 seconds** |
| Escalation | **T+0 / 30 / 60 / 90 s** |
| Time to detection | **under 90 seconds**, zero user action |
| Runtime dependencies | **3** (react, react-dom, qrcode) |
| Backend endpoints | **5**, none of which identify a person |
| Reference relay | **under 60 lines** |

---

*Street data © OpenStreetMap contributors, ODbL.*
*Built for the Crescent Project Expo · Problem Statement 08.*

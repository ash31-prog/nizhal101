# NIZHAL — System Architecture

> Every safety app asks you to press a button. We built one you never touch.

**PS 08 · Safer Urban Mobility for Women & Vulnerable Citizens**

---

## 1. The one-paragraph version

NIZHAL is a **client-heavy, server-minimal** system. A street-risk map is computed
offline from open data and shipped inside the app. On the phone, five sensing layers
produce twelve features; a fusion function and a trained autoencoder collapse those
into a single 0–1 score that drives a five-state machine. Only the terminal state
transmits, and what it transmits is an AES-256-GCM blob that our server cannot read.
A separate web dashboard sells the aggregate risk data to the people who own the streets.

The architecture is the product argument: **we are not trustworthy, we are incapable.**

---

## 2. Layers

| | Layer | Runs where | Responsibility |
|---|---|---|---|
| **A** | City Risk Pipeline | build time, offline | open data → scored street graph |
| **B** | On-Device Engine | the phone | sensors → features → score → state |
| **C** | Zero-Knowledge Relay | one small server | forward opaque ciphertext |
| **D** | Escalation | humans | graduated response, cheap to cancel |
| **E** | City Data Layer | web | the paid product |

### A · City Risk Pipeline

Input is an Overpass extract of Thiruvanmiyur/Adyar, Chennai:
**2,970 segments, 2,322 junctions, 212.5 km, 213 amenities.**

```
r(segment, hour) = f(lighting, frontage, footpath, enclosure,
                     topological isolation, segment length) × night multipliers
```

Provenance is tracked per segment and shown in the UI — `lit` comes from the OSM tag
on 209 segments, frontage is measured from real POIs on 835, and the rest uses a
road-class prior. **We show which is which rather than implying it is all measured.**

Output is a 477 KB signed JSON bundle compiled into the app, which is why routing
and risk work with the network off.

*Roadmap:* VIIRS night-lights, CNN segmentation of Mapillary imagery, and a GNN with
PU-learning + inverse-propensity weighting to correct survivorship bias.

### B · On-Device Engine — `src/engine/useSafetyEngine.ts`

```
IMU 50 Hz ─┐
GPS ───────┼─→ 12-feature vector ─┬─→ weighted evidence ─┐
Mic ───────┤                      └─→ autoencoder ───────┼─→ fused score ─→ FSM
Map + hour ┘                                             │
                                          context multiplier
```

**Motion.** RMS, jerk and **spectral entropy** from a Goertzel bank over 0.5–12 Hz.
Walking is periodic and produces low entropy; a struggle is broadband and aperiodic.

**Audio (opt-in).** F0, the share of energy in 1–4 kHz, and **roughness** —
amplitude modulation, which is what makes a scream sound like a scream rather than
like singing. Two-second RAM ring buffer, continuously overwritten, never stored.

**Anomaly.** A 9-5-3-5-9 dense autoencoder trained on **normal behaviour only**
(24,000 samples: walking, vehicle rides, pocket jostle, stationary). Calm walk scores
0.01; being pulled into a vehicle scores 1.00. No assault data was used, or needed.

**Why not rules?** Twelve binary signals is 2¹² = 4,096 cases. A learned function over
a feature vector is one function.

**States.** `OFF → ARMED → HEIGHTENED → CHECK-IN → ALERT`, thresholds 0.38 / 0.62 / 0.80.
Only ALERT transmits. Biometric unlock is an automatic stand-down.

### C · Zero-Knowledge Relay — `deploy/relay/relay.py`

Identity is an ECDSA + ECDH P-256 keypair generated on the device. Contacts pair by QR.
Alerts are sealed ECDH → HKDF-SHA256 → AES-256-GCM, then signed, then posted with a
**random per-alert recipient tag** so two alerts cannot be linked.

The reference relay is under 60 lines. It has no user table because there are no users.

### D · Escalation

| T+ | Audience | Requires |
|---|---|---|
| 0 s | device | silent arming, breadcrumb begins |
| 10 s | user | one tap, biometric or voice cancels |
| 30 s | nearby guardians | verified users within 400 m |
| 60 s | trusted contacts | live location + breadcrumb |
| 90 s | 112 / police | ≥3 corroborating layers |

> A false alarm is one friend pinged. A missed alarm is a life. We tune for sensitivity
> and make cancelling trivial.

### E · City Data Layer

Aggregate only. Ranks interventions by **risk reduction per rupee** against a lamp
budget, with a before/after counterfactual. Buyers: municipal corporations, transport
authorities, night-shift employers, campuses.

---

## 3. Code architecture

```
src/
  app/        shell, route table, hash router            ← 3 files, no logic
  core/       PURE logic, zero React imports
    geo/      graph, r(segment,hour), Dijkstra + Pareto
    ml/       fusion function, trained autoencoder
    sensors/  IMU, GPS, Web Audio feature extraction
    crypto/   identity, sealing
  engine/     useSafetyEngine — the state machine, one file
  services/api/  CONTRACT + local adapter + http adapter  ← the backend seam
  features/   marketing · onboarding · citizen · city · devtools · architecture
  ui/         Phone frame, CityMap, icons
  data/       generated: chennai.json, model.json
```

Two rules make this maintainable:

1. **`core/` never imports React.** It is portable to React Native or a Node worker
   unchanged, and it is unit-testable without a DOM.
2. **No screen imports an API implementation.** Screens import `@/services/api`, which
   resolves to the in-browser adapter or the HTTP adapter based on `VITE_API_MODE`.
   Swapping in a real FastAPI backend is a build flag, not a refactor.

---

## 4. Deployment

| Target | Command | Result |
|---|---|---|
| Local dev | `npm run dev` | http://localhost:5173 |
| Static build | `npm run build` | `dist/` — drop on any host |
| Netlify / Vercel | push | `netlify.toml` / `vercel.json` included |
| GitHub Pages | push to `main` | `.github/workflows/deploy.yml` |
| Docker | `npm run docker` | nginx on :8080 + optional relay on :8000 |

**Sensors require a secure context.** Accelerometer, geolocation and microphone will
not initialise over plain HTTP on a LAN IP. Deploy to HTTPS, or tunnel
(`npx localtunnel --port 5173`), then open on a phone.

The nginx config and the host configs set:

```
Permissions-Policy: accelerometer=(self), gyroscope=(self), geolocation=(self), microphone=(self)
```

The service worker is served `no-store` so a stale build can never pin itself.

---

## 5. Threat model and residual limits

**Mitigated.** Server compromise (nothing to steal), network interception (E2E),
alert spoofing (signed + rate limited), stalkerware use (no silent monitoring mode,
persistent armed indicator, contacts removable silently, duress PIN).

**Not mitigated — stated openly.**

1. A compromised OS defeats any user-space app.
2. The relay still sees connection metadata (IP, timing).
3. A phone that is already off cannot alert; we can only alert *on* the silence.
4. Indoor GPS is unreliable.
5. A familiar route with a known attacker produces no anomaly.

We never claim to prevent crime. We claim to cut time-to-detection from hours to
roughly 90 seconds, with zero user action.

---

Street data © OpenStreetMap contributors, ODbL.

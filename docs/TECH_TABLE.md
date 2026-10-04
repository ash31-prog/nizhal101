# NIZHAL — Technology Map

Every feature, the technology behind it, whether an AI model is involved, and the file it lives in.

**Read the "AI model" column carefully.** Most of this product is deterministic signal
processing and classical algorithms. There is exactly **one trained model** in the
entire codebase. That is a deliberate engineering decision, not a gap — see §4.

---

# 1. Feature → Technology → Model

## 1.1 Map, risk and routing

| Feature | Technology used | AI model | File |
|---|---|---|---|
| **Street graph** | OpenStreetMap via Overpass API, baked to JSON at build time | **none** | `tools/build_graph.py` → `src/data/chennai.json` |
| **Risk score `r(segment,hour)`** | Weighted formula over lighting, frontage, footpath, enclosure, graph isolation, length + night multipliers | **none** — deterministic | `src/core/geo/city.ts` |
| **Frontage measurement** | Spatial bucket index, count POIs within 90 m of segment midpoint | **none** | `tools/build_graph.py` |
| **Topological isolation** | Node degree from the adjacency list (dead ends, few exits) | **none** | `src/core/geo/city.ts` |
| **Routing** | **Dijkstra** on `α·time + (1−α)·risk`, swept over 6 alphas | **none** | `src/core/geo/routing.ts` |
| **Safe vs fast trade-off** | **Pareto front** — non-dominated filter over (minutes, risk) | **none** | `src/core/geo/routing.ts` |
| **Map rendering** | Hand-written **SVG** — no Leaflet, no tiles, no API key | **none** | `src/ui/CityMap.tsx` |
| **Lighting layer** | OSM `lit` tag where present (209 segs), road-class prior elsewhere, drawn dashed when inferred | **none** | `src/ui/CityMap.tsx` |
| **Tap-a-street explainer** | Per-factor decomposition of the risk formula | **none** | `src/features/citizen/ExploreScreen.tsx` |
| **Safe places** | OSM amenity/shop nodes, Euclidean distance, hour-based open/closed | **none** | `src/core/geo/city.ts` → `nearbyPlaces()` |
| **Dark-spot ranking** | Counterfactual re-score (lighting→0.9), exposure weighting, per-lamp division | **none** | `src/core/geo/city.ts` → `darkSpots()` |

## 1.2 Sensing — the detectors

| Feature | Technology used | AI model | File |
|---|---|---|---|
| **Accelerometer access** | `DeviceMotionEvent` (Web), ~60 Hz, magnitude √(x²+y²+z²) | **none** | `src/core/sensors/imu.ts` |
| **Energy / violence** | **Welford** running variance — O(1), numerically stable | **none** | `src/core/sensors/dsp.ts` |
| **Jerk** | Mean absolute first difference × sample rate | **none** | `src/core/sensors/imu.ts` |
| **Rhythm detection** | **Goertzel** filter bank, 16 bins 0.5–12 Hz → **Shannon spectral entropy** | **none** | `src/core/sensors/dsp.ts` |
| **Struggle score** | Weighted sum of the three above + gate on violence | **none** — hand-weighted | `src/core/sensors/imu.ts` |
| **Step counter** | Peak detection with 250 ms refractory | **none** | `src/core/sensors/imu.ts` |
| **Fall detection** | **4-stage finite state machine**: freefall → impact → settle → stillness, thresholds derived from projectile physics | **none** — deterministic FSM | `src/core/sensors/imu.ts` → `fallStep()` |
| **Carried gate** | Gait seen within 90 s, else fall ×0.12 = "drop, not fall" | **none** | `src/core/sensors/imu.ts` |
| **GPS / trajectory** | `navigator.geolocation.watchPosition`, differentiated speed | **none** | `src/core/sensors/imu.ts` → `GeoEngine` |
| **Vehicle onset** | Was <2.2 m/s for 30 s, now >6 m/s → ramp | **none** | `src/core/sensors/imu.ts` |
| **Microphone access** | `getUserMedia` → **Web Audio** `AnalyserNode`, FFT 2048 | **none** | `src/core/sensors/audio.ts` |
| **Loudness** | RMS → dBFS | **none** | `src/core/sensors/audio.ts` |
| **Pitch (F0)** | Dominant spectral bin, 150–3000 Hz | **none** | `src/core/sensors/audio.ts` |
| **Spectral brightness** | Energy ratio, 1–4 kHz ÷ total | **none** | `src/core/sensors/audio.ts` |
| **Roughness** | **Goertzel bank on the amplitude envelope** (modulation energy) | **none** | `src/core/sensors/audio.ts` |
| **Scream score** | Weighted sum + amplitude/pitch gate + 300 ms sustain gate | **none** — hand-weighted | `src/core/sensors/audio.ts` |
| **Charging state** | Battery Status API | **none** | `src/engine/useSafetyEngine.ts` |
| **Rest / sleep stand-down** | Stillness duration + charging, disabled when busy | **none** | `src/engine/useSafetyEngine.ts` |
| **Separation / abandonment** | Stillness > 45 s **during an active journey** → `overdue` climbs | **none** | `src/engine/useSafetyEngine.ts` |

## 1.3 Decision engine

| Feature | Technology used | AI model | File |
|---|---|---|---|
| **Anomaly detection** | Dense **autoencoder 9-5-3-5-9**, tanh, MSE, Adam | ✅ **THE ONE MODEL** | `tools/train_autoencoder.py` → `src/core/ml/autoencoder.ts` |
| **Model training** | **NumPy**, hand-written backprop, 24,000 samples, 260 epochs, ~5 s | ✅ same | `tools/train_autoencoder.py` |
| **Model inference** | Plain TypeScript matrix multiply, ~200 lines, no runtime | ✅ same | `src/core/ml/autoencoder.ts` |
| **Feature fusion** | Weighted evidence → **saturating** `1−e^(−1.35E)` | **none** — hand-weighted | `src/core/ml/fusion.ts` |
| **Context multiplier** | Linear combination of street risk, night, isolation, capped 1.15 | **none** | `src/core/ml/fusion.ts` |
| **Final score** | `0.72 × rule + 0.28 × (anomaly × context)` | partial | `src/engine/useSafetyEngine.ts` |
| **State machine** | 5 states, thresholds 0.38 / 0.62 / 0.80 | **none** | `src/engine/useSafetyEngine.ts` |
| **Escalation ladder** | Data table + elapsed-time comparison | **none** | `src/engine/escalation.ts` |
| **Explanation ("why it fired")** | Rule-based decomposition of the feature vector | **none** | `src/core/ml/fusion.ts` → `explain()` |

## 1.4 Identity, security, delivery

| Feature | Technology used | AI model | File |
|---|---|---|---|
| **OTP login** | 6-digit code, 5-min expiry, 60 s resend, `localStorage` | none | `src/features/auth/session.ts` |
| **Device identity** | **Web Crypto** — ECDSA P-256 + ECDH P-256 keypair | none | `src/core/crypto/identity.ts` |
| **Contact pairing** | `qrcode` library, public key in the QR payload | none | `src/features/devtools/Vault.tsx` |
| **Alert encryption** | ECDH → **HKDF-SHA256** → **AES-256-GCM** | none | `src/core/crypto/identity.ts` |
| **Alert signing** | ECDSA P-256 over the ciphertext | none | `src/core/crypto/identity.ts` |
| **Unlinkability** | Random 8-byte recipient tag per alert | none | `src/core/crypto/identity.ts` |
| **Biometric unlock** | **WebAuthn** platform authenticator | none | `src/features/auth/session.ts` |
| **Duress PIN** | Second PIN → normal UI + silent alert | none | `src/features/auth/AuthFlow.tsx` |
| **Lock screen** | PIN keypad, liveness confirmation | none | `src/features/auth/AuthFlow.tsx` |
| **SMS fallback** | Base64 payload → `sms:` URI intent | none | `src/core/crypto/identity.ts` |
| **Relay (optional)** | **FastAPI**, <60 lines, rate limit, forward, forget | none | `deploy/relay/relay.py` |

## 1.5 Platform and app

| Feature | Technology used | File |
|---|---|---|
| **UI framework** | **React 19 + TypeScript 6** | all `.tsx` |
| **Build** | **Vite 8**, `@` path alias | `vite.config.ts` |
| **Styling** | Hand-written CSS, locked palette, CSS variables | `src/styles/index.css` |
| **Routing** | Hand-rolled **hash router**, ~30 lines | `src/app/useRouter.ts`, `routes.ts` |
| **API abstraction** | Interface + local adapter + HTTP adapter, switched by env var | `src/services/api/` |
| **Offline** | **Service Worker**, cache-first | `public/sw.js` |
| **Installable** | **PWA manifest** + icons | `public/manifest.webmanifest` |
| **Screen wake lock** | Screen Wake Lock API | `src/features/devtools/SensorLab.tsx` |
| **Network status** | `navigator.onLine` + online/offline events | `src/features/citizen/LiveScreen.tsx` |
| **Deployment** | **Docker + nginx**, Netlify, Vercel, GitHub Actions | `deploy/`, `netlify.toml` |

---

# 2. Technology stack, by layer

| Layer | Technology | Why this one |
|---|---|---|
| **Data source** | OpenStreetMap + Overpass API | free, open, and it exposes `lit` / `sidewalk` / road class — Google Maps does not |
| **Data pipeline** | Python 3, `json`, `math` | runs once offline, output committed |
| **ML training** | NumPy (hand-written Adam + backprop) | no TensorFlow, no CUDA, trains in 5 seconds |
| **ML inference** | Plain TypeScript | no ONNX runtime, no WASM blob, ~200 lines |
| **Signal processing** | Goertzel, Welford, monotonic deque — all hand-written | ~19× cheaper than FFT for 16 bins |
| **Sensors** | DeviceMotion, Geolocation, Web Audio, Battery Status | all browser-native, zero dependencies |
| **Crypto** | Web Crypto API | standard primitives, nothing hand-rolled, nothing to trust |
| **Frontend** | React 19, TypeScript 6, Vite 8 | standard, fast, one static artefact |
| **Map rendering** | Hand-written SVG | no tile server → **cannot break on expo wifi** |
| **Routing algorithm** | Dijkstra + Pareto sweep | classical, exact, runs client-side |
| **Offline** | Service Worker + bundled 477 KB graph | full function with no network |
| **Backend (optional)** | FastAPI | the relay is deliberately trivial |
| **Container** | Docker + nginx | reproducible, self-hostable |
| **CI/CD** | GitHub Actions → Pages | typecheck, build, deploy |

**Runtime dependencies: 3.** `react`, `react-dom`, `qrcode`. That is the whole list.

---

# 3. The AI/ML inventory — the honest version

| # | Model | Type | Training data | Where it runs | Status |
|---|---|---|---|---|---|
| 1 | **Autoencoder 9-5-3-5-9** | dense neural net, tanh, MSE | 24,000 samples of **normal behaviour only** — walking, vehicle, jostle, stationary | on-device, TypeScript | ✅ **trained and shipped** |

**That is the complete list.** One model.

### Measured results (reproducible with `npm run data:model`)

| Input | Reconstruction error | Anomaly score |
|---|---|---|
| Calm walk | 0.00005 | **0.01** |
| Bus ride | 0.00006 | **0.01** |
| Struggle in a bag | 0.00979 | **1.00** |
| Pulled into a vehicle | 0.16830 | **1.00** |
| Never arrived home | 0.13594 | **1.00** |
| Phone forced off | 0.22339 | **1.00** |

Calibration: p50 = 0.00040, p95 = 0.00281, **p99 = 0.00485**.

### Models on the roadmap — labelled as roadmap inside the app

| Model | Task | Training data | Why not now |
|---|---|---|---|
| YAMNet-style CNN, ~2 MB TFLite | scream classification from 64-band log-mel | AudioSet `Screaming` + hard negatives | needs training infra; DSP already works |
| 1D-CNN / LSTM | activity + struggle from raw IMU | UCI-HAR, MotionSense, WISDM | no real distress data exists |
| CNN semantic segmentation | lighting/footpath/frontage from street imagery | Mapillary + Cityscapes | weeks of labelling |
| **GNN** (PyTorch Geometric) | risk propagation over the street graph | OSM topology + PU-labelled incidents | needs incident data |
| PU-learning + IPW | correct survivorship bias | NCRB + exposure estimates | needs the above |

---

# 4. Why so little ML — the defence

**Say this if a judge asks "where's the AI?"**

| Detector | Why no neural network |
|---|---|
| **Fall** | The physics is known. Free fall → impact → stillness. I don't need a network to learn gravity, and a state machine tells me exactly why it fired. |
| **Struggle** | No training data exists. There is no dataset of real assaults on an accelerometer. Spectral entropy already separates walking (0.07) from struggle (0.86) cleanly. |
| **Scream** | The acoustics are well understood — F0, brightness, roughness. A CNN would need labelled screams with hard negatives, which is the roadmap, not a 36-hour build. |
| **Fusion** | Weights must be auditable. A judge — and a court — can ask why an alert fired. A learned black box cannot answer that. |
| **Anomaly** | ✅ **Here ML genuinely wins**, because "what is normal for *this person*" cannot be hand-coded. |

**Cost comparison:**

| Approach | Operations/second |
|---|---|
| Our DSP stack | **~3,900** |
| Naive windowed implementation | ~460,000 |
| CNN on raw accelerometer | millions |

> "We used the cheapest tool that solves each problem. Signal processing where the
> physics is known. One small neural network where personalisation actually matters.
> Nothing in a cloud, no API key, and the whole model trains in five seconds."

---

# 5. What we deliberately did NOT use

| Rejected | Why |
|---|---|
| **OpenAI / Gemini / any hosted LLM** | privacy, cost, latency, and it must work offline |
| **TensorFlow / PyTorch in the app** | megabytes of runtime for a 300-parameter model |
| **Google Maps / Mapbox** | API key, cost, network dependency — and they won't tell you if a street is lit |
| **Leaflet** | needs tiles, tiles need network |
| **Firebase / any BaaS** | it would mean a user database, the exact thing we claim not to have |
| **Blockchain** | solves no problem here |
| **Tailwind / MUI / any UI kit** | bundle size, and generic-looking output |
| **Cloud inference** | battery, cost, privacy, breaks offline |

> **"There is no OpenAI API key in this project."**

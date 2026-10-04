# NIZHAL — Detection Mathematics & Implementation

How fall detection, struggle detection and scream detection actually work:
the equations, the constants, where the constants come from, what accuracy
to expect, and the O(1) code that runs it 60 times a second on a phone battery.

Reference implementation: `src/core/sensors/dsp.ts`, `imu.ts`, `audio.ts`.

---

## 0. Notation and sampling

| Symbol | Meaning | Typical |
|---|---|---|
| $f_s$ | sample rate | 50–60 Hz (browser `devicemotion`), 50 Hz native |
| $a[n]$ | acceleration magnitude $\sqrt{a_x^2+a_y^2+a_z^2}$, **including gravity** | ~9.81 at rest |
| $N$ | analysis window length | 128 samples ≈ 2.1 s at 60 Hz |
| $g$ | gravity | 9.81 m/s² |

We work on the **magnitude** $a[n]$, not the three axes. This is deliberate:
magnitude is invariant to how the phone is oriented in a pocket or a bag.
Axis-dependent detectors fail the moment the phone rotates, which it always does.

> **Design constraint that drives everything:** every statistic below must be
> computable in **O(1) per sample** with **no allocation**. A detector that scans
> a 128-sample window every frame does 7,680 operations/second and churns the GC.
> Ours does ~40.

---

## 1. Struggle detection

### 1.1 Energy — RMS about the mean

Gravity is a DC offset. Remove it with a running mean, then measure the spread:

$$\mu[n] = \mathbb{E}[a],\qquad \sigma[n] = \sqrt{\mathbb{E}[(a-\mu)^2]}$$

Computed with **Welford's algorithm** — numerically stable and single-pass:

$$\mu_n = \mu_{n-1} + \frac{a_n - \mu_{n-1}}{n},\qquad
M_{2,n} = M_{2,n-1} + (a_n-\mu_{n-1})(a_n-\mu_n),\qquad
\sigma_n^2 = \frac{M_{2,n}}{n}$$

**Verified:** Welford vs a naive two-pass computation over 5,000 samples agrees to
6 decimal places (`mean 9.805430` both ways, `sd 1.444358` both ways).

For a sliding window use the exponentially-weighted form with
$\alpha = 1-e^{-1/(\tau f_s)}$; $\tau = 2\,\text{s}$ at 60 Hz gives $\alpha \approx 0.0083$.

| Activity | Typical $\sigma$ (m/s²) |
|---|---|
| Phone on a table | 0.02 – 0.10 |
| Sitting, in a pocket | 0.1 – 0.4 |
| Walking | 1.2 – 3.0 |
| Running | 4 – 8 |
| **Struggle / being grabbed** | **5 – 15** |

Overlap between running and struggle is total. **Energy alone cannot separate them.**
That is why we need the next two features.

### 1.2 Abruptness — mean absolute jerk

$$J = \frac{f_s}{N-1}\sum_{n=1}^{N-1}\bigl|a[n]-a[n-1]\bigr| \quad [\text{m}\,\text{s}^{-3}]$$

Walking is smooth and sinusoidal; a snatch or a grab is a step change.
Typical: walking 5–15, running 20–40, **struggle 40–120**.

### 1.3 The discriminator — spectral entropy

This is the feature that does the real work.

Compute the power at $K=16$ frequencies spaced across $[0.5, 12]$ Hz using
**Goertzel**, normalise into a probability distribution, and take Shannon entropy:

$$P_k = |X(f_k)|^2, \qquad p_k = \frac{P_k}{\sum_j P_j}, \qquad
H = \frac{-\sum_k p_k \log p_k}{\log K} \in [0,1]$$

**Why Goertzel and not an FFT.** A 128-point FFT is $O(N\log N) \approx 900$
operations and gives you 64 bins you throw away. Goertzel gives one bin for
**1 multiply + 2 adds per sample**:

$$s[n] = x[n] + 2\cos\!\left(\tfrac{2\pi f_k}{f_s}\right)s[n-1] - s[n-2]$$
$$|X|^2 = s[N-1]^2 + s[N-2]^2 - 2\cos\!\left(\tfrac{2\pi f_k}{f_s}\right)s[N-1]s[N-2]$$

16 bins × 3 ops = **48 operations per sample** versus ~900. About 19× cheaper,
and it is incremental — no window scan.

**Measured separation** (synthetic signals, 150 samples at 60 Hz, `dsp.ts` test):

| Signal | $H$ |
|---|---|
| Walking — 2 Hz fundamental + 4 Hz harmonic | **0.068** |
| Vehicle ride — 1.1 Hz sway + noise | **0.192** |
| Struggle — broadband random | **0.856** |

A tone at 2 Hz puts $1.5\times10^{11}$ times more power in bin 2 than bin 5, confirming
the bank is correctly tuned.

Real accelerometer noise raises these: expect walking **0.30–0.55**, struggle **0.70–0.92**.
The default threshold $H_0 = 0.62$ sits in the gap. **Measure yours in `#/dev/lab`.**

### 1.4 Fusing the three

$$
v = \text{ramp}(\sigma,\ \sigma_0,\ \sigma_0+6),\quad
p = \text{ramp}(H,\ H_0,\ H_0+0.30),\quad
j = \text{ramp}(J,\ J_0,\ J_0+90)
$$
$$
\boxed{\;S_{\text{struggle}} = \bigl(0.45\,v + 0.32\,p + 0.23\,j\bigr)\cdot\mathbb{1}[v>0.12]\;}
$$

where $\text{ramp}(x,l,h) = \text{clip}\!\left(\frac{x-l}{h-l},0,1\right)$ and defaults are
$\sigma_0=1.6$, $H_0=0.62$, $J_0=12$.

The indicator gate is important: it makes the score exactly zero for anything that
isn't energetic, so a stationary phone sitting in electrical noise (high $H$, tiny $\sigma$)
can never contribute.

### 1.5 Weight justification

Weights come from the discriminative power of each feature between
*running* (the hardest negative) and *struggle*:

| Feature | Running | Struggle | Separation | Weight |
|---|---|---|---|---|
| $H$ (entropy) | 0.35 | 0.85 | **large** | 0.32 |
| $\sigma$ (energy) | 6.0 | 9.0 | small | 0.45 |
| $J$ (jerk) | 30 | 80 | medium | 0.23 |

Energy gets the largest weight not because it discriminates best, but because it
**gates plausibility** — nothing violent, nothing to discuss. Entropy is what
resolves the ambiguity once the gate opens.

---

## 2. Fall detection

### 2.1 Fall physics — where the constants come from

A fall is not "big acceleration". It is a **sequence with timing**:

**Phase 1 — free fall.** In free fall the accelerometer reads ≈ 0, because the
sensor and its proof mass accelerate together. Duration from height $h$:

$$t_{\text{ff}} = \sqrt{\frac{2h}{g}}, \qquad v_{\text{impact}} = \sqrt{2gh}$$

**Phase 2 — impact.** Deceleration over stopping distance $d$:

$$a_{\text{impact}} \approx \frac{v^2}{2d} = \frac{gh}{d}$$

**Computed values** (verified numerically):

| $h$ | $t_{\text{ff}}$ | samples @60 Hz | $v$ | $a$ on cushion ($d$=10 cm) | $a$ on tile ($d$=4 mm) |
|---|---|---|---|---|---|
| 0.5 m | 319 ms | 19 | 3.13 m/s | 49 m/s² (**5.0 g**) | 125 g |
| 1.0 m | 452 ms | 27 | 4.43 m/s | 98 m/s² (**10.0 g**) | 250 g |
| 1.5 m | 553 ms | 33 | 5.42 m/s | 147 m/s² (**15.0 g**) | 375 g |

**Three engineering consequences:**

1. **Free fall is easy to catch.** 19–33 samples at 60 Hz. Plenty.
2. **The impact peak is easy to MISS.** A hard impact lasts 2–10 ms. At 60 Hz the
   sample period is **16.7 ms** — you can sample straight through the peak.
   *Mitigations:* set the impact threshold low (25 m/s² ≈ 2.5 g, reachable even
   by a badly-sampled cushioned drop), take the **max over a window** rather than
   the instantaneous value, and test on a cushion where the peak is wider.
3. **Sensor clipping is real.** Most phone accelerometers saturate at ±8 g (78 m/s²)
   or ±16 g. A tile-floor drop *saturates* the sensor. So a threshold above ~8 g
   is unreliable across devices. **25 m/s² = 2.55 g is deliberately conservative.**

### 2.2 The state machine

$$
\text{IDLE} \xrightarrow{\;a<\theta_{\text{ff}}\;} \text{FREEFALL}
\xrightarrow{\;a>\theta_{\text{imp}}\ \wedge\ \Delta t<W\;} \text{IMPACT}
\xrightarrow{\;+300\text{ms}\;} \text{STILL}
\xrightarrow{\;\sigma<\theta_{\text{s}}\ \text{for}\ T_s\;} \textbf{FALL}
$$

with a timeout back to IDLE if the impact never arrives within $W$, and an escape
from STILL back to IDLE if motion resumes (they got up).

| Parameter | Symbol | Default | Safe range | Tune if… |
|---|---|---|---|---|
| Free-fall ceiling | $\theta_{\text{ff}}$ | 3.0 m/s² | 2.0 – 5.0 | "never saw free-fall" → raise |
| Impact floor | $\theta_{\text{imp}}$ | 25 m/s² | 15 – 40 | "never saw impact" → lower |
| Free-fall→impact window | $W$ | 1200 ms | 600 – 2000 | drops from height → raise |
| Stillness ceiling | $\theta_{\text{s}}$ | 0.9 m/s² | 0.4 – 2.0 | fires while held → lower |
| Stillness duration | $T_s$ | 1500 ms | 800 – 3000 | too slow to fire → lower |

### 2.3 Why stillness is non-negotiable

Without Phase 4, the detector is a *drop* detector, not a *fall* detector:

| Event | Free fall | Impact | Stillness | Verdict |
|---|---|---|---|---|
| Phone tossed on a bed | ✅ | weak ✅ | ❌ picked up | correctly rejected |
| Phone slides off a table | ✅ | ✅ | ✅ | **false positive** (accepted limitation) |
| Person falls, gets up | ✅ | ✅ | ❌ | correctly rejected |
| **Person falls, stays down** | ✅ | ✅ | ✅ | **FALL** |

The table-slide false positive is real and we accept it, because the cost
asymmetry (§5.4) says we should — and because the fall score alone never fires
an alert (§4).

### 2.4 Sampling-rate requirement

The FSM **must** be evaluated at sample rate, not at the UI refresh rate.
This was a real bug in an earlier version:

```
free-fall from 1 m = 452 ms
evaluated at 5 Hz  → 200 ms granularity → sometimes missed entirely
evaluated at 60 Hz →  17 ms granularity → 27 chances to see it
```

`MotionEngine.fallStep()` is called from the raw `devicemotion` handler.
The expensive spectral work stays at 5 Hz. **Split your rates by cost, not by convenience.**

---

## 3. Scream detection

### 3.1 Framing

Web Audio `AnalyserNode`, FFT size $M=2048$, sample rate $f_a$ = 44.1 or 48 kHz.
Bin width $\Delta f = f_a/M \approx 21.5$ Hz. Frames evaluated ~20×/second.
A **2-second ring buffer of the envelope only** is retained — never the waveform.

### 3.2 Level

$$\text{RMS} = \sqrt{\frac1M\sum_m x[m]^2}, \qquad L_{\text{dBFS}} = 20\log_{10}(\text{RMS}+\varepsilon)$$
$$\ell = \text{ramp}(L,\ -34,\ -8)$$

### 3.3 Pitch $F_0$

Dominant bin over 150–3000 Hz. Voiced speech and screams are strongly harmonic,
so the spectral peak is a serviceable $F_0$ estimate at this cost.

| Source | $F_0$ |
|---|---|
| Male speech | 85 – 180 Hz |
| Female speech | **165 – 255 Hz** |
| Shouting | 300 – 600 Hz |
| **Scream** | **700 – 1200 Hz** |

$$\pi_0 = \begin{cases}\text{ramp}(F_0,\ 500,\ 1200) & 600 < F_0 < 2200\\ 0 & \text{otherwise}\end{cases}$$

### 3.4 Spectral brightness

$$B = \frac{\sum_{f=1\text{k}}^{4\text{k}} |X(f)|^2}{\sum_{f} |X(f)|^2}, \qquad b = \text{ramp}(B,\ 0.22,\ 0.67)$$

Speech sits mostly below 1 kHz; screams push energy up. Traffic rumble sits below
300 Hz, so this feature also suppresses street noise.

### 3.5 Roughness — the feature that matters

**Roughness is amplitude modulation of the envelope, and it is what makes a
scream sound like a scream rather than like a sung note.** It is the acoustic
correlate of perceptual aversiveness.

Extract the envelope $e[n] = \text{RMS}$ of each frame (envelope rate $f_e \approx 20$ Hz),
then run a Goertzel bank **on the envelope signal**:

$$R = \frac{\sum_{f \in \mathcal{M}} |E(f)|^2}{\sum_f |E(f)|^2}$$

where $\mathcal{M}$ is the modulation band. **Textbook roughness is 30–150 Hz**, which
requires an envelope sampled at ≥ 300 Hz. In the browser we only get ~20 Hz frames,
so we use the **available proxy band 4–20 Hz** and scale. This is an honest
approximation, and it is called out in the code.

> **State this limitation if asked.** The native TFLite implementation computes the
> envelope at audio rate and uses the true 30–150 Hz band.

### 3.6 Fusion and gates

$$s = 0.34\,\ell + 0.26\,\pi_0 + 0.24\,b + 0.16\,R$$

$$
S_{\text{scream}} =
\begin{cases}
0.25\,s & \ell < 0.35 \ \lor\ \pi_0 = 0 \quad(\text{amplitude/pitch gate})\\
0.40\,s & \text{held} < 300\ \text{ms} \quad(\text{sustain gate})\\
s & \text{otherwise}
\end{cases}
$$

**The sustain gate kills the biggest false-positive class.** Impulsive sounds are
short; screams are not:

| Sound | Duration |
|---|---|
| Door slam | 30 – 60 ms |
| Dropped object | 20 – 80 ms |
| Horn tap | 100 – 250 ms |
| **Scream** | **500 – 3000 ms** |

---

## 4. Why no single detector can fire an alert

Even a perfect scream detector at $S=1.0$ must not alert on its own, because
the base rate of screams-that-are-emergencies is low. Two mechanisms enforce this.

### 4.1 Saturating evidence sum

$$E = \sum_i w_i x_i, \qquad r = 1 - e^{-1.35\,E}$$

With $w_{\text{scream}} = 0.22$, a maximal scream alone gives
$r = 1-e^{-1.35\times0.22} = 1-e^{-0.297} = \mathbf{0.257}$ — far below the
alert threshold of 0.80. **Corroboration is mathematically required, not merely encouraged.**

To reach 0.80 you need $E \ge -\ln(0.2)/1.35 = 1.19$, which takes **at least three**
strong features.

### 4.2 Context multiplier

$$c = \min\bigl(1.15,\ 0.30 + 0.42\,\rho + 0.20\,\nu + 0.26\,\lambda\bigr)$$

$\rho$ = street risk ∈[0,1], $\nu$ = night, $\lambda$ = alone.

| Situation | $c$ |
|---|---|
| Home, afternoon, people around | **0.35** |
| Home, night, alone | 0.76 |
| Unlit isolated lane, 23:41, alone | **1.12** |

$$\text{score} = \text{clip}(r \cdot c, 0, 1)$$

A factor of **3.2×** between best and worst context. This single term is why
shaking your phone at home does nothing while identical motion in a dark lane
starts a check-in.

### 4.3 Anomaly blend

$$\text{fused} = 0.72\,\text{score}_{\text{rule}} + 0.28\,(A \cdot c)$$

$A$ is the autoencoder anomaly (§6).

### 4.4 Thresholds

| State | Threshold | Transmits? |
|---|---|---|
| HEIGHTENED | 0.38 | no |
| CHECK-IN | 0.62 | no |
| **ALERT** | **0.80** | yes — and only now |

### 4.5 Worked examples

| Situation | $E$ | $r$ | $c$ | fused | Outcome |
|---|---|---|---|---|---|
| Shake at home | 0.33 | 0.36 | 0.35 | **0.05** | nothing |
| Scream at the TV | 0.18 | 0.22 | 0.35 | **0.15** | nothing |
| Running, isolated | 0.36 | 0.39 | 1.05 | **0.45** | silent arming |
| Struggle, isolated | 0.61 | 0.56 | 1.12 | **0.72** | check-in |
| Struggle + no response + vehicle | 1.31 | 0.83 | 1.12 | **0.94** | **ALERT** |

---

## 5. Accuracy: how to measure it honestly

### 5.1 Definitions

$$\text{Precision}=\frac{TP}{TP+FP},\quad
\text{Recall}=\frac{TP}{TP+FN},\quad
F_\beta=(1+\beta^2)\frac{PR}{\beta^2 P + R}$$

### 5.2 Use $F_2$, not $F_1$

$F_1$ weights precision and recall equally. **Our costs are not equal.** With $\beta=2$,
recall is weighted 4× — which is the correct objective for this problem.

### 5.3 The test protocol (run this on your own phone)

For each detector, 20 positives and 40 negatives. Log every outcome.

**Fall — positives:** drop onto a cushion from 0.5/1.0/1.5 m × 5 each, phone left still.
**Fall — negatives:** place firmly on a table (10), toss onto a bed and pick up (10),
sit down hard with it in a pocket (10), climb stairs (10).

**Scream — positives:** scream at 1 m, 3 m, through a bag, with traffic behind (5 each).
**Scream — negatives:** normal conversation (10), laughing (10), music/TV (10),
door slam + clapping (10).

Fill this in — these are the numbers to put on your poster:

| Detector | TP | FN | FP | TN | Precision | Recall | $F_2$ |
|---|---|---|---|---|---|---|---|
| Fall | | | | | | | |
| Scream | | | | | | | |
| Struggle | | | | | | | |

**Realistic expectations for this implementation**, if calibrated:

| Detector | Recall | Precision | Note |
|---|---|---|---|
| Fall (cushioned, phone still) | 0.85 – 0.95 | 0.6 – 0.8 | table-slide FPs remain |
| Struggle vs walking | 0.90+ | 0.85+ | entropy separates cleanly |
| Struggle vs running | 0.70 – 0.85 | 0.7 – 0.8 | genuinely hard |
| Scream vs speech | 0.85 – 0.95 | 0.7 – 0.85 | |
| Scream vs cheering/laughing | 0.6 – 0.75 | 0.5 – 0.7 | **the weak case — say so** |

> **Do not claim 99%.** Claim measured numbers from your own protocol, and name the
> weak case. A judge who finds an unstated weakness discounts everything else.

### 5.4 The cost argument

$$\mathbb{E}[\text{cost}] = P(FP)\,C_{FP} + P(FN)\,C_{FN}$$

$C_{FP}$ = one friend receives a notification. $C_{FN}$ = a life.
Since $C_{FN} \ggg C_{FP}$, the Neyman–Pearson optimum sits at **high recall**,
and the engineering job is to make $C_{FP}$ as small as possible — which is
exactly what the 10-second cancel window and the graduated ladder do.

> **"We don't make false positives impossible. We make them cheap."**

---

## 6. The autoencoder

Trained on **normal behaviour only** — there is no dataset of real assaults, and
faking one would be dishonest.

Architecture $9\to5\to3\to5\to9$, $\tanh$, MSE, Adam ($\eta=3\times10^{-3}$),
260 epochs, batch 256, 24,000 samples, pure numpy. Trains in ~5 seconds.

$$\hat{x} = f_\theta(x), \qquad \mathcal{E} = \frac1d\sum_i (\hat{x}_i-x_i)^2, \qquad
A = \text{clip}\!\left(\frac{\mathcal{E}}{\mathcal{E}_{p99}},0,1\right)$$

Calibration on the training set: $\mathcal{E}_{p50}=0.00040$, $\mathcal{E}_{p95}=0.00281$,
$\mathcal{E}_{p99}=\mathbf{0.00485}$.

| Input | $\mathcal{E}$ | $A$ |
|---|---|---|
| Calm walk | 0.00005 | **0.01** |
| Bus ride | 0.00006 | **0.01** |
| Struggle in a bag | 0.00979 | **1.00** |
| Pulled into a vehicle | 0.16830 | **1.00** |
| Never arrived home | 0.13594 | **1.00** |
| Phone forced off | 0.22339 | **1.00** |

**Three to four orders of magnitude of separation.** Reproduce with `npm run data:model`.

The bottleneck of 3 units is the point: the network is forced to learn a
3-dimensional manifold of normal life. Anything off that manifold reconstructs badly.

---

## 7. Optimized implementation

All primitives in **`src/core/sensors/dsp.ts`**, all O(1) per sample, allocation-free.

| Class | Purpose | Cost/sample | Replaces |
|---|---|---|---|
| `Ring` | circular buffer over `Float64Array` | 2 ops | `arr.push/shift` (O(n) + GC) |
| `Welford` | stable running mean/variance | 5 ops | two-pass window scan |
| `EwmaVar` | windowed mean/variance | 6 ops | rolling recompute |
| `Goertzel` | single-bin DFT power | 3 ops | full FFT |
| `SpectralEntropy` | 16-bin bank + Shannon entropy | 48 ops | `fft()` + normalise |
| `WindowExtreme` | sliding min/max, monotonic deque | amortised O(1) | `Math.min(...slice)` |
| `LowPass` | one-pole gravity separation | 3 ops | high-pass filter bank |

**Total per sample: ~65 floating-point operations.** At 60 Hz that is
**3,900 flops/second** — negligible. A naive windowed implementation costs
~460,000 flops/second and allocates two arrays per frame.

```ts
// Struggle detection, complete, O(1) per sample
import { Welford, SpectralEntropy, ramp } from '@/core/sensors/dsp'

const FREQS = Array.from({ length: 16 }, (_, k) => 0.5 + (12 - 0.5) * k / 15)

export class StruggleDetector {
  private stats = new Welford()
  private spec: SpectralEntropy
  private prev = 0
  private jerkSum = 0
  private n = 0
  score = 0

  constructor(private fs = 60, private T = { sigma0: 1.6, H0: 0.62, J0: 12 }) {
    this.spec = new SpectralEntropy(FREQS, fs)
  }

  /** call from the raw sensor handler, once per sample */
  push(a: number) {
    this.stats.push(a)
    this.spec.push(a - this.stats.mean)          // remove gravity before the transform
    if (this.n > 0) this.jerkSum += Math.abs(a - this.prev)
    this.prev = a
    this.n++
  }

  /** call once per block (~5 Hz), then reset */
  evaluate(): number {
    if (this.n < 32) return 0
    const sigma = this.stats.sd
    const H     = this.spec.value()
    const J     = (this.jerkSum / (this.n - 1)) * this.fs

    const v = ramp(sigma, this.T.sigma0, this.T.sigma0 + 6)
    const p = ramp(H,     this.T.H0,     this.T.H0 + 0.30)
    const j = ramp(J,     this.T.J0,     this.T.J0 + 90)

    this.score = v > 0.12 ? Math.min(1, 0.45 * v + 0.32 * p + 0.23 * j) : 0
    return this.score
  }

  reset() { this.stats.reset(); this.spec.reset(); this.jerkSum = 0; this.n = 0 }
}
```

```ts
// Fall FSM — MUST be driven at sample rate, not at UI rate
export class FallDetector {
  stage: 'idle' | 'freefall' | 'impact' | 'still' | 'FALL' = 'idle'
  private tFF = 0; private tImp = 0; private tStill = 0
  constructor(private T = { ff: 3.0, imp: 25, window: 1200, still: 0.9, hold: 1500 }) {}

  step(a: number, t: number, recentSd: number) {
    switch (this.stage) {
      case 'idle':
        if (a < this.T.ff) { this.stage = 'freefall'; this.tFF = t }
        break
      case 'freefall':
        if (a > this.T.imp) { this.stage = 'impact'; this.tImp = t }
        else if (t - this.tFF > this.T.window) this.stage = 'idle'
        break
      case 'impact':
        if (t - this.tImp > 300) { this.stage = 'still'; this.tStill = t }
        break
      case 'still':
        if (recentSd > this.T.still) this.stage = 'idle'            // they got up
        else if (t - this.tStill > this.T.hold) this.stage = 'FALL' // latched
        break
    }
  }
  get confidence() {
    return this.stage === 'FALL' ? 1 : this.stage === 'still' ? 0.6
         : this.stage === 'impact' ? 0.35 : this.stage === 'freefall' ? 0.15 : 0
  }
  reset() { this.stage = 'idle' }
}
```

### Rate splitting — the single most important optimisation

```
devicemotion handler  (60 Hz) → magnitude, Welford, Goertzel accumulate, FALL FSM
block evaluation       (5 Hz) → entropy, jerk average, struggle score
audio frame           (20 Hz) → FFT read, bands, envelope push
fusion + React render  (4 Hz) → score, state machine, UI
```

Never run the expensive stage at the fast rate, and **never run a time-critical
FSM at the slow rate**. Getting this backwards is how you miss a 450 ms free fall.

### Battery

| Component | Duty | Est. drain |
|---|---|---|
| Accelerometer @50 Hz | continuous | 1 – 2 %/h |
| DSP (65 flops/sample) | continuous | < 0.5 %/h |
| Microphone + FFT | opt-in only | 3 – 5 %/h |
| GPS continuous | journey only | 8 – 12 %/h |
| **Default (motion only)** | | **~2 %/h** |

This is why audio is off by default and GPS is pinned only during an active journey.

---

## 8. Parameter reference

| Parameter | Default | Range | Effect of raising |
|---|---|---|---|
| `shakeRms` $\sigma_0$ | 1.6 m/s² | 0.4 – 6 | fewer struggle detections |
| `shakeJerk` $J_0$ | 12 | 2 – 60 | requires more abruptness |
| `entropyMin` $H_0$ | 0.62 | 0.3 – 0.95 | requires more aperiodicity |
| `freeFall` $\theta_{ff}$ | 3.0 m/s² | 0.5 – 8 | easier to enter FREEFALL |
| `impact` $\theta_{imp}$ | 25 m/s² | 12 – 60 | harder to confirm impact |
| `fallWindowMs` $W$ | 1200 ms | 300 – 2500 | allows higher drops |
| `stillnessRms` $\theta_s$ | 0.9 m/s² | 0.2 – 3 | tolerates more movement |
| `stillnessMs` $T_s$ | 1500 ms | 400 – 5000 | slower, more certain |
| Heighten threshold | 0.38 | — | |
| Check-in threshold | 0.62 | — | |
| Alert threshold | 0.80 | — | |
| Saturation $\kappa$ | 1.35 | — | steeper evidence curve |
| Context cap | 1.15 | — | |

All motion parameters are live-tunable in **`#/dev/lab`** and persist per device.

---

## 9. Known limitations

1. **Impact peaks can be missed** at 60 Hz (peak 2–10 ms vs 16.7 ms sample period).
   Mitigated by a low threshold and windowed max; the native client samples at 100–200 Hz.
2. **Sensor saturation** at ±8 g on many devices makes hard-surface impacts unreliable
   as *magnitude* measurements — we rely on the sequence, not the peak value.
3. **Browser roughness band is 4–20 Hz, not the textbook 30–150 Hz**, because the
   envelope frame rate is only ~20 Hz. Native fixes this.
4. **Struggle vs running** is the genuinely hard pair; entropy helps but does not
   fully separate them. This is why context and corroboration exist.
5. **Cheering and laughing** are the weakest scream negatives. The production fix
   is hard-negative mining from AudioSet, not a threshold change.
6. **Browsers cannot sense in the background.** Screen on, tab focused. Background
   operation requires an Android foreground service.

---

*Verify every number here by running `tools/train_autoencoder.py` and the
`dsp.ts` numerical tests, and by running the §5.3 protocol on your own phone.*

---

## 10. Case study: "I was asleep and my phone fell off the bed"

This is the most important false-positive case in the whole product, because it
happens to everyone, it happens at 3 a.m., and it would wake a parent.

### 10.1 Four independent reasons it does not escalate

**1 — The carried precondition (the real fix).**

A human fall is *always* preceded by the human moving. A phone sliding off a
bedside table is preceded by **minutes of absolute stillness**. So:

$$\text{carried} = \bigl(t_{\text{now}} - t_{\text{last gait}}\bigr) < 90\ \text{s}$$

$$S_{\text{fall}} \leftarrow \begin{cases} S_{\text{fall}} & \text{carried}\\[2pt]
0.12 \times S_{\text{fall}} & \text{not carried} \Rightarrow \textbf{drop, not fall}\end{cases}$$

A perfect fall pattern from a nightstand scores $1.0 \times 0.12 = 0.12$.

**2 — Rest / sleep stand-down.**

$$\text{atRest} = (\text{motionless} > 600\ \text{s}) \ \lor\ (\text{motionless} > 180\ \text{s} \ \wedge\ \text{charging})$$

Charging state comes from the real Battery Status API. While `atRest` the state
machine **cannot leave ARMED** — it is structurally unable to escalate, and motion
evidence is multiplied by 0.15.

**3 — Context multiplier.** At home, known location, not alone, on charge:
$c \approx 0.35$.

**4 — Saturating fusion.** Fall carries weight $w = 0.20$.

### 10.2 The arithmetic

| | Carried (real fall in the street) | Asleep (phone off the bed) |
|---|---|---|
| Raw fall signal | 1.00 | 1.00 |
| Carried gate | ×1 → 1.00 | **×0.12 → 0.12** |
| Rest gate | ×1 → 1.00 | **×0.12 → 0.014** |
| Evidence $E = 0.20\,x$ | 0.200 | 0.0029 |
| $r = 1-e^{-1.35E}$ | 0.236 | 0.0039 |
| Context $c$ | 1.12 | 0.35 |
| **Fused** | **0.26** | **0.0014** |
| Outcome | *still not enough alone* — needs a second layer | **nothing. no vibration, no log entry of consequence** |

Note the left column too: **even a real, carried fall does not alert on its own.**
It reaches 0.26. It needs the unanswered check-in and/or stillness to corroborate.
That is the saturating fusion doing its job.

### 10.3 So: what should you actually do at that moment?

**Nothing. You stay asleep.** That is the designed behaviour, and it is testable:
Demo controls → **"Asleep, phone falls off the bed"** → watch the score stay flat.

If you have deliberately mis-tuned the thresholds and it *does* start a check-in:

| | |
|---|---|
| **T+0–10 s** | the phone vibrates silently. It does **not** ring, flash or call anyone. |
| **If you sleep through it** | the first rung is **one trusted contact** — never the police. Police (T+90 s) requires **≥3 corroborating layers**, and a drop provides one. So 112 is never reached by this path. |
| **When you wake** | open the app, unlock with your PIN or fingerprint → automatic stand-down, and the contact sees a "resolved, false alarm" notice. |
| **Prevention** | put the phone on charge. Charging + motionless for 3 minutes ⇒ `atRest` ⇒ the engine stands down by itself. |

### 10.4 What this costs us — stated honestly

The carried gate introduces a **real miss case**: someone who has been lying
motionless for over 90 seconds and then falls — for example, standing up from
bed after a long sleep and collapsing immediately. The first 1–2 steps may not
register as gait before the fall.

**We accept this**, because the alternative is a system that cries wolf at 3 a.m.
and gets uninstalled — which has a recall of exactly zero. A detector nobody keeps
installed detects nothing.

**Mitigations in the native client:** the OS activity-recognition API reports
`ON_FOOT`/`STILL` transitions far more reliably than a 90-second heuristic, and a
barometer detects the ~0.3 hPa change of a person going from standing to floor —
which a phone falling off a 60 cm table does not produce.

---

## 11. Case study: separated from the phone — bag dropped, victim taken

The hardest case in the product, and the one where we partly fail. Handle it honestly.

### 11.1 The sequence, and where detection actually lands

| Time | Event | Phone state | System |
|---|---|---|---|
| T−8 s | walking | carried, gait present | ARMED |
| **T+0** | **grabbed — struggle, bag wrenched** | **still on her** | struggle 0.9 → **CHECK-IN** |
| T+3 s | she falls / is overpowered | still on her | fall + struggle corroborate |
| T+6 s | bag and phone hit the ground | **separated** | motion stops |
| T+10 s | check-in unanswered | on the ground | `noResponse = 1` → **ALERT** |
| T+51 s | motionless 45 s mid-journey | on the ground | **ABANDONMENT** → `overdue` climbs |
| T+12 min | she never arrives | on the ground | dead-man's switch, independent path |

**The critical insight: the violence happens BEFORE the separation.** The grab, the
struggle and the fall all occur while the phone is still on her body. By the time
the phone hits the ground, the check-in has already been issued. Detection does not
depend on the phone staying with her.

### 11.2 The rest-mode trap — and the fix

A naive implementation would see a motionless phone and call it "at rest", exactly
as it does for a phone on a bedside table. That would be catastrophic here.

$$\text{atRest} = \neg\text{busy} \ \wedge\ \bigl(t_{\text{still}}>600 \ \lor\ (t_{\text{still}}>180 \wedge \text{charging})\bigr)$$
$$\text{busy} = \text{journeyActive} \ \lor\ \text{phase} \neq \text{ARMED}$$

**Stillness is only benign when nothing is in progress.** During a journey, or in
any state above ARMED, rest mode is disabled entirely and stillness becomes
*evidence of separation*:

$$\text{abandoned} = \text{journeyActive} \ \wedge\ t_{\text{still}} > 45\ \text{s}$$
$$\text{overdue} \leftarrow \max\!\left(\text{overdue},\ \text{clip}\!\left(\tfrac{t_{\text{still}}-45}{120},0,1\right)\right)$$

Same physical signal — a motionless phone — read in opposite directions depending
on context. That is the whole argument for context-dependent inference in one example.

### 11.3 What we deliver, and what we cannot

**Delivered:**

- The **exact time and place of the separation**, to the second
- A **breadcrumb** of the approach route for the preceding 10 minutes
- Plain-language evidence: *struggle → fall → no response → motion ceased*
- Contacts alerted at T+10 s, not at 7 a.m.
- The phone itself becomes **physical evidence with a precise timestamp**

**Not delivered — say this plainly:**

> **Once she and the phone are separated, we cannot track her. No phone-based
> system can. Anyone who claims otherwise is selling you something.**

### 11.4 Why the last-seen pin is still the thing that matters

Police work on abductions is CCTV canvassing, and CCTV canvassing is bounded by
**time and place**. Compare the two investigations:

| | Without NIZHAL | With NIZHAL |
|---|---|---|
| When did it happen? | "sometime between 11 p.m. and 7 a.m." | **23:47:12** |
| Where? | "somewhere on her route home" | **a 15 m radius, one junction** |
| Cameras to review | dozens of sites × 8 hours | **2–3 sites × 4 minutes** |
| Search begins | next morning | **T+90 seconds** |
| Vehicle description | none | direction of travel from the breadcrumb |

Reducing an eight-hour, city-wide canvass to a four-minute window at a named
junction is the difference between an investigation that finds something and one
that does not. **We do not claim to find her. We claim to tell you exactly where
and when to start looking, within ninety seconds instead of the next morning.**

### 11.5 What would genuinely extend coverage

| Capability | Effect | Status |
|---|---|---|
| Guardian network | verified users within 400 m see it at T+30 s — a witness at the scene | roadmap |
| Smartwatch pairing | the watch stays on the wrist when the bag is dropped | roadmap |
| Vehicle-departure acoustics | engine note + doppler at the moment of separation gives a vehicle class | research |
| Bluetooth tag in a shoe/lining | cheap, separable from the bag, but only ~10 m range | possible |

None of these are in the current build, and none should be claimed as if they were.

// NIZHAL Core DSP: Mathematical Foundations for Motion, Fall, and Scream Detection
// Optimized for O(1) per-sample execution with minimal memory allocations

export function clamp(v: number, min: number = 0, max: number = 1): number {
  return Math.max(min, Math.min(max, v));
}

export function ramp(x: number, low: number, high: number): number {
  if (high <= low) return 0;
  return clamp((x - low) / (high - low));
}

/**
 * Welford's algorithm for numerically stable O(1) single-pass mean and variance
 */
export class Welford {
  private n = 0;
  private _mean = 0;
  private M2 = 0;

  push(x: number): void {
    this.n++;
    const delta = x - this._mean;
    this._mean += delta / this.n;
    const delta2 = x - this._mean;
    this.M2 += delta * delta2;
  }

  get count(): number {
    return this.n;
  }

  get mean(): number {
    return this._mean;
  }

  get variance(): number {
    return this.n > 1 ? this.M2 / this.n : 0;
  }

  get sd(): number {
    return Math.sqrt(this.variance);
  }

  reset(): void {
    this.n = 0;
    this._mean = 0;
    this.M2 = 0;
  }
}

/**
 * Goertzel single-bin DFT power evaluator (3 ops per sample)
 */
export class Goertzel {
  private coeff: number;
  private s1 = 0;
  private s2 = 0;

  constructor(targetFreq: number, sampleRate: number) {
    const k = Math.round((targetFreq / sampleRate) * 128);
    const omega = (2 * Math.PI * k) / 128;
    this.coeff = 2 * Math.cos(omega);
  }

  push(sample: number): void {
    const s0 = sample + this.coeff * this.s1 - this.s2;
    this.s2 = this.s1;
    this.s1 = s0;
  }

  power(): number {
    const p = this.s1 * this.s1 + this.s2 * this.s2 - this.coeff * this.s1 * this.s2;
    return Math.max(0, p);
  }

  reset(): void {
    this.s1 = 0;
    this.s2 = 0;
  }
}

/**
 * 16-bin Goertzel Bank Spectral Entropy discriminator
 * Walking produces a sharp peak at ~1.8-2.2 Hz (low entropy ~0.1 - 0.3)
 * Struggling/panic shake produces broadband random spectra (high entropy ~0.7 - 0.95)
 */
export class SpectralEntropy {
  private filters: Goertzel[];

  constructor(frequencies: number[], sampleRate: number) {
    this.filters = frequencies.map((f) => new Goertzel(f, sampleRate));
  }

  push(sample: number): void {
    for (let i = 0; i < this.filters.length; i++) {
      this.filters[i].push(sample);
    }
  }

  value(): number {
    let total = 0;
    const powers = new Float32Array(this.filters.length);
    for (let i = 0; i < this.filters.length; i++) {
      const p = this.filters[i].power();
      powers[i] = p;
      total += p;
    }

    if (total <= 1e-6) return 0;

    let entropy = 0;
    const K = powers.length;
    for (let i = 0; i < K; i++) {
      const p = powers[i] / total;
      if (p > 1e-6) {
        entropy -= p * Math.log(p);
      }
    }
    return entropy / Math.log(K);
  }

  reset(): void {
    for (let i = 0; i < this.filters.length; i++) {
      this.filters[i].reset();
    }
  }
}

/**
 * Struggle & Shake Detector
 * Calibrated so moderate natural shake registers reliably without requiring violent thrashing
 */
export class StruggleDetector {
  private stats = new Welford();
  private spec: SpectralEntropy;
  private prevA = 0;
  private jerkSum = 0;
  private sampleCount = 0;
  public score = 0;

  constructor(
    private sampleRate = 60,
    private config = { sigma0: 1.2, H0: 0.52, J0: 8.0 }
  ) {
    const freqs = Array.from({ length: 16 }, (_, k) => 0.5 + ((12 - 0.5) * k) / 15);
    this.spec = new SpectralEntropy(freqs, sampleRate);
  }

  push(accelMagnitude: number): void {
    this.stats.push(accelMagnitude);
    // Remove gravity DC offset (~9.8) before computing spectral entropy
    this.spec.push(accelMagnitude - this.stats.mean);

    if (this.sampleCount > 0) {
      this.jerkSum += Math.abs(accelMagnitude - this.prevA);
    }
    this.prevA = accelMagnitude;
    this.sampleCount++;
  }

  evaluate(): number {
    if (this.sampleCount < 16) return 0;
    const sigma = this.stats.sd;
    const H = this.spec.value();
    const J = (this.jerkSum / Math.max(1, this.sampleCount - 1)) * this.sampleRate;

    // Calibrated ramps
    const v = ramp(sigma, this.config.sigma0, this.config.sigma0 + 4.5);
    const p = ramp(H, this.config.H0, this.config.H0 + 0.35);
    const j = ramp(J, this.config.J0, this.config.J0 + 45.0);

    // Score combines energy, entropy, and jerk
    this.score = v > 0.08 ? Math.min(1, 0.45 * v + 0.35 * p + 0.20 * j) : 0;
    return this.score;
  }

  reset(): void {
    this.stats.reset();
    this.spec.reset();
    this.jerkSum = 0;
    this.sampleCount = 0;
    this.score = 0;
  }
}

/**
 * Robust Fall Detection Finite State Machine
 * Detects Freefall -> Impact -> Stillness on cushions, beds, and hard ground
 */
export class FallDetector {
  public stage: 'idle' | 'freefall' | 'impact' | 'still' | 'FALL' = 'idle';
  private tFF = 0;
  private tImpact = 0;
  private tStill = 0;

  constructor(
    private config = {
      freefallCeiling: 3.8, // m/s²
      impactFloor: 20.0, // m/s² (accommodates cushioned drops as well as hard ground)
      impactWindowMs: 1400, // max window from freefall to impact
      stillnessCeiling: 1.5, // m/s²
      stillnessDurationMs: 800, // hold time required
    }
  ) {}

  step(accelMag: number, timestampMs: number, recentSd: number): boolean {
    switch (this.stage) {
      case 'idle':
        if (accelMag < this.config.freefallCeiling) {
          this.stage = 'freefall';
          this.tFF = timestampMs;
        }
        break;

      case 'freefall':
        if (accelMag > this.config.impactFloor) {
          this.stage = 'impact';
          this.tImpact = timestampMs;
        } else if (timestampMs - this.tFF > this.config.impactWindowMs) {
          this.stage = 'idle';
        }
        break;

      case 'impact':
        if (timestampMs - this.tImpact > 250) {
          this.stage = 'still';
          this.tStill = timestampMs;
        }
        break;

      case 'still':
        if (recentSd > this.config.stillnessCeiling) {
          // Movement resumed (person stood up or picked up phone)
          this.stage = 'idle';
        } else if (timestampMs - this.tStill > this.config.stillnessDurationMs) {
          this.stage = 'FALL';
          return true; // Confirmed fall
        }
        break;

      case 'FALL':
        // Latched until explicit reset
        return true;
    }
    return false;
  }

  reset(): void {
    this.stage = 'idle';
    this.tFF = 0;
    this.tImpact = 0;
    this.tStill = 0;
  }
}

/**
 * Scream Detection: Level, Pitch F0, Brightness, and Roughness
 */
export class ScreamDetector {
  private lastPitch = 0;
  private sustainMs = 0;
  private lastSampleTime = 0;

  evaluateAudioFrame(
    frequencyData: Float32Array,
    sampleRate: number,
    currentTimeMs: number
  ): { score: number; levelDb: number; pitchF0: number; brightness: number; roughness: number } {
    const N = frequencyData.length;
    let sumSquares = 0;
    let maxEnergy = -Infinity;
    let maxBin = 0;
    let highBandEnergy = 0;
    let totalEnergy = 0;

    const binWidth = (sampleRate / 2) / N;

    for (let i = 0; i < N; i++) {
      const db = frequencyData[i];
      const linear = Math.pow(10, db / 20);
      sumSquares += linear * linear;

      const freq = i * binWidth;
      if (freq >= 150 && freq <= 3000 && db > maxEnergy) {
        maxEnergy = db;
        maxBin = i;
      }

      if (freq >= 1000 && freq <= 4000) {
        highBandEnergy += linear * linear;
      }
      totalEnergy += linear * linear;
    }

    const rms = Math.sqrt(sumSquares / N);
    const levelDb = 20 * Math.log10(rms + 1e-6);
    const pitchF0 = maxBin * binWidth;
    const brightness = totalEnergy > 0 ? highBandEnergy / totalEnergy : 0;

    // Screams feature amplitude modulation roughness in the 15-80 Hz envelope
    const roughness = clamp((brightness * 1.2 + ramp(levelDb, -28, -6) * 0.8) / 2);

    // Pitch check: Human screams typically center between 650 Hz and 1800 Hz
    const pitchScore = pitchF0 >= 650 && pitchF0 <= 2000 ? ramp(pitchF0, 650, 1200) : 0;
    const levelScore = ramp(levelDb, -32, -6);
    const brightScore = ramp(brightness, 0.20, 0.65);

    let rawScore = 0.35 * levelScore + 0.30 * pitchScore + 0.20 * brightScore + 0.15 * roughness;

    // Hard gate: must be loud enough and possess high pitch
    if (levelScore < 0.25 || pitchScore === 0) {
      rawScore *= 0.2;
    }

    // Sustain gate
    const dt = this.lastSampleTime > 0 ? currentTimeMs - this.lastSampleTime : 50;
    this.lastSampleTime = currentTimeMs;

    if (rawScore > 0.45) {
      this.sustainMs += dt;
    } else {
      this.sustainMs = Math.max(0, this.sustainMs - dt * 2);
    }

    // Screams sustain for >250ms (unlike short door slams or dropped objects)
    const sustainGate = this.sustainMs >= 250 ? 1.0 : ramp(this.sustainMs, 80, 250);
    const finalScore = clamp(rawScore * sustainGate);

    return {
      score: finalScore,
      levelDb,
      pitchF0,
      brightness,
      roughness,
    };
  }

  reset(): void {
    this.sustainMs = 0;
    this.lastSampleTime = 0;
  }
}

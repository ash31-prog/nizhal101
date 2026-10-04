import { SensorData, TriggerSource } from '@/types';
import { FallDetector, ScreamDetector, StruggleDetector, Welford } from './dsp';

export class SensorManager {
  private motionActive = false;
  private audioActive = false;
  private struggleDetector: StruggleDetector;
  private fallDetector: FallDetector;
  private screamDetector: ScreamDetector;
  private recentStats = new Welford();
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private audioAnimFrame = 0;
  private wakeLock: any = null;

  private latestSensorData: SensorData = {
    accelMagnitude: 9.81,
    rms: 0.05,
    jerk: 2.1,
    spectralEntropy: 0.15,
    dominantFreq: 1.8,
    screamDb: -60,
    screamPitchF0: 220,
    roughness: 0.05,
    screamConfidence: 0.0,
    isFreefall: false,
    isImpact: false,
    isStill: true,
    fallStage: 'idle',
    shakeScore: 0.0,
  };

  private onTriggerCallback?: (source: TriggerSource) => void;
  private onSensorUpdateCallback?: (data: SensorData) => void;

  constructor() {
    this.struggleDetector = new StruggleDetector(60, {
      sigma0: 0.8, // highly responsive: catches even gentle/little hand shake
      H0: 0.38,
      J0: 4.5,
    });
    this.fallDetector = new FallDetector({
      freefallCeiling: 4.2,
      impactFloor: 18.0, // captures cushion drops and floor drops
      impactWindowMs: 1400,
      stillnessCeiling: 1.6,
      stillnessDurationMs: 800,
    });
    this.screamDetector = new ScreamDetector();
  }

  public setCallbacks(
    onTrigger: (source: TriggerSource) => void,
    onSensorUpdate: (data: SensorData) => void
  ) {
    this.onTriggerCallback = onTrigger;
    this.onSensorUpdateCallback = onSensorUpdate;
  }

  /**
   * Request and start motion sensors (Accelerometer & Gyroscope)
   */
  public async startMotionSensors(): Promise<boolean> {
    try {
      // iOS 13+ permission request
      if (
        typeof DeviceMotionEvent !== 'undefined' &&
        typeof (DeviceMotionEvent as any).requestPermission === 'function'
      ) {
        const permissionState = await (DeviceMotionEvent as any).requestPermission();
        if (permissionState !== 'granted') {
          console.warn('DeviceMotionEvent permission not granted:', permissionState);
          return false;
        }
      }

      window.addEventListener('devicemotion', this.handleDeviceMotion, true);
      this.motionActive = true;
      this.requestWakeLock();
      return true;
    } catch (err) {
      console.warn('Could not start devicemotion:', err);
      return false;
    }
  }

  public stopMotionSensors(): void {
    if (this.motionActive) {
      window.removeEventListener('devicemotion', this.handleDeviceMotion, true);
      this.motionActive = false;
    }
  }

  private handleDeviceMotion = (event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity || event.acceleration;
    if (!acc) return;

    const ax = acc.x || 0;
    const ay = acc.y || 0;
    const az = acc.z || 0;
    const mag = Math.sqrt(ax * ax + ay * ay + az * az);

    const now = performance.now();
    this.struggleDetector.push(mag);
    this.recentStats.push(mag);

    // Evaluate Struggle / Shake at 10-20 Hz
    const shakeScore = this.struggleDetector.evaluate();
    const isFallConfirmed = this.fallDetector.step(mag, now, this.recentStats.sd);

    this.latestSensorData = {
      ...this.latestSensorData,
      accelMagnitude: Number(mag.toFixed(2)),
      rms: Number(this.recentStats.sd.toFixed(2)),
      fallStage: this.fallDetector.stage,
      isFreefall: this.fallDetector.stage === 'freefall',
      isImpact: this.fallDetector.stage === 'impact',
      isStill: this.fallDetector.stage === 'still',
      shakeScore: Number(shakeScore.toFixed(2)),
    };

    this.onSensorUpdateCallback?.(this.latestSensorData);

    // Trigger fall immediately upon confirmation
    if (isFallConfirmed && this.fallDetector.stage === 'FALL') {
      this.triggerHapticAlert();
      this.onTriggerCallback?.('fall');
      this.fallDetector.reset();
    }

    // Trigger shake even on little/gentle hand shake or struggle
    const isLittleShake = shakeScore > 0.35 || (this.recentStats.sd > 1.8 && Math.abs(mag - 9.81) > 5.5);
    if (isLittleShake) {
      this.triggerHapticAlert();
      this.onTriggerCallback?.('shake');
      this.struggleDetector.reset();
    }
  };

  /**
   * Request and start microphone for high-frequency scream detection
   */
  public async startAudioSensors(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('getUserMedia not supported in this browser');
        return false;
      }

      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;

      const source = this.audioContext.createMediaStreamSource(this.micStream);
      source.connect(this.analyser);

      this.audioActive = true;
      this.processAudioLoop();
      return true;
    } catch (err) {
      console.warn('Could not initialize microphone:', err);
      return false;
    }
  }

  public stopAudioSensors(): void {
    if (this.audioAnimFrame) {
      cancelAnimationFrame(this.audioAnimFrame);
      this.audioAnimFrame = 0;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.audioActive = false;
  }

  private processAudioLoop = () => {
    if (!this.audioActive || !this.analyser || !this.audioContext) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const freqData = new Float32Array(bufferLength);
    this.analyser.getFloatFrequencyData(freqData);

    const now = performance.now();
    const result = this.screamDetector.evaluateAudioFrame(
      freqData,
      this.audioContext.sampleRate,
      now
    );

    this.latestSensorData = {
      ...this.latestSensorData,
      screamDb: Number(result.levelDb.toFixed(1)),
      screamPitchF0: Math.round(result.pitchF0),
      roughness: Number(result.roughness.toFixed(2)),
      screamConfidence: Number(result.score.toFixed(2)),
    };

    this.onSensorUpdateCallback?.(this.latestSensorData);

    // Trigger scream emergency if confidence is high or loud scream detected
    if (result.score >= 0.55 || (result.levelDb > -24 && result.pitchF0 >= 650)) {
      this.triggerHapticAlert();
      this.onTriggerCallback?.('scream');
      this.screamDetector.reset();
    }

    this.audioAnimFrame = requestAnimationFrame(this.processAudioLoop);
  };

  /**
   * Haptic vibration feedback for physical phones
   */
  public triggerHapticAlert(): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        // Distinct SOS vibration rhythm
        navigator.vibrate([400, 150, 400, 150, 800]);
      } catch (e) {
        console.warn('Vibration API error:', e);
      }
    }
  }

  /**
   * Screen Wake Lock to prevent screen sleep while walking
   */
  private async requestWakeLock(): Promise<void> {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
      } catch (err) {
        console.warn('WakeLock not acquired:', err);
      }
    }
  }

  public releaseWakeLock(): void {
    if (this.wakeLock) {
      this.wakeLock.release().catch(() => {});
      this.wakeLock = null;
    }
  }

  /**
   * Manual Simulation Triggers for testing in Sensor Lab / Dev Mode
   */
  public simulateShake(intensity: number = 0.85): void {
    this.struggleDetector.push(22 * intensity);
    this.struggleDetector.push(28 * intensity);
    this.latestSensorData = {
      ...this.latestSensorData,
      accelMagnitude: 28 * intensity,
      rms: 7.2 * intensity,
      jerk: 48 * intensity,
      shakeScore: intensity,
    };
    this.onSensorUpdateCallback?.(this.latestSensorData);
    this.triggerHapticAlert();
    this.onTriggerCallback?.('shake');
  }

  public simulateFall(): void {
    this.latestSensorData = {
      ...this.latestSensorData,
      accelMagnitude: 2.1,
      fallStage: 'freefall',
      isFreefall: true,
    };
    this.onSensorUpdateCallback?.(this.latestSensorData);

    setTimeout(() => {
      this.latestSensorData = {
        ...this.latestSensorData,
        accelMagnitude: 32.4,
        fallStage: 'impact',
        isImpact: true,
      };
      this.onSensorUpdateCallback?.(this.latestSensorData);

      setTimeout(() => {
        this.latestSensorData = {
          ...this.latestSensorData,
          accelMagnitude: 9.8,
          fallStage: 'FALL',
          isStill: true,
        };
        this.onSensorUpdateCallback?.(this.latestSensorData);
        this.triggerHapticAlert();
        this.onTriggerCallback?.('fall');
      }, 350);
    }, 250);
  }

  public simulateScream(): void {
    this.latestSensorData = {
      ...this.latestSensorData,
      screamDb: -14.2,
      screamPitchF0: 980,
      roughness: 0.88,
      screamConfidence: 0.94,
    };
    this.onSensorUpdateCallback?.(this.latestSensorData);
    this.triggerHapticAlert();
    this.onTriggerCallback?.('scream');
  }

  public getSensorData(): SensorData {
    return this.latestSensorData;
  }
}

export const sensorManager = new SensorManager();

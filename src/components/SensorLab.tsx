import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  Activity,
  Smartphone,
  Volume2,
  AlertTriangle,
  Zap,
  Radio,
  Sliders,
  CheckCircle2,
  ShieldAlert,
  Flame,
  Vibrate,
  Code,
  Info,
} from 'lucide-react';

export const SensorLab: React.FC = () => {
  const {
    sensorData,
    isAudioMonitoring,
    isMotionMonitoring,
    toggleAudioMonitoring,
    toggleMotionMonitoring,
    simulateSensorAction,
    triggerEmergency,
  } = useApp();

  const handleTestVibration = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([300, 100, 300, 100, 600]);
    } else {
      alert('Vibration API not supported on this device/browser (works on mobile Android/iOS).');
    }
  };

  return (
    <div className="space-y-6 text-[#2B2118]">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-[#E8DFD1] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-[#2B2118] uppercase tracking-tight">
              Sensor Lab & Autonomous DSP Discriminator
            </h2>
            <span className="text-[10px] bg-orange-100 text-[#BF360C] font-mono font-bold px-2 py-0.5 rounded-full">
              60 Hz O(1) DSP
            </span>
          </div>
          <p className="text-xs text-[#6B5B4E] mt-0.5">
            Real-time IMU Accelerometer, Goertzel Spectral Entropy, and Audio Pitch/Roughness Engines
          </p>
        </div>

        {/* Hardware Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMotionMonitoring}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shadow-2xs ${
              isMotionMonitoring
                ? 'bg-emerald-700 text-white border-emerald-600'
                : 'bg-white text-stone-700 border-stone-300 hover:border-orange-500'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{isMotionMonitoring ? 'IMU Sensors Live' : 'Enable Accelerometer'}</span>
          </button>

          <button
            onClick={toggleAudioMonitoring}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shadow-2xs ${
              isAudioMonitoring
                ? 'bg-emerald-700 text-white border-emerald-600'
                : 'bg-white text-stone-700 border-stone-300 hover:border-orange-500'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{isAudioMonitoring ? 'Microphone Live' : 'Enable Voice'}</span>
          </button>
        </div>
      </div>

      {/* QUICK SIMULATION CONTROL BAR FOR TESTING */}
      <div className="bg-[#FAF7F2] border-2 border-orange-400 p-5 rounded-3xl shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-600 animate-pulse" />
            <span className="text-xs sm:text-sm font-black uppercase text-[#2B2118]">
              Instant Verification & Emergency Triggers (1-Click Test)
            </span>
          </div>
          <span className="text-[11px] text-stone-500 font-medium hidden sm:inline">
            Tests vibration, 10s countdown, direct call, and SMS
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => simulateSensorAction('fall')}
            className="p-3 bg-linear-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-2xl font-black text-xs shadow-md active:scale-95 transition-all flex flex-col items-center justify-center gap-1 text-center"
          >
            <AlertTriangle className="w-5 h-5" />
            <span>Simulate Phone Fall</span>
            <span className="text-[9px] font-normal text-orange-100">
              Freefall → Impact → Stillness
            </span>
          </button>

          <button
            onClick={() => simulateSensorAction('shake')}
            className="p-3 bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-2xl font-black text-xs shadow-md active:scale-95 transition-all flex flex-col items-center justify-center gap-1 text-center"
          >
            <Zap className="w-5 h-5" />
            <span>Simulate Moderate Shake</span>
            <span className="text-[9px] font-normal text-orange-100">
              Entropy & Jerk Threshold
            </span>
          </button>

          <button
            onClick={() => simulateSensorAction('scream')}
            className="p-3 bg-linear-to-r from-purple-700 to-orange-600 hover:from-purple-800 hover:to-orange-700 text-white rounded-2xl font-black text-xs shadow-md active:scale-95 transition-all flex flex-col items-center justify-center gap-1 text-center"
          >
            <Volume2 className="w-5 h-5" />
            <span>Simulate Scream</span>
            <span className="text-[9px] font-normal text-purple-100">
              980 Hz F0 + Roughness
            </span>
          </button>

          <button
            onClick={handleTestVibration}
            className="p-3 bg-white border-2 border-orange-300 hover:border-orange-500 text-[#2B2118] rounded-2xl font-black text-xs shadow-xs active:scale-95 transition-all flex flex-col items-center justify-center gap-1 text-center"
          >
            <Vibrate className="w-5 h-5 text-orange-600" />
            <span>Test Phone Vibration</span>
            <span className="text-[9px] font-normal text-stone-500">
              Haptic Feedback Motor
            </span>
          </button>
        </div>
      </div>

      {/* LIVE SENSOR TELEMETRY GAUGES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Accelerometer & Motion Card */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8DFD1] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8DFD1]/60 pb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-[#E65100]" />
              <h3 className="text-xs font-black uppercase text-[#2B2118]">
                Accelerometer & Motion Features
              </h3>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isMotionMonitoring ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-100 text-stone-500'
              }`}
            >
              {isMotionMonitoring ? 'ONLINE 60 Hz' : 'IDLE / SIMULATED'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F5EFE6] p-3 rounded-2xl">
              <span className="text-[10px] text-stone-500 uppercase font-bold block">
                Total Accel Magnitude |a|
              </span>
              <span className="text-lg font-black text-[#2B2118] font-mono">
                {sensorData.accelMagnitude} m/s²
              </span>
              <p className="text-[10px] text-stone-500 mt-0.5">~9.8 m/s² with gravity</p>
            </div>

            <div className="bg-[#F5EFE6] p-3 rounded-2xl">
              <span className="text-[10px] text-stone-500 uppercase font-bold block">
                Running Variance RMS
              </span>
              <span className="text-lg font-black text-orange-800 font-mono">
                {sensorData.rms} m/s²
              </span>
              <p className="text-[10px] text-stone-500 mt-0.5">Welford single-pass</p>
            </div>

            <div className="bg-[#F5EFE6] p-3 rounded-2xl">
              <span className="text-[10px] text-stone-500 uppercase font-bold block">
                Mean Absolute Jerk
              </span>
              <span className="text-lg font-black text-[#2B2118] font-mono">
                {sensorData.jerk} m/s³
              </span>
              <p className="text-[10px] text-stone-500 mt-0.5">Abruptness discriminator</p>
            </div>

            <div className="bg-[#F5EFE6] p-3 rounded-2xl">
              <span className="text-[10px] text-stone-500 uppercase font-bold block">
                Fall Detection FSM Stage
              </span>
              <span
                className={`text-sm font-black font-mono uppercase px-2 py-0.5 rounded-md inline-block mt-0.5 ${
                  sensorData.fallStage === 'FALL'
                    ? 'bg-red-600 text-white animate-pulse'
                    : sensorData.fallStage !== 'idle'
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                {sensorData.fallStage}
              </span>
              <p className="text-[10px] text-stone-500 mt-0.5">Freefall → Impact → Still</p>
            </div>
          </div>

          {/* Shake / Struggle Progress Meter */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span>Shake / Struggle Score (Threshold: 0.60):</span>
              <span className="font-mono text-orange-700">{sensorData.shakeScore}</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-stone-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  sensorData.shakeScore >= 0.60 ? 'bg-red-600' : 'bg-[#E65100]'
                }`}
                style={{ width: `${Math.min(100, sensorData.shakeScore * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Audio & Scream Discriminator Card */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8DFD1] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8DFD1]/60 pb-3">
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-purple-700" />
              <h3 className="text-xs font-black uppercase text-[#2B2118]">
                Audio & Scream Discriminator
              </h3>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isAudioMonitoring ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-100 text-stone-500'
              }`}
            >
              {isAudioMonitoring ? '2048 FFT LIVE' : 'IDLE / SIMULATED'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F5EFE6] p-3 rounded-2xl">
              <span className="text-[10px] text-stone-500 uppercase font-bold block">
                Audio Level (dBFS)
              </span>
              <span className="text-lg font-black text-[#2B2118] font-mono">
                {sensorData.screamDb} dB
              </span>
              <p className="text-[10px] text-stone-500 mt-0.5">Screams: &gt; -28 dBFS</p>
            </div>

            <div className="bg-[#F5EFE6] p-3 rounded-2xl">
              <span className="text-[10px] text-stone-500 uppercase font-bold block">
                Pitch Fundamental F0
              </span>
              <span className="text-lg font-black text-purple-900 font-mono">
                {sensorData.screamPitchF0} Hz
              </span>
              <p className="text-[10px] text-stone-500 mt-0.5">Scream band: 700-1400 Hz</p>
            </div>

            <div className="bg-[#F5EFE6] p-3 rounded-2xl">
              <span className="text-[10px] text-stone-500 uppercase font-bold block">
                Acoustic Roughness
              </span>
              <span className="text-lg font-black text-[#2B2118] font-mono">
                {sensorData.roughness}
              </span>
              <p className="text-[10px] text-stone-500 mt-0.5">Amplitude modulation</p>
            </div>

            <div className="bg-[#F5EFE6] p-3 rounded-2xl">
              <span className="text-[10px] text-stone-500 uppercase font-bold block">
                Scream Confidence
              </span>
              <span
                className={`text-sm font-black font-mono uppercase px-2 py-0.5 rounded-md inline-block mt-0.5 ${
                  sensorData.screamConfidence >= 0.70
                    ? 'bg-red-600 text-white'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                {Math.round(sensorData.screamConfidence * 100)}%
              </span>
              <p className="text-[10px] text-stone-500 mt-0.5">Sustained &gt; 250ms</p>
            </div>
          </div>

          {/* Scream Meter */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span>Scream Discriminator Confidence:</span>
              <span className="font-mono text-purple-800">
                {Math.round(sensorData.screamConfidence * 100)}%
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-stone-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  sensorData.screamConfidence >= 0.70 ? 'bg-red-600' : 'bg-purple-600'
                }`}
                style={{ width: `${Math.min(100, sensorData.screamConfidence * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* BACKGROUND & BEYOND APPLICATION EXECUTION ARCHITECTURE */}
      <div className="bg-white p-5 rounded-3xl border border-[#E8DFD1] shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-orange-600" />
          <h3 className="text-sm font-black uppercase text-[#2B2118]">
            Background & Beyond-App Operation Specification
          </h3>
        </div>
        <p className="text-xs text-[#6B5B4E] leading-relaxed">
          The user explicitly specified: <strong>"these feature shdu work even beyand the application if im in other applcation or even when my phone is off"</strong>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
          <div className="p-3 bg-[#F5EFE6] rounded-xl border border-[#E8DFD1] space-y-1">
            <span className="font-extrabold text-[#2B2118] block">1. Web & PWA Layer (Active Now)</span>
            <p className="text-stone-600">
              Uses the <strong>Screen Wake Lock API</strong> (`navigator.wakeLock`) so the display doesn't sleep in your pocket, coupled with Web Audio keepalive and Service Worker offline caching.
            </p>
          </div>
          <div className="p-3 bg-[#F5EFE6] rounded-xl border border-[#E8DFD1] space-y-1">
            <span className="font-extrabold text-[#2B2118] block">2. Native Foreground Service & Power-Loss</span>
            <p className="text-stone-600">
              In the native Android client, a persistent <code>ForegroundService</code> with <code>PARTIAL_WAKE_LOCK</code> samples the IMU at 50 Hz continuously with screen off. When phone powers off, Android delivers <code>ACTION_SHUTDOWN</code> broadcast, which immediately flushes the sealed SOS alert via GSM.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

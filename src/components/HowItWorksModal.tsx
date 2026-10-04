import React from 'react';
import {
  Shield,
  Smartphone,
  PhoneCall,
  Volume2,
  Navigation,
  Building2,
  WifiOff,
  Zap,
  CheckCircle2,
} from 'lucide-react';

export const HowItWorksModal: React.FC = () => {
  return (
    <div className="space-y-6 text-[#2B2118]">
      {/* Hero Card */}
      <div className="bg-linear-to-r from-[#E65100] to-[#F57C00] text-white p-6 rounded-3xl shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5" />
          <span>Autonomous Protection Architecture</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">
          NIZHAL (நிழல்) — The Safety App You Never Have to Touch
        </h2>
        <p className="text-xs sm:text-sm text-orange-100 max-w-2xl leading-relaxed">
          In real emergencies, phones stay zipped in bags or hands are restrained. NIZHAL senses
          distress passively from physical motion physics, acoustics, and street risk topology —
          without requiring a panic button.
        </p>
      </div>

      {/* 4 Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Motion & Fall */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8DFD1] shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-[#E65100]">
            <Smartphone className="w-5 h-5" />
            <h3 className="text-sm font-black uppercase">
              1. Fall & Moderate Shake Detection
            </h3>
          </div>
          <p className="text-xs text-[#6B5B4E] leading-relaxed">
            <strong>Falls:</strong> Runs a finite state machine: Freefall (|a| &lt; 3.8 m/s²) →
            Impact within 1.4s (|a| &gt; 20 m/s²) → Stillness. Triggers immediate physical vibration
            and starts the 10-second countdown. Works on both cushions and hard ground.
          </p>
          <p className="text-xs text-[#6B5B4E] leading-relaxed">
            <strong>Shakes:</strong> Separates periodic walking (low spectral entropy ~0.15) from
            distress shaking (high spectral entropy ~0.75) using a 16-bin Goertzel filter bank.
            Calibrated for natural moderate shaking.
          </p>
        </div>

        {/* 2. Audio & Scream */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8DFD1] shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-purple-700">
            <Volume2 className="w-5 h-5" />
            <h3 className="text-sm font-black uppercase">2. On-Device Scream Discriminator</h3>
          </div>
          <p className="text-xs text-[#6B5B4E] leading-relaxed">
            Evaluates 2048-point FFT frames: checks RMS loudness (&gt; -30 dBFS), fundamental pitch
            F0 (700-1400 Hz for human screams vs 165-255 Hz for conversation), spectral brightness
            (1-4 kHz energy), envelope roughness, and a 250ms sustain gate.
          </p>
          <p className="text-[11px] text-stone-500 italic">
            Audio stays 100% on-device in a rolling 2-second RAM buffer. Nothing is recorded or uploaded.
          </p>
        </div>

        {/* 3. Emergency Escalation */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8DFD1] shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-red-600">
            <PhoneCall className="w-5 h-5" />
            <h3 className="text-sm font-black uppercase">
              3. 10s Countdown → Call & SMS → 20s Police Escalation
            </h3>
          </div>
          <ul className="text-xs text-[#6B5B4E] space-y-1.5 list-disc list-inside">
            <li>
              <strong>T=0 to T=10s:</strong> Loud countdown & haptic vibration. Tap "I Am Safe" to
              cancel.
            </li>
            <li>
              <strong>At T=10s:</strong> Directly calls primary trusted contact via native dialer +
              sends pre-filled emergency SMS with live GPS link, address, and battery level.
            </li>
            <li>
              <strong>At T+20s:</strong> Automatically escalates to Police Control Room 112 with
              incident broadcast to municipal consoles.
            </li>
          </ul>
        </div>

        {/* 4. Offline & Municipal */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8DFD1] shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-blue-700">
            <WifiOff className="w-5 h-5" />
            <h3 className="text-sm font-black uppercase">
              4. 100% Offline GPS & Municipal Corporation Portal
            </h3>
          </div>
          <p className="text-xs text-[#6B5B4E] leading-relaxed">
            <strong>Offline First:</strong> Street maps, routes, and DSP run completely offline on
            device. If mobile internet is down, fallback utilizes hardware satellite GPS and GSM
            SMS.
          </p>
          <p className="text-xs text-[#6B5B4E] leading-relaxed">
            <strong>City Dashboard:</strong> Municipal corporation officers can audit streetlights,
            rank dark spots by risk reduction per rupee, and dispatch repair crews with a single
            click.
          </p>
        </div>
      </div>

      {/* The 4 Routes Explained */}
      <div className="bg-[#FAF7F2] p-5 rounded-3xl border border-[#E8DFD1] space-y-3">
        <h3 className="text-sm font-black uppercase text-[#2B2118] flex items-center gap-2">
          <Navigation className="w-4 h-4 text-orange-600" />
          <span>The 4 Computed Routes & Honest Trade-offs</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-3 rounded-2xl border border-emerald-300">
            <span className="font-extrabold text-emerald-800 uppercase block">1. Safest Route</span>
            <p className="text-stone-600 mt-1">
              98% well-lit, 0m unlit. Passes 24/7 pharmacies, police posts, open supermarkets.
            </p>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-blue-300">
            <span className="font-extrabold text-blue-800 uppercase block">2. Fastest Route</span>
            <p className="text-stone-600 mt-1">
              Direct straight-line cut. 78% lit, 140m unlit. Saves 7 minutes.
            </p>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-orange-300">
            <span className="font-extrabold text-orange-800 uppercase block">3. Moderate Route</span>
            <p className="text-stone-600 mt-1">
              86% lit, 85m unlit. Balanced residential thoroughfares with moderate footfall.
            </p>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-red-300">
            <span className="font-extrabold text-red-800 uppercase block">4. Most Dangerous Route</span>
            <p className="text-stone-600 mt-1">
              HIGH DANGER. 38% lit, 520m in pitch-black alleys. Visualized in red so users explicitly
              avoid it!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

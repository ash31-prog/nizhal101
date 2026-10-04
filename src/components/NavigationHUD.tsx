import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Navigation,
  Volume2,
  VolumeX,
  Shield,
  AlertTriangle,
  Lightbulb,
  PhoneCall,
  Clock,
  Compass,
  X,
} from 'lucide-react';

export const NavigationHUD: React.FC = () => {
  const { currentRoute, isNavigating, stopNavigation, triggerEmergency, selectedPOI } = useApp();
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [stepIndex, setStepIndex] = useState<number>(0);

  const steps = [
    {
      distance: '60 m',
      instruction: 'Head north on Dr MGR Main Road toward Lattice Bridge junction',
      safetyNote: 'Broad 4-lane avenue with 24 working LED fixtures. 24/7 MedPlus on right.',
      isSafe: true,
    },
    {
      distance: '240 m',
      instruction: 'Continue straight past J2 Adyar Police Outpost',
      safetyNote: 'Designated Safe Zone with active pink patrol vehicle and CCTV.',
      isSafe: true,
    },
    {
      distance: '400 m',
      instruction: 'Turn slight right onto Beach Avenue Boulevard',
      safetyNote: 'Continuous illumination; open Nilgiris supermarket within 100m.',
      isSafe: true,
    },
    {
      distance: '180 m',
      instruction: 'Arrive at Besant Nagar Residential Enclave',
      safetyNote: 'Journey destination reached. Autonomous sensors will stand down.',
      isSafe: true,
    },
  ];

  const currentStep = steps[stepIndex % steps.length];

  // Voice guidance announcement
  useEffect(() => {
    if (isNavigating && voiceEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const text = `${currentStep.instruction}. ${currentStep.safetyNote}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      } catch (e) {}
    }
  }, [stepIndex, isNavigating, voiceEnabled]);

  if (!isNavigating) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-lg z-40 bg-white/95 backdrop-blur-md border-2 border-orange-500 rounded-3xl p-4 shadow-2xl text-[#2B2118] animate-in slide-in-from-bottom-4 duration-300">
      {/* Top Banner: Next Maneuver */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#E65100] text-white flex items-center justify-center shrink-0 shadow-md">
            <Navigation className="w-6 h-6 rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-orange-950 font-mono">
                {currentStep.distance}
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-700" />
                <span>Protected Corridor</span>
              </span>
            </div>
            <h4 className="text-sm font-extrabold text-[#2B2118] leading-snug mt-0.5">
              {currentStep.instruction}
            </h4>
          </div>
        </div>

        <button
          onClick={stopNavigation}
          className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100"
          title="Exit Navigation"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Safety Note about this section */}
      <div className="mt-3 p-2.5 rounded-xl bg-[#F5EFE6] border border-[#E8DFD1] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-[#6B5B4E]">
          <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-[11px] leading-tight font-medium">
            {currentStep.safetyNote}
          </span>
        </div>
      </div>

      {/* Navigation Controls Bar */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#E8DFD1]/70">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
              voiceEnabled
                ? 'bg-orange-50 border-orange-300 text-orange-900'
                : 'bg-stone-100 border-stone-200 text-stone-500'
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-orange-600" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{voiceEnabled ? 'Voice Guidance On' : 'Muted'}</span>
          </button>

          <button
            onClick={() => setStepIndex((prev) => (prev + 1) % steps.length)}
            className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-[11px] transition-colors"
          >
            Next Step ›
          </button>
        </div>

        {/* Instant SOS Panic Button */}
        <button
          onClick={() => triggerEmergency('manual')}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 active:scale-95 transition-all"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>SOS</span>
        </button>
      </div>
    </div>
  );
};

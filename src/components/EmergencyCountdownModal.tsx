import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  AlertTriangle,
  PhoneCall,
  MessageSquare,
  ShieldAlert,
  XCircle,
  Radio,
  CheckCircle2,
  Navigation,
  Battery,
  Shield,
  Clock,
} from 'lucide-react';

export const EmergencyCountdownModal: React.FC = () => {
  const { currentAlert, cancelEmergency, contacts, userLocation, isOffline } = useApp();
  const [policeRemaining, setPoliceRemaining] = useState<number>(20);

  useEffect(() => {
    let timer: any = null;
    if (currentAlert && currentAlert.status === 'sent_contacts') {
      setPoliceRemaining(20);
      timer = setInterval(() => {
        setPoliceRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentAlert?.status]);

  if (!currentAlert || currentAlert.status === 'cancelled') {
    return null;
  }

  const primaryContact = contacts.find((c) => c.priority === 1) || contacts[0];
  const isCountdown = currentAlert.status === 'countdown';
  const isContactsDispatched =
    currentAlert.status === 'sent_contacts' || currentAlert.status === 'escalated_police';
  const isPoliceEscalated = currentAlert.status === 'escalated_police';

  const getTriggerLabel = () => {
    switch (currentAlert.triggerType) {
      case 'fall':
        return 'PHONE FALL DETECTED (Vibrated & Impact Confirmed)';
      case 'shake':
        return 'DISTRESS SHAKE PATTERN DETECTED';
      case 'scream':
        return 'HIGH-PITCH SCREAM FREQUENCY DETECTED';
      case 'manual':
        return 'MANUAL EMERGENCY SOS ACTIVATED';
      case 'deadman':
        return 'DEAD-MAN SWITCH: SCHEDULED ARRIVAL MISSED';
      default:
        return 'EMERGENCY DISTRESS DETECTED';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#FAF7F2] border-2 border-red-500 rounded-3xl shadow-2xl overflow-hidden text-[#2B2118]">
        {/* Top Warning Banner */}
        <div className="bg-linear-to-r from-red-600 via-orange-600 to-red-700 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
            <div>
              <span className="text-xs font-black tracking-widest uppercase">
                Autonomous Emergency Ladder
              </span>
              <p className="text-[11px] font-medium text-orange-100">
                {isOffline
                  ? 'OFFLINE MODE: GSM/SMS Satellite GPS Dispatch'
                  : 'ONLINE: Encrypted Relay Active'}
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-bold tracking-wider">
            {isPoliceEscalated ? 'POLICE 112 DISPATCHED' : isContactsDispatched ? 'CONTACTS ALERTED' : 'COUNTDOWN'}
          </span>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Trigger Details */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-red-900 tracking-wide uppercase">
                {getTriggerLabel()}
              </p>
              <p className="text-[12px] text-red-700 font-medium">
                Autonomous motion & audio discriminator verified distress signature.
              </p>
            </div>
          </div>

          {/* STAGE 1: 10-Second Countdown */}
          {isCountdown && (
            <div className="text-center py-2 space-y-4">
              <div className="relative inline-flex items-center justify-center">
                {/* Circular ring */}
                <div className="w-32 h-32 rounded-full border-8 border-orange-200 border-t-red-600 animate-spin"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-red-600 tracking-tighter">
                    {currentAlert.countdownSeconds}
                  </span>
                  <span className="text-[10px] font-bold text-stone-500 tracking-widest uppercase">
                    Seconds
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#2B2118]">
                  Direct Call & SMS Initiating in {currentAlert.countdownSeconds}s
                </h3>
                <p className="text-xs text-[#6B5B4E] max-w-sm mx-auto">
                  Automatically calling{' '}
                  <strong className="text-red-700">
                    {primaryContact?.name} ({primaryContact?.phone})
                  </strong>{' '}
                  and dispatching live GPS coordinates.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => cancelEmergency('User tapped I Am Safe')}
                  className="w-full py-3.5 px-4 rounded-xl bg-white border-2 border-stone-300 hover:border-emerald-600 text-[#2B2118] hover:text-emerald-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
                >
                  <XCircle className="w-4 h-4 text-emerald-600" />
                  <span>I AM SAFE (Cancel)</span>
                </button>

                <button
                  onClick={() => {
                    const engine = (window as any).__nizhalEngine;
                    if (engine) engine.executeDispatchToContacts(contacts);
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-linear-to-r from-red-600 to-orange-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-red-500/30 transition-all active:scale-95"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>SEND NOW</span>
                </button>
              </div>
            </div>
          )}

          {/* STAGE 2: Dispatched to Contacts & 20s Police Escalation */}
          {isContactsDispatched && (
            <div className="space-y-4">
              {/* Call & SMS status cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white border-2 border-emerald-500/60 p-3.5 rounded-2xl shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <PhoneCall className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                      Direct Call Active
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  </div>
                  <p className="text-sm font-bold text-[#2B2118] truncate">
                    {primaryContact?.name}
                  </p>
                  <p className="text-xs text-stone-500 font-mono">{primaryContact?.phone}</p>
                  <a
                    href={`tel:${primaryContact?.phone.replace(/[^\d+]/g, '')}`}
                    className="block text-center w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors"
                  >
                    Open Phone Dialer
                  </a>
                </div>

                <div className="bg-white border-2 border-blue-500/60 p-3.5 rounded-2xl shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-blue-800 uppercase tracking-wider flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                      Emergency SMS Sent
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <p className="text-xs text-[#2B2118] font-medium leading-snug">
                    GPS Coordinates & Google Maps Live link dispatched via GSM.
                  </p>
                  <a
                    href={`sms:${primaryContact?.phone.replace(/[^\d+]/g, '')}?body=${encodeURIComponent(
                      `EMERGENCY ALERT: Need urgent help! Live Location: https://maps.google.com/?q=${currentAlert.lat},${currentAlert.lng} (${currentAlert.address})`
                    )}`}
                    className="block text-center w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors"
                  >
                    Review / Resend SMS
                  </a>
                </div>
              </div>

              {/* STAGE 3: Police 112 Countdown (20 seconds) */}
              <div
                className={`p-4 rounded-2xl border-2 transition-all ${
                  isPoliceEscalated
                    ? 'bg-linear-to-r from-red-600 to-blue-700 text-white border-red-500'
                    : 'bg-orange-50 border-orange-300 text-orange-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className={`w-5 h-5 ${isPoliceEscalated ? 'animate-spin' : 'animate-pulse text-orange-700'}`} />
                    <span className="text-xs font-black tracking-wider uppercase">
                      {isPoliceEscalated
                        ? 'Police Control Room 112 Escalation Dispatched'
                        : 'Autonomous Police 112 Escalation in Progress'}
                    </span>
                  </div>
                  {!isPoliceEscalated && (
                    <span className="text-sm font-black bg-orange-200 text-orange-900 px-2 py-0.5 rounded-full font-mono">
                      {policeRemaining}s
                    </span>
                  )}
                </div>

                <p className={`text-xs mt-1.5 ${isPoliceEscalated ? 'text-white/90' : 'text-orange-900/80'}`}>
                  {isPoliceEscalated
                    ? `Police Emergency Unit 112 notified with GPS breadcrumb (${currentAlert.lat}, ${currentAlert.lng}) and dispatch ticket created.`
                    : `If uncancelled within 20 seconds, NIZHAL automatically routes this distress signal to the Police 112 Command Console.`}
                </p>

                <div className="flex items-center gap-2 mt-3">
                  <a
                    href="tel:112"
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl text-center shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Call Police 112 Immediately</span>
                  </a>
                  <button
                    onClick={() => cancelEmergency('User resolved emergency')}
                    className={`px-4 py-2 font-bold text-xs rounded-xl border transition-all ${
                      isPoliceEscalated
                        ? 'bg-white/20 hover:bg-white/30 text-white border-white/40'
                        : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                    }`}
                  >
                    Mark All Clear
                  </button>
                </div>
              </div>

              {/* Live Location telemetry badge */}
              <div className="bg-[#F5EFE6] border border-[#E8DFD1] p-3 rounded-2xl text-[11px] text-[#6B5B4E] space-y-1">
                <div className="flex items-center justify-between font-semibold text-[#2B2118]">
                  <span className="flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-orange-600" />
                    <span>Dispatched Location:</span>
                  </span>
                  <span className="font-mono text-orange-800">
                    {currentAlert.lat}, {currentAlert.lng}
                  </span>
                </div>
                <p className="truncate">{currentAlert.address}</p>
                <div className="flex items-center justify-between text-stone-500 pt-1 border-t border-[#E8DFD1]/60">
                  <span className="flex items-center gap-1">
                    <Battery className="w-3 h-3 text-emerald-600" />
                    <span>Battery {currentAlert.batteryLevel}%</span>
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{currentAlert.timestamp}</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

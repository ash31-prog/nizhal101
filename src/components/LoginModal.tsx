import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  User,
  Building2,
  Shield,
  Phone,
  Smartphone,
  Volume2,
  Navigation,
  Bell,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: 'map' | 'city') => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSelectTab }) => {
  const { loginCitizen, loginOfficial, userProfile, contacts } = useApp();

  const [activeRole, setActiveRole] = useState<'citizen' | 'official'>('citizen');

  // Citizen form
  const [userName, setUserName] = useState(userProfile.name || 'Meera Ramanathan');
  const [userPhone, setUserPhone] = useState(userProfile.phone || '+91 98401 22839');
  const [primaryContactPhone, setPrimaryContactPhone] = useState(
    contacts[0]?.phone || '+91 94441 55621'
  );
  const [permAudio, setPermAudio] = useState(true);
  const [permMotion, setPermMotion] = useState(true);
  const [permLocation, setPermLocation] = useState(true);
  const [permNotifications, setPermNotifications] = useState(true);

  // Official form
  const [officialId, setOfficialId] = useState('GCC-ENG-4910');
  const [dept, setDept] = useState('Greater Chennai Corporation (Electrical Maintenance)');
  const [ward, setWard] = useState('Ward 175 (Thiruvanmiyur & Adyar Corridor)');

  if (!isOpen) return null;

  const handleCitizenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginCitizen({
      name: userName,
      phone: userPhone,
      permissions: {
        audio: permAudio,
        motion: permMotion,
        location: permLocation,
        notifications: permNotifications,
      },
    });
    onSelectTab('map');
    onClose();
  };

  const handleOfficialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginOfficial(officialId, dept);
    onSelectTab('city');
    onClose();
  };

  const handleQuickDemoCitizen = () => {
    loginCitizen({
      name: 'Meera Ramanathan',
      phone: '+91 98401 22839',
      permissions: {
        audio: true,
        motion: true,
        location: true,
        notifications: true,
      },
    });
    onSelectTab('map');
    onClose();
  };

  const handleQuickDemoOfficial = () => {
    loginOfficial('GCC-ENG-4910', 'Greater Chennai Corporation (Electrical Maintenance)');
    onSelectTab('city');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] rounded-3xl border-2 border-orange-500 max-w-lg w-full p-5 sm:p-6 shadow-2xl text-[#2B2118] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-xl hover:bg-stone-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Role Toggle Tabs */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/70 border border-orange-200 text-[#BF360C] text-xs font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>NIZHAL Access Portal</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-[#2B2118] uppercase">
            Select Your Login Type
          </h3>
          <p className="text-xs text-[#6B5B4E]">
            Citizen for Safety Map & SOS, or City Dashboard for Municipal & Transport Authorities
          </p>
        </div>

        {/* Dual Tab Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-1.5 bg-[#F5EFE6] rounded-2xl border border-[#E8DFD1]">
          <button
            onClick={() => setActiveRole('citizen')}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              activeRole === 'citizen'
                ? 'bg-white text-[#E65100] shadow-sm'
                : 'text-[#6B5B4E] hover:text-[#2B2118]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Citizen / User Login</span>
          </button>

          <button
            onClick={() => setActiveRole('official')}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              activeRole === 'official'
                ? 'bg-white text-[#E65100] shadow-sm'
                : 'text-[#6B5B4E] hover:text-[#2B2118]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>City Dashboard Login</span>
          </button>
        </div>

        {/* ROLE 1: CITIZEN LOGIN */}
        {activeRole === 'citizen' && (
          <form onSubmit={handleCitizenSubmit} className="mt-4 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#2B2118] block mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full p-2 bg-white border border-[#E8DFD1] rounded-xl text-xs focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#2B2118] block mb-1">Your Mobile Number</label>
                <input
                  type="tel"
                  required
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="w-full p-2 bg-white border border-[#E8DFD1] rounded-xl text-xs font-mono focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#2B2118] block mb-1">
                Primary Trusted Contact (Direct Call & SMS Target)
              </label>
              <input
                type="tel"
                required
                value={primaryContactPhone}
                onChange={(e) => setPrimaryContactPhone(e.target.value)}
                className="w-full p-2 bg-white border border-[#E8DFD1] rounded-xl text-xs font-mono focus:outline-none focus:border-orange-500 font-medium"
              />
            </div>

            {/* Permissions Enable Section */}
            <div className="p-3 bg-[#F5EFE6] rounded-2xl border border-[#E8DFD1] space-y-2">
              <span className="text-[11px] font-extrabold text-[#2B2118] uppercase tracking-wider block">
                Enable Emergency Permissions:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permAudio}
                    onChange={(e) => setPermAudio(e.target.checked)}
                    className="accent-orange-600 rounded"
                  />
                  <span className="font-semibold text-stone-700 flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-purple-600" /> Voice & Scream
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permMotion}
                    onChange={(e) => setPermMotion(e.target.checked)}
                    className="accent-orange-600 rounded"
                  />
                  <span className="font-semibold text-stone-700 flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-orange-600" /> Shake & Fall
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permLocation}
                    onChange={(e) => setPermLocation(e.target.checked)}
                    className="accent-orange-600 rounded"
                  />
                  <span className="font-semibold text-stone-700 flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-blue-600" /> Satellite GPS
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permNotifications}
                    onChange={(e) => setPermNotifications(e.target.checked)}
                    className="accent-orange-600 rounded"
                  />
                  <span className="font-semibold text-stone-700 flex items-center gap-1">
                    <Bell className="w-3 h-3 text-amber-600" /> Notifications
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-linear-to-r from-[#E65100] to-[#F57C00] hover:from-[#BF360C] hover:to-[#E65100] text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <span>Login & Enter Safety Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleQuickDemoCitizen}
                className="w-full sm:w-auto py-2.5 px-3 bg-white border border-[#E8DFD1] hover:border-orange-500 text-stone-700 font-bold text-xs rounded-xl transition-colors whitespace-nowrap"
              >
                Quick Demo Login
              </button>
            </div>
          </form>
        )}

        {/* ROLE 2: CITY MUNICIPAL DASHBOARD LOGIN */}
        {activeRole === 'official' && (
          <form onSubmit={handleOfficialSubmit} className="mt-4 space-y-3.5">
            <div>
              <label className="text-[11px] font-bold text-[#2B2118] block mb-1">
                Official Badge / Staff ID
              </label>
              <input
                type="text"
                required
                value={officialId}
                onChange={(e) => setOfficialId(e.target.value)}
                className="w-full p-2 bg-white border border-[#E8DFD1] rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#2B2118] block mb-1">
                Department / Authority
              </label>
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="w-full p-2 bg-white border border-[#E8DFD1] rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
              >
                <option>Greater Chennai Corporation (Electrical Maintenance)</option>
                <option>Metropolitan Transport Corporation (MTC Transit Shield)</option>
                <option>Chennai Metro Rail Limited (CMRL Feeder Safety)</option>
                <option>Tamil Nadu Police Emergency Control Room (112 Dispatch)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#2B2118] block mb-1">
                Assigned Jurisdiction / Ward
              </label>
              <input
                type="text"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full p-2 bg-white border border-[#E8DFD1] rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950">
              <span className="font-bold block mb-0.5">Municipal Authority Privileges:</span>
              <p className="text-[11px] leading-relaxed">
                Authorized access to live dark-spot tickets, instant field repair crew dispatch,
                counterfactual street risk models, and incoming emergency distress feeds.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-linear-to-r from-stone-800 to-stone-900 hover:from-stone-900 hover:to-black text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <span>Enter Municipal Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleQuickDemoOfficial}
                className="w-full sm:w-auto py-2.5 px-3 bg-white border border-[#E8DFD1] hover:border-orange-500 text-stone-700 font-bold text-xs rounded-xl transition-colors whitespace-nowrap"
              >
                Quick Official Demo
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

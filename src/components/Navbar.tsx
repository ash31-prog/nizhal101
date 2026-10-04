import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  Shield,
  MapPin,
  Building2,
  Activity,
  Users,
  WifiOff,
  Wifi,
  PhoneCall,
  Volume2,
  Smartphone,
  LogOut,
  Info,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'map' | 'city' | 'sensors' | 'contacts' | 'about';
  setActiveTab: (tab: 'map' | 'city' | 'sensors' | 'contacts' | 'about') => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenLogin }) => {
  const {
    role,
    isLoggedIn,
    isOffline,
    isAudioMonitoring,
    isMotionMonitoring,
    triggerEmergency,
    logout,
    userProfile,
  } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8DFD1] shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('map')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#E65100] to-[#F57C00] flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <Shield className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black tracking-tight text-[#2B2118]">NIZHAL</span>
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-[#FFE082]/60 text-[#BF360C] font-mono">
                    நிழல்
                  </span>
                </div>
                <p className="text-[11px] text-[#6B5B4E] font-medium leading-none">
                  Autonomous Citizen Safety & Municipal Shield
                </p>
              </div>
            </button>

            {/* Offline status badge */}
            <div
              className={`hidden md:flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                isOffline
                  ? 'bg-amber-100/70 border-amber-300 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              {isOffline ? (
                <>
                  <WifiOff className="w-3 h-3 text-amber-700" />
                  <span>Offline GSM Mode Active</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3 h-3 text-emerald-600" />
                  <span>Offline Ready & Synced</span>
                </>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#F5EFE6] p-1 rounded-xl border border-[#E8DFD1]">
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'map'
                  ? 'bg-white text-[#E65100] shadow-xs'
                  : 'text-[#6B5B4E] hover:text-[#2B2118]'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Safety Map & Routes</span>
            </button>

            <button
              onClick={() => setActiveTab('city')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'city'
                  ? 'bg-white text-[#E65100] shadow-xs'
                  : 'text-[#6B5B4E] hover:text-[#2B2118]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>City Municipal Portal</span>
              <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse"></span>
            </button>

            <button
              onClick={() => setActiveTab('sensors')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'sensors'
                  ? 'bg-white text-[#E65100] shadow-xs'
                  : 'text-[#6B5B4E] hover:text-[#2B2118]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Sensors & Lab</span>
              {(isMotionMonitoring || isAudioMonitoring) && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('contacts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'contacts'
                  ? 'bg-white text-[#E65100] shadow-xs'
                  : 'text-[#6B5B4E] hover:text-[#2B2118]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Trusted Contacts</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'about'
                  ? 'bg-white text-[#E65100] shadow-xs'
                  : 'text-[#6B5B4E] hover:text-[#2B2118]'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>How It Works</span>
            </button>
          </nav>

          {/* Active Sensor Badges & Quick SOS Button */}
          <div className="flex items-center gap-2">
            {/* Live sensor indicators */}
            <div className="hidden sm:flex items-center gap-1 bg-[#F5EFE6] px-2 py-1 rounded-lg border border-[#E8DFD1] text-[11px] text-[#6B5B4E]">
              <span
                className={`flex items-center gap-1 ${
                  isMotionMonitoring ? 'text-emerald-700 font-medium' : 'text-stone-400'
                }`}
                title={isMotionMonitoring ? 'Motion active' : 'Motion inactive'}
              >
                <Smartphone className="w-3 h-3" />
                <span>Motion</span>
              </span>
              <span className="text-stone-300">|</span>
              <span
                className={`flex items-center gap-1 ${
                  isAudioMonitoring ? 'text-emerald-700 font-medium' : 'text-stone-400'
                }`}
                title={isAudioMonitoring ? 'Voice listening' : 'Voice inactive'}
              >
                <Volume2 className="w-3 h-3" />
                <span>Voice</span>
              </span>
            </div>

            {/* Quick SOS Trigger Button */}
            <button
              onClick={() => triggerEmergency('manual')}
              className="flex items-center gap-1.5 bg-linear-to-r from-[#D32F2F] to-[#E65100] hover:from-[#B71C1C] hover:to-[#D32F2F] text-white px-3.5 py-1.5 rounded-xl font-bold text-xs tracking-wider shadow-md hover:shadow-red-500/25 active:scale-95 transition-all"
            >
              <PhoneCall className="w-3.5 h-3.5 animate-bounce" />
              <span>SOS ALARM</span>
            </button>

            {/* User / Login Button */}
            {isLoggedIn ? (
              <div className="flex items-center gap-1.5 pl-1">
                <button
                  onClick={onOpenLogin}
                  className="flex items-center gap-1.5 bg-white border border-[#E8DFD1] hover:border-orange-400 text-[#2B2118] px-2.5 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition-all"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="max-w-[85px] sm:max-w-none truncate font-medium">
                    {role === 'official' ? 'Official Portal' : userProfile.name.split(' ')[0]}
                  </span>
                </button>
                <button
                  onClick={logout}
                  title="Switch User / Logout"
                  className="p-1.5 text-stone-500 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="bg-[#E65100] hover:bg-[#BF360C] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex lg:hidden items-center justify-around py-2 border-t border-[#E8DFD1]/60 text-xs">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-1 font-semibold py-1 px-2 rounded-md ${
              activeTab === 'map' ? 'bg-[#FFE082]/60 text-[#BF360C]' : 'text-[#6B5B4E]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Map</span>
          </button>
          <button
            onClick={() => setActiveTab('city')}
            className={`flex items-center gap-1 font-semibold py-1 px-2 rounded-md ${
              activeTab === 'city' ? 'bg-[#FFE082]/60 text-[#BF360C]' : 'text-[#6B5B4E]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>City Portal</span>
          </button>
          <button
            onClick={() => setActiveTab('sensors')}
            className={`flex items-center gap-1 font-semibold py-1 px-2 rounded-md ${
              activeTab === 'sensors' ? 'bg-[#FFE082]/60 text-[#BF360C]' : 'text-[#6B5B4E]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Sensors</span>
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex items-center gap-1 font-semibold py-1 px-2 rounded-md ${
              activeTab === 'contacts' ? 'bg-[#FFE082]/60 text-[#BF360C]' : 'text-[#6B5B4E]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Contacts</span>
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex items-center gap-1 font-semibold py-1 px-2 rounded-md ${
              activeTab === 'about' ? 'bg-[#FFE082]/60 text-[#BF360C]' : 'text-[#6B5B4E]'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Info</span>
          </button>
        </div>
      </div>
    </header>
  );
};

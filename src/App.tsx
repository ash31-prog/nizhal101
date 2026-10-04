import React, { useState } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { Navbar } from '@/components/Navbar';
import { SafetyMap } from '@/components/SafetyMap';
import { RouteSelector } from '@/components/RouteSelector';
import { POIList } from '@/components/POIList';
import { NavigationHUD } from '@/components/NavigationHUD';
import { CityMunicipalDashboard } from '@/components/CityMunicipalDashboard';
import { SensorLab } from '@/components/SensorLab';
import { ContactsSetup } from '@/components/ContactsSetup';
import { HowItWorksModal } from '@/components/HowItWorksModal';
import { EmergencyCountdownModal } from '@/components/EmergencyCountdownModal';
import { LoginModal } from '@/components/LoginModal';
import {
  Shield,
  MapPin,
  Building2,
  Activity,
  Users,
  Info,
  PhoneCall,
  Volume2,
  Smartphone,
  Navigation,
} from 'lucide-react';

const MainShell: React.FC = () => {
  const { role, isNavigating, startNavigation, triggerEmergency, currentRoute } = useApp();
  const [activeTab, setActiveTab] = useState<'map' | 'city' | 'sensors' | 'contacts' | 'about'>('map');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2B2118] flex flex-col font-sans selection:bg-orange-200">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* TAB 1: SAFETY MAP & ROUTES (First view when entering) */}
        {activeTab === 'map' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Quick Status & Mode Summary */}
            <div className="bg-white p-4 rounded-3xl border border-[#E8DFD1] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-[#E65100] shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm sm:text-base font-black text-[#2B2118] uppercase tracking-tight">
                      Chennai Urban Safety Corridor
                    </h1>
                    <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                      Ward 175 Thiruvanmiyur
                    </span>
                  </div>
                  <p className="text-xs text-[#6B5B4E]">
                    Current Route: <strong className="text-[#E65100]">{currentRoute.name}</strong> •{' '}
                    {currentRoute.litPercentage}% Streetlit • {currentRoute.durationMinutes} min
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('city')}
                  className="px-3 py-1.5 rounded-xl bg-[#F5EFE6] hover:bg-[#E8DFD1] text-[#2B2118] text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5 text-stone-600" />
                  <span>City Portal</span>
                </button>

                <button
                  onClick={() => setActiveTab('sensors')}
                  className="px-3 py-1.5 rounded-xl bg-[#F5EFE6] hover:bg-[#E8DFD1] text-[#2B2118] text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5 text-stone-600" />
                  <span>Sensors Lab</span>
                </button>
              </div>
            </div>

            {/* Interactive Safety Map Canvas */}
            <SafetyMap onStartNavigation={startNavigation} />

            {/* 4 Route Comparison Options */}
            <RouteSelector onStartNavigation={startNavigation} />

            {/* Nearby Verified Shops & Safe Havens */}
            <POIList onStartNavigation={startNavigation} />
          </div>
        )}

        {/* TAB 2: CITY MUNICIPAL DASHBOARD */}
        {activeTab === 'city' && (
          <div className="animate-in fade-in duration-300">
            <CityMunicipalDashboard />
          </div>
        )}

        {/* TAB 3: SENSOR LAB & LIVE DSP GAUGES */}
        {activeTab === 'sensors' && (
          <div className="animate-in fade-in duration-300">
            <SensorLab />
          </div>
        )}

        {/* TAB 4: TRUSTED CONTACTS & PERMISSIONS */}
        {activeTab === 'contacts' && (
          <div className="animate-in fade-in duration-300">
            <ContactsSetup />
          </div>
        )}

        {/* TAB 5: HOW IT WORKS / ABOUT */}
        {activeTab === 'about' && (
          <div className="animate-in fade-in duration-300">
            <HowItWorksModal />
          </div>
        )}
      </main>

      {/* Turn-by-Turn Navigation HUD (Floats above when navigating) */}
      <NavigationHUD />

      {/* Emergency Countdown & Escalation Modal (Floats when alert triggered) */}
      <EmergencyCountdownModal />

      {/* Dual Login Modal (Citizen vs Municipal) */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSelectTab={(tab) => setActiveTab(tab)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-[#E8DFD1] bg-[#F5EFE6] text-[#6B5B4E] py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#E65100] text-white flex items-center justify-center font-bold text-xs">
              நி
            </div>
            <div>
              <span className="font-extrabold text-[#2B2118]">NIZHAL (நிழல்)</span>
              <span className="mx-1.5 text-stone-400">•</span>
              <span>Safer Urban Mobility for Women & Vulnerable Citizens</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-medium">
            <span>Offline-First PWA</span>
            <span>•</span>
            <span>O(1) 60Hz DSP</span>
            <span>•</span>
            <span>Zero Cloud Surveillance</span>
            <span>•</span>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="text-[#E65100] font-bold hover:underline"
            >
              Switch Role / Sign In
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainShell />
    </AppProvider>
  );
}

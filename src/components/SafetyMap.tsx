import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { POI, RouteOption, StreetSegment } from '@/types';
import {
  Shield,
  Zap,
  Compass,
  AlertTriangle,
  Lightbulb,
  LightbulbOff,
  Navigation,
  Store,
  Cross,
  Plus,
  Minus,
  Maximize2,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface SafetyMapProps {
  onStartNavigation: () => void;
}

export const SafetyMap: React.FC<SafetyMapProps> = ({ onStartNavigation }) => {
  const {
    currentRoute,
    availableRoutes,
    selectRoute,
    pois,
    selectedPOI,
    setSelectedPOI,
    navigateToPOI,
    userLocation,
    streetSegments,
    isNavigating,
    stopNavigation,
  } = useApp();

  const [zoom, setZoom] = useState<number>(1);
  const [showLights, setShowLights] = useState<boolean>(true);
  const [showDarkSpots, setShowDarkSpots] = useState<boolean>(true);
  const [showPOIs, setShowPOIs] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'normal' | 'night' | 'risk'>('normal');

  // SVG coordinates helper
  const svgWidth = 800;
  const svgHeight = 600;

  const handleRouteSelect = (r: RouteOption) => {
    selectRoute(r.id);
  };

  const getRouteStrokeColor = (mode: RouteOption['mode'], isSelected: boolean) => {
    if (!isSelected) return 'rgba(180, 160, 140, 0.35)';
    switch (mode) {
      case 'safest':
        return '#2E7D32'; // Deep Green
      case 'fastest':
        return '#1565C0'; // Royal Blue
      case 'moderate':
        return '#F57C00'; // Vibrant Orange
      case 'dangerous':
        return '#D32F2F'; // Danger Crimson
    }
  };

  const getRouteGlowColor = (mode: RouteOption['mode']) => {
    switch (mode) {
      case 'safest':
        return 'rgba(46, 125, 50, 0.4)';
      case 'fastest':
        return 'rgba(21, 101, 192, 0.4)';
      case 'moderate':
        return 'rgba(245, 124, 0, 0.4)';
      case 'dangerous':
        return 'rgba(211, 47, 47, 0.5)';
    }
  };

  const formatPointsString = (coords: [number, number][]) => {
    return coords.map((pt) => `${pt[0]},${pt[1]}`).join(' ');
  };

  return (
    <div className="relative w-full h-[580px] sm:h-[640px] rounded-3xl overflow-hidden border-2 border-[#E8DFD1] bg-[#F7F2EA] shadow-lg select-none">
      {/* MAP LAYER CONTROLS (Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-white/95 backdrop-blur-md p-2 rounded-2xl border border-[#E8DFD1] shadow-md">
        <div className="flex items-center gap-1.5 pb-1 border-b border-stone-200">
          <button
            onClick={() => setZoom((prev) => Math.min(prev + 0.2, 1.8))}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-700 font-bold"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono font-bold text-stone-600 px-1">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((prev) => Math.max(prev - 0.2, 0.8))}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-700 font-bold"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Layer Toggles */}
        <div className="flex flex-col gap-1 text-[11px] pt-1">
          <button
            onClick={() => setShowLights(!showLights)}
            className={`flex items-center justify-between gap-2 px-2 py-1 rounded-lg font-semibold transition-all ${
              showLights ? 'bg-amber-100/70 text-amber-900' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <span className="flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
              <span>Streetlights</span>
            </span>
            <span className="text-[10px]">{showLights ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setShowDarkSpots(!showDarkSpots)}
            className={`flex items-center justify-between gap-2 px-2 py-1 rounded-lg font-semibold transition-all ${
              showDarkSpots ? 'bg-red-100/70 text-red-900' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <span className="flex items-center gap-1">
              <LightbulbOff className="w-3.5 h-3.5 text-red-600" />
              <span>Dark Spots</span>
            </span>
            <span className="text-[10px]">{showDarkSpots ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setShowPOIs(!showPOIs)}
            className={`flex items-center justify-between gap-2 px-2 py-1 rounded-lg font-semibold transition-all ${
              showPOIs ? 'bg-orange-100/70 text-orange-900' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <span className="flex items-center gap-1">
              <Store className="w-3.5 h-3.5 text-orange-600" />
              <span>Shops & Havens</span>
            </span>
            <span className="text-[10px]">{showPOIs ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* ROUTE COMPARISON SELECTOR PILLS (Top Left) */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-1.5 max-w-sm sm:max-w-md">
        {availableRoutes.map((r) => {
          const isSelected = currentRoute.id === r.id;
          return (
            <button
              key={r.id}
              onClick={() => handleRouteSelect(r)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                isSelected
                  ? r.mode === 'safest'
                    ? 'bg-emerald-700 text-white ring-2 ring-emerald-300'
                    : r.mode === 'fastest'
                    ? 'bg-blue-700 text-white ring-2 ring-blue-300'
                    : r.mode === 'moderate'
                    ? 'bg-orange-600 text-white ring-2 ring-orange-300'
                    : 'bg-red-700 text-white ring-2 ring-red-400 animate-pulse'
                  : 'bg-white/95 text-stone-700 hover:bg-white border border-[#E8DFD1]'
              }`}
            >
              {r.mode === 'safest' && <Shield className="w-3.5 h-3.5 text-emerald-300" />}
              {r.mode === 'fastest' && <Zap className="w-3.5 h-3.5 text-blue-300" />}
              {r.mode === 'moderate' && <Compass className="w-3.5 h-3.5 text-orange-300" />}
              {r.mode === 'dangerous' && <AlertTriangle className="w-3.5 h-3.5 text-red-300" />}
              <span>{r.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-black/20 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                {r.durationMinutes}m ({r.distanceKm}km)
              </span>
            </button>
          );
        })}
      </div>

      {/* SVG INTERACTIVE CITY MAP CANVAS */}
      <div className="w-full h-full overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full transition-transform duration-300"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Background Map Grid */}
          <defs>
            <pattern id="cityGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="40" height="40" fill="#F8F3EA" />
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#EAE0D0" strokeWidth="0.8" />
            </pattern>

            {/* Glowing filter for safe path */}
            <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#2E7D32" floodOpacity="0.6" />
            </filter>
            <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#D32F2F" floodOpacity="0.7" />
            </filter>
            <filter id="glowOrange" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#F57C00" floodOpacity="0.5" />
            </filter>
            <filter id="glowBlue" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#1565C0" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Grid Background */}
          <rect width={svgWidth} height={svgHeight} fill="url(#cityGrid)" />

          {/* City Parks / Safe Zones (Green Spaces) */}
          <rect x="520" y="400" width="160" height="110" rx="16" fill="#E8F5E9" stroke="#C8E6C9" strokeWidth="1.5" />
          <text x="540" y="450" fill="#2E7D32" fontSize="11" fontWeight="bold" opacity="0.8">
            Gandhi Peace Park
          </text>
          <text x="540" y="465" fill="#388E3C" fontSize="9">
            24/7 Patrolled Perimeter
          </text>

          {/* Dark / Risk Zone Overlay (Unlit Canal Margin) */}
          <rect
            x="200"
            y="230"
            width="280"
            height="90"
            rx="12"
            fill="rgba(211, 47, 47, 0.08)"
            stroke="rgba(211, 47, 47, 0.25)"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />
          <text x="215" y="255" fill="#C62828" fontSize="10" fontWeight="bold">
            HIGH DANGER CORRIDOR: 28 Non-Working Lamps
          </text>
          <text x="215" y="270" fill="#D32F2F" fontSize="8.5">
            Avoid canal back lanes after 8:00 PM
          </text>

          {/* ALL STREET SEGMENTS */}
          {streetSegments.map((seg) => {
            const isAlley = seg.roadClass === 'alley';
            return (
              <g key={seg.id}>
                {/* Road Casing */}
                <line
                  x1={seg.x1}
                  y1={seg.y1}
                  x2={seg.x2}
                  y2={seg.y2}
                  stroke={isAlley ? '#D7CCC8' : '#FFFFFF'}
                  strokeWidth={isAlley ? 8 : 14}
                  strokeLinecap="round"
                />
                {/* Road Surface */}
                <line
                  x1={seg.x1}
                  y1={seg.y1}
                  x2={seg.x2}
                  y2={seg.y2}
                  stroke={
                    seg.isLit
                      ? '#FFE082' // Illuminated amber/gold
                      : '#EF9A9A' // Unlit red
                  }
                  strokeWidth={isAlley ? 4 : 8}
                  strokeDasharray={isAlley ? '6 3' : 'none'}
                  strokeLinecap="round"
                  opacity={0.85}
                />
                {/* Street Name Label */}
                <text
                  x={(seg.x1 + seg.x2) / 2}
                  y={(seg.y1 + seg.y2) / 2 - 8}
                  fill="#5D4037"
                  fontSize="8.5"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {seg.name}
                </text>
              </g>
            );
          })}

          {/* STREETLIGHT POLES & DARK SPOTS */}
          {showLights &&
            streetSegments.map((seg, idx) => {
              const count = seg.streetLightsCount;
              const working = seg.streetLightsWorking;
              const pts = [];
              for (let i = 1; i <= Math.min(count, 5); i++) {
                const ratio = i / (Math.min(count, 5) + 1);
                const lx = seg.x1 + (seg.x2 - seg.x1) * ratio;
                const ly = seg.y1 + (seg.y2 - seg.y1) * ratio;
                const isWorking = i <= Math.ceil((working / count) * Math.min(count, 5));
                pts.push({ lx, ly, isWorking, id: `${seg.id}-lamp-${i}` });
              }

              return pts.map((lamp) => {
                if (!lamp.isWorking && !showDarkSpots) return null;
                return (
                  <g key={lamp.id}>
                    {lamp.isWorking ? (
                      <>
                        <circle cx={lamp.lx} cy={lamp.ly} r="6" fill="#FFF9C4" opacity="0.6" />
                        <circle cx={lamp.lx} cy={lamp.ly} r="2.5" fill="#FBC02D" />
                      </>
                    ) : (
                      <>
                        <circle cx={lamp.lx} cy={lamp.ly} r="5" fill="#FFCDD2" opacity="0.8" />
                        <circle cx={lamp.lx} cy={lamp.ly} r="2.5" fill="#D32F2F" />
                        <line
                          x1={lamp.lx - 3}
                          y1={lamp.ly - 3}
                          x2={lamp.lx + 3}
                          y2={lamp.ly + 3}
                          stroke="#B71C1C"
                          strokeWidth="1.2"
                        />
                      </>
                    )}
                  </g>
                );
              });
            })}

          {/* THE 4 ROUTES (Drawn above base roads) */}
          {availableRoutes.map((r) => {
            const isSelected = currentRoute.id === r.id;
            const pts = formatPointsString(r.pathCoordinates);
            const filterId =
              r.mode === 'safest'
                ? 'url(#glowGreen)'
                : r.mode === 'fastest'
                ? 'url(#glowBlue)'
                : r.mode === 'moderate'
                ? 'url(#glowOrange)'
                : 'url(#glowRed)';

            return (
              <g key={r.id}>
                {isSelected && (
                  <polyline
                    points={pts}
                    fill="none"
                    stroke={getRouteStrokeColor(r.mode, true)}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={filterId}
                    opacity="0.45"
                  />
                )}

                <polyline
                  points={pts}
                  fill="none"
                  stroke={getRouteStrokeColor(r.mode, isSelected)}
                  strokeWidth={isSelected ? (r.mode === 'dangerous' ? 6 : 7) : 3}
                  strokeDasharray={
                    r.mode === 'dangerous'
                      ? '8 4'
                      : isSelected && isNavigating
                      ? '12 6'
                      : 'none'
                  }
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={isSelected && isNavigating ? 'animate-pulse' : ''}
                />
              </g>
            );
          })}

          {/* USER START PIN (Thiruvanmiyur Bus Stand) */}
          <g transform={`translate(${userLocation.x}, ${userLocation.y})`}>
            {/* Beacon Pulse */}
            <circle cx="0" cy="0" r="18" fill="rgba(230, 81, 0, 0.25)" className="animate-ping" />
            <circle cx="0" cy="0" r="9" fill="#E65100" stroke="#FFFFFF" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="3.5" fill="#FFFFFF" />
            <text x="14" y="4" fill="#2B2118" fontSize="10.5" fontWeight="bold">
              You ({userLocation.address.split(' ')[0]})
            </text>
          </g>

          {/* DESTINATION PIN (Besant Nagar Home) */}
          <g transform="translate(660, 120)">
            <circle cx="0" cy="0" r="14" fill="rgba(46, 125, 50, 0.3)" />
            <circle cx="0" cy="0" r="8" fill="#2E7D32" stroke="#FFFFFF" strokeWidth="2" />
            <text x="12" y="4" fill="#1B5E20" fontSize="10.5" fontWeight="bold">
              Home (Besant Nagar)
            </text>
          </g>

          {/* POI PINS (Shops, Safe Shelters, Pharmacies, Police) */}
          {showPOIs &&
            pois.map((poi) => {
              const isSelected = selectedPOI?.id === poi.id;
              const pinColor = poi.isOpen ? (poi.category === 'police' ? '#1565C0' : poi.category === 'pharmacy' ? '#2E7D32' : '#F57C00') : '#9E9E9E';

              return (
                <g
                  key={poi.id}
                  transform={`translate(${poi.x}, ${poi.y})`}
                  className="cursor-pointer transition-transform hover:scale-125"
                  onClick={() => setSelectedPOI(poi)}
                >
                  <circle cx="0" cy="0" r={isSelected ? 14 : 10} fill={pinColor} stroke="#FFFFFF" strokeWidth="2" />
                  {poi.category === 'pharmacy' && <text x="-4" y="3.5" fill="#FFFFFF" fontSize="9" fontWeight="bold">+</text>}
                  {poi.category === 'police' && <text x="-3.5" y="3.5" fill="#FFFFFF" fontSize="8" fontWeight="bold">P</text>}
                  {poi.category === 'store' && <text x="-3.5" y="3.5" fill="#FFFFFF" fontSize="8" fontWeight="bold">S</text>}
                  {poi.category === 'shelter' && <text x="-3.5" y="3.5" fill="#FFFFFF" fontSize="8" fontWeight="bold">H</text>}

                  {/* Quick label */}
                  <text
                    x="12"
                    y="3"
                    fill={poi.isOpen ? '#2B2118' : '#757575'}
                    fontSize="9"
                    fontWeight="bold"
                    className="pointer-events-none"
                  >
                    {poi.name.split(' ')[0]} {poi.isOpen ? '🟢' : '🔴'}
                  </text>
                </g>
              );
            })}
        </svg>
      </div>

      {/* SELECTED POI CARD POPUP (Shows Open/Close, Distance, Time, and Navigate action) */}
      {selectedPOI && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:max-w-md z-30 bg-white/95 backdrop-blur-md rounded-2xl border-2 border-orange-400 p-4 shadow-xl text-[#2B2118] animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shrink-0 ${
                  selectedPOI.isOpen ? 'bg-emerald-600' : 'bg-stone-500'
                }`}
              >
                {selectedPOI.category === 'pharmacy' && '+' }
                {selectedPOI.category === 'police' && 'P' }
                {selectedPOI.category === 'hospital' && 'H' }
                {selectedPOI.category === 'store' && 'S' }
                {selectedPOI.category === 'shelter' && '🛡️' }
                {selectedPOI.category === 'station' && 'M' }
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#2B2118] leading-tight">
                  {selectedPOI.name}
                </h4>
                <p className="text-[11px] text-[#6B5B4E]">{selectedPOI.address}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedPOI(null)}
              className="text-stone-400 hover:text-stone-700 text-sm font-bold p-1"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-[#E8DFD1]/70 text-center">
            {/* Open / Close status */}
            <div className="bg-[#F5EFE6] p-1.5 rounded-xl">
              <span className="text-[10px] text-stone-500 uppercase font-bold block">Status</span>
              <span
                className={`text-xs font-black flex items-center justify-center gap-1 ${
                  selectedPOI.isOpen ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {selectedPOI.isOpen ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span>OPEN</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 text-red-600" />
                    <span>CLOSED</span>
                  </>
                )}
              </span>
            </div>

            {/* Distance in km */}
            <div className="bg-[#F5EFE6] p-1.5 rounded-xl">
              <span className="text-[10px] text-stone-500 uppercase font-bold block">Distance</span>
              <span className="text-xs font-black text-[#2B2118] font-mono">
                {selectedPOI.distanceKm} km
              </span>
            </div>

            {/* Time in minutes */}
            <div className="bg-[#F5EFE6] p-1.5 rounded-xl">
              <span className="text-[10px] text-stone-500 uppercase font-bold block">Walk Time</span>
              <span className="text-xs font-black text-[#2B2118] font-mono flex items-center justify-center gap-0.5">
                <Clock className="w-3 h-3 text-orange-600" />
                <span>{selectedPOI.walkingTimeMinutes} min</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => {
                navigateToPOI(selectedPOI);
                onStartNavigation();
              }}
              className="flex-1 py-2 px-3 bg-linear-to-r from-[#E65100] to-[#F57C00] hover:from-[#BF360C] hover:to-[#E65100] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Navigate to This Safe Point</span>
            </button>

            {selectedPOI.phone && (
              <a
                href={`tel:${selectedPOI.phone.replace(/[^\d+]/g, '')}`}
                className="py-2 px-3 bg-white border border-[#E8DFD1] hover:border-orange-500 text-stone-800 font-bold text-xs rounded-xl transition-colors"
                title="Call Facility"
              >
                Call
              </a>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM FLOATING ROUTE SUMMARY & NAVIGATION START */}
      {!selectedPOI && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-[#E8DFD1] p-3.5 shadow-xl text-[#2B2118]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${
                  currentRoute.mode === 'safest'
                    ? 'bg-emerald-700'
                    : currentRoute.mode === 'fastest'
                    ? 'bg-blue-700'
                    : currentRoute.mode === 'moderate'
                    ? 'bg-orange-600'
                    : 'bg-red-700'
                }`}
              >
                {currentRoute.mode === 'safest' && <Shield className="w-4 h-4" />}
                {currentRoute.mode === 'fastest' && <Zap className="w-4 h-4" />}
                {currentRoute.mode === 'moderate' && <Compass className="w-4 h-4" />}
                {currentRoute.mode === 'dangerous' && <AlertTriangle className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-black uppercase text-[#2B2118]">
                  {currentRoute.name}
                </span>
                <p className="text-[11px] text-[#6B5B4E] font-medium leading-none">
                  {currentRoute.litPercentage}% Streetlit • {currentRoute.unlitMeters}m unlit
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-sm font-black text-orange-800 font-mono">
                {currentRoute.durationMinutes} min
              </span>
              <p className="text-[10px] text-stone-500 font-mono">
                {currentRoute.distanceKm} km
              </p>
            </div>
          </div>

          <p className="text-[11.5px] text-[#6B5B4E] mt-2 line-clamp-2 leading-relaxed">
            {currentRoute.description}
          </p>

          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#E8DFD1]/60">
            {isNavigating ? (
              <button
                onClick={stopNavigation}
                className="w-full py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-xl transition-all"
              >
                Stop Guided Navigation
              </button>
            ) : (
              <button
                onClick={onStartNavigation}
                className="w-full py-2 px-4 bg-linear-to-r from-[#E65100] to-[#F57C00] hover:from-[#BF360C] hover:to-[#E65100] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Start Live Navigation ({currentRoute.durationMinutes} min)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

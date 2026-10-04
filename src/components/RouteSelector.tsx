import React from 'react';
import { useApp } from '@/context/AppContext';
import { RouteOption } from '@/types';
import {
  Shield,
  Zap,
  Compass,
  AlertTriangle,
  Lightbulb,
  Clock,
  Navigation,
  Store,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';

interface RouteSelectorProps {
  onStartNavigation: () => void;
}

export const RouteSelector: React.FC<RouteSelectorProps> = ({ onStartNavigation }) => {
  const { currentRoute, availableRoutes, selectRoute, isNavigating, stopNavigation } = useApp();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-[#2B2118] tracking-tight uppercase flex items-center gap-1.5">
            <span>Route Safety Comparison</span>
            <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-1.5 py-0.2 rounded-md">
              4 Choices
            </span>
          </h3>
          <p className="text-xs text-[#6B5B4E]">
            Evaluated by streetlamp density, frontage of open shops, and CCTV coverage
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {availableRoutes.map((route) => {
          const isSelected = currentRoute.id === route.id;
          const isDangerous = route.mode === 'dangerous';
          const isSafest = route.mode === 'safest';

          return (
            <div
              key={route.id}
              onClick={() => selectRoute(route.id)}
              className={`relative cursor-pointer rounded-2xl p-4 transition-all border-2 text-[#2B2118] flex flex-col justify-between ${
                isSelected
                  ? isDangerous
                    ? 'bg-red-50/80 border-red-600 shadow-md ring-2 ring-red-400/40'
                    : isSafest
                    ? 'bg-emerald-50/90 border-emerald-600 shadow-md ring-2 ring-emerald-400/40'
                    : 'bg-white border-[#E65100] shadow-md ring-2 ring-orange-300'
                  : 'bg-white/80 border-[#E8DFD1] hover:border-orange-300 hover:bg-white'
              }`}
            >
              {/* Badge for Safest / Danger */}
              {isSafest && (
                <div className="absolute -top-2.5 left-4 bg-emerald-700 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>Recommended Safe</span>
                </div>
              )}
              {isDangerous && (
                <div className="absolute -top-2.5 left-4 bg-red-700 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1 animate-pulse">
                  <AlertOctagon className="w-3 h-3" />
                  <span>High Danger (Avoid)</span>
                </div>
              )}

              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-1 pt-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 ${
                        route.mode === 'safest'
                          ? 'bg-emerald-700'
                          : route.mode === 'fastest'
                          ? 'bg-blue-700'
                          : route.mode === 'moderate'
                          ? 'bg-orange-600'
                          : 'bg-red-700'
                      }`}
                    >
                      {route.mode === 'safest' && <Shield className="w-3.5 h-3.5" />}
                      {route.mode === 'fastest' && <Zap className="w-3.5 h-3.5" />}
                      {route.mode === 'moderate' && <Compass className="w-3.5 h-3.5" />}
                      {route.mode === 'dangerous' && <AlertTriangle className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#2B2118] uppercase">
                        {route.name}
                      </h4>
                      <p className="text-[10.5px] text-[#6B5B4E] leading-none">
                        {route.title}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        isDangerous ? 'text-red-600' : isSafest ? 'text-emerald-700' : 'text-orange-600'
                      }`}
                    />
                  )}
                </div>

                {/* Metrics: Time & Distance */}
                <div className="flex items-baseline justify-between mt-3 py-2 px-2.5 rounded-xl bg-[#F5EFE6]">
                  <div className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-orange-700" />
                    <span className="text-sm font-black text-[#2B2118]">
                      {route.durationMinutes} min
                    </span>
                  </div>
                  <span className="text-xs font-bold text-stone-600 font-mono">
                    {route.distanceKm} km
                  </span>
                  <div
                    className={`text-[11px] font-black px-1.5 py-0.5 rounded-md ${
                      route.safetyScore >= 85
                        ? 'bg-emerald-100 text-emerald-900'
                        : route.safetyScore >= 65
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-red-100 text-red-900'
                    }`}
                  >
                    Safety {route.safetyScore}/100
                  </div>
                </div>

                {/* Streetlight & Unlit Stretch */}
                <div className="mt-2.5 space-y-1 text-xs text-[#6B5B4E]">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1">
                      <Lightbulb
                        className={`w-3 h-3 ${isDangerous ? 'text-red-600' : 'text-amber-600'}`}
                      />
                      <span>Streetlights:</span>
                    </span>
                    <span className="font-bold text-[#2B2118]">
                      {route.litPercentage}% Lit
                    </span>
                  </div>

                  {/* Progress bar of lighting */}
                  <div className="w-full h-1.5 rounded-full bg-stone-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isDangerous
                          ? 'bg-red-600'
                          : route.litPercentage > 90
                          ? 'bg-emerald-600'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${route.litPercentage}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[10.5px] pt-1">
                    <span className="text-stone-500">Unlit Pitch Dark:</span>
                    <span
                      className={`font-mono font-bold ${
                        route.unlitMeters > 0 ? 'text-red-700' : 'text-emerald-700'
                      }`}
                    >
                      {route.unlitMeters === 0 ? '0 meters (None)' : `${route.unlitMeters} meters`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="flex items-center gap-1 text-stone-500">
                      <Store className="w-2.5 h-2.5" />
                      <span>Open shops:</span>
                    </span>
                    <span className="font-mono font-bold text-[#2B2118]">
                      {route.openShopsCount} open
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-[#6B5B4E] mt-2 line-clamp-2 italic leading-snug">
                  {route.description}
                </p>
              </div>

              {/* Action */}
              <div className="mt-3 pt-2 border-t border-[#E8DFD1]/60">
                {isSelected ? (
                  isNavigating ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        stopNavigation();
                      }}
                      className="w-full py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-lg transition-colors"
                    >
                      Stop
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartNavigation();
                      }}
                      className={`w-full py-1.5 text-white font-black text-xs rounded-lg shadow-xs flex items-center justify-center gap-1 transition-all ${
                        isDangerous
                          ? 'bg-red-700 hover:bg-red-800'
                          : isSafest
                          ? 'bg-emerald-700 hover:bg-emerald-800'
                          : 'bg-[#E65100] hover:bg-[#BF360C]'
                      }`}
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Navigate Route</span>
                    </button>
                  )
                ) : (
                  <button className="w-full py-1.5 text-[#6B5B4E] hover:text-[#2B2118] text-xs font-bold rounded-lg border border-[#E8DFD1] hover:bg-stone-50 transition-colors">
                    Select
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

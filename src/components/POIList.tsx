import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { POI } from '@/types';
import {
  Store,
  Clock,
  Navigation,
  Phone,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
} from 'lucide-react';

interface POIListProps {
  onStartNavigation: () => void;
}

export const POIList: React.FC<POIListProps> = ({ onStartNavigation }) => {
  const { pois, setSelectedPOI, navigateToPOI } = useApp();
  const [filter, setFilter] = useState<'all' | 'open' | 'pharmacy' | 'police' | 'shelter'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredPois = pois.filter((poi) => {
    if (filter === 'open' && !poi.isOpen) return false;
    if (filter === 'pharmacy' && poi.category !== 'pharmacy') return false;
    if (filter === 'police' && poi.category !== 'police') return false;
    if (filter === 'shelter' && !poi.isSafeShelter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        poi.name.toLowerCase().includes(q) ||
        poi.address.toLowerCase().includes(q) ||
        poi.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-[#2B2118] uppercase tracking-tight flex items-center gap-2">
            <Store className="w-4 h-4 text-orange-600" />
            <span>Nearby Verified Shops & Safe Havens</span>
          </h3>
          <p className="text-xs text-[#6B5B4E]">
            Real-time open/closed status, walking distance in km, and 1-click safety navigation
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search 24/7 shops, pharmacy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 bg-white border border-[#E8DFD1] rounded-xl text-xs text-[#2B2118] placeholder-stone-400 focus:outline-none focus:border-orange-500 w-full sm:w-60 shadow-2xs"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
            filter === 'all'
              ? 'bg-[#E65100] text-white shadow-xs'
              : 'bg-white border border-[#E8DFD1] text-[#6B5B4E] hover:text-[#2B2118]'
          }`}
        >
          All ({pois.length})
        </button>
        <button
          onClick={() => setFilter('open')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
            filter === 'open'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white border border-[#E8DFD1] text-[#6B5B4E] hover:text-[#2B2118]'
          }`}
        >
          Open Now ({pois.filter((p) => p.isOpen).length})
        </button>
        <button
          onClick={() => setFilter('pharmacy')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
            filter === 'pharmacy'
              ? 'bg-[#E65100] text-white shadow-xs'
              : 'bg-white border border-[#E8DFD1] text-[#6B5B4E] hover:text-[#2B2118]'
          }`}
        >
          24/7 Medical
        </button>
        <button
          onClick={() => setFilter('police')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
            filter === 'police'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-white border border-[#E8DFD1] text-[#6B5B4E] hover:text-[#2B2118]'
          }`}
        >
          Police & Women Helpdesk
        </button>
        <button
          onClick={() => setFilter('shelter')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
            filter === 'shelter'
              ? 'bg-[#E65100] text-white shadow-xs'
              : 'bg-white border border-[#E8DFD1] text-[#6B5B4E] hover:text-[#2B2118]'
          }`}
        >
          Verified Havens
        </button>
      </div>

      {/* POI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredPois.map((poi) => (
          <div
            key={poi.id}
            className={`rounded-2xl border-2 p-4 transition-all bg-white flex flex-col justify-between ${
              poi.isOpen
                ? 'border-[#E8DFD1] hover:border-orange-400 hover:shadow-md'
                : 'border-stone-200 opacity-80 bg-stone-50/70'
            }`}
          >
            <div>
              {/* Header: Name, Verified Badge & Category */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-black text-[#2B2118] uppercase leading-snug">
                    {poi.name}
                  </h4>
                  <p className="text-[11px] text-[#6B5B4E] mt-0.5 line-clamp-1">{poi.address}</p>
                </div>
                {poi.isSafeShelter && (
                  <span
                    className="shrink-0 p-1 rounded-lg bg-orange-100 text-orange-800"
                    title="Verified Safe Shelter"
                  >
                    <ShieldCheck className="w-4 h-4 text-orange-700" />
                  </span>
                )}
              </div>

              {/* Status & Timing Metrics */}
              <div className="grid grid-cols-3 gap-1.5 mt-3 py-2 px-2.5 rounded-xl bg-[#F5EFE6] text-center">
                {/* Open / Close Badge */}
                <div>
                  <span className="text-[9.5px] font-bold text-stone-500 uppercase block">
                    Status
                  </span>
                  <span
                    className={`text-[11px] font-black flex items-center justify-center gap-0.5 ${
                      poi.isOpen ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {poi.isOpen ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
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
                <div>
                  <span className="text-[9.5px] font-bold text-stone-500 uppercase block">
                    Distance
                  </span>
                  <span className="text-xs font-black text-[#2B2118] font-mono">
                    {poi.distanceKm} km
                  </span>
                </div>

                {/* Walking Time in mins */}
                <div>
                  <span className="text-[9.5px] font-bold text-stone-500 uppercase block">
                    Time
                  </span>
                  <span className="text-xs font-black text-orange-800 font-mono flex items-center justify-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{poi.walkingTimeMinutes} min</span>
                  </span>
                </div>
              </div>

              {/* Hours details and description */}
              <div className="mt-2 text-[11px] text-[#6B5B4E] space-y-1">
                <p className="font-semibold text-stone-700">Hours: {poi.hours}</p>
                <p className="line-clamp-2 italic text-stone-500">{poi.description}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[#E8DFD1]/60">
              <button
                onClick={() => {
                  navigateToPOI(poi);
                  onStartNavigation();
                }}
                className={`flex-1 py-1.5 px-2.5 rounded-xl font-black text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all ${
                  poi.isOpen
                    ? 'bg-linear-to-r from-[#E65100] to-[#F57C00] hover:from-[#BF360C] hover:to-[#E65100] text-white active:scale-95'
                    : 'bg-stone-300 text-stone-700'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Navigate ({poi.walkingTimeMinutes}m)</span>
              </button>

              {poi.phone && (
                <a
                  href={`tel:${poi.phone.replace(/[^\d+]/g, '')}`}
                  className="p-1.5 bg-white border border-[#E8DFD1] hover:border-orange-500 text-stone-700 rounded-xl transition-colors"
                  title={`Call ${poi.phone}`}
                >
                  <Phone className="w-3.5 h-3.5 text-stone-600" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

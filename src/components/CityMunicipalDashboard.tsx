import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { MunicipalTicket } from '@/types';
import {
  Building2,
  Lightbulb,
  LightbulbOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
  Plus,
  Radio,
  FileText,
  TrendingDown,
  PhoneCall,
  BellRing,
  Wrench,
  Sparkles,
  Shield,
} from 'lucide-react';

export const CityMunicipalDashboard: React.FC = () => {
  const { tickets, dispatchTicket, addTicket, streetSegments, recentDispatches } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'tickets' | 'segments' | 'feed'>('tickets');
  const [showNewTicketModal, setShowNewTicketModal] = useState<boolean>(false);
  const [dispatchToast, setDispatchToast] = useState<string | null>(null);

  // New ticket form state
  const [formWard, setFormWard] = useState('Ward 175 (Thiruvanmiyur)');
  const [formLocation, setFormLocation] = useState('');
  const [formReason, setFormReason] = useState('');
  const [formLamps, setFormLamps] = useState(6);
  const [formPriority, setFormPriority] = useState<'critical' | 'high' | 'medium'>('critical');

  const handleDispatch = (ticket: MunicipalTicket) => {
    dispatchTicket(ticket.id, 'Rapid Electrical Crew Unit #2 (Vehicle TN-07-G-4412)');
    setDispatchToast(`Repair Crew Dispatched to ${ticket.locationName}! Field notification broadcasted.`);
    setTimeout(() => setDispatchToast(null), 4500);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLocation) return;

    addTicket({
      title: `${formLamps} Streetlights Out at ${formLocation}`,
      ward: formWard,
      locationName: formLocation,
      lat: 12.9815,
      lng: 80.2545,
      reason: formReason || 'Reported by municipal safety sensor audit.',
      priority: formPriority,
      fixedLampsNeeded: Number(formLamps),
      riskReductionScore: Math.round(formLamps * 3.8),
    });

    setShowNewTicketModal(false);
    setFormLocation('');
    setFormReason('');
    setDispatchToast('New dark spot logged into Municipal Corporation central queue.');
    setTimeout(() => setDispatchToast(null), 4000);
  };

  // Metrics
  const totalLampsNeeded = tickets
    .filter((t) => t.status === 'open')
    .reduce((acc, t) => acc + t.fixedLampsNeeded, 0);

  const totalRiskPointsOpen = tickets
    .filter((t) => t.status === 'open')
    .reduce((acc, t) => acc + t.riskReductionScore, 0);

  return (
    <div className="space-y-6 text-[#2B2118]">
      {/* Toast Notification Banner */}
      {dispatchToast && (
        <div className="bg-linear-to-r from-emerald-600 to-teal-700 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 animate-bounce" />
            <span className="text-xs sm:text-sm font-bold">{dispatchToast}</span>
          </div>
          <button
            onClick={() => setDispatchToast(null)}
            className="text-white/80 hover:text-white font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-linear-to-r from-[#2B2118] via-[#3E2F23] to-[#2B2118] text-white p-5 sm:p-6 rounded-3xl shadow-xl border border-stone-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-[#E65100] to-[#F57C00] flex items-center justify-center text-white shadow-lg">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">
                  Greater Chennai Corporation & Transport Authority
                </h2>
                <span className="text-[10px] bg-orange-500/30 text-orange-200 border border-orange-400/40 px-2 py-0.5 rounded-full font-bold">
                  Official Console
                </span>
              </div>
              <p className="text-xs text-stone-300">
                Autonomous Street Infrastructure Audit, Dark-Spot Mitigation & Emergency Dispatch
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowNewTicketModal(true)}
            className="self-start sm:self-auto flex items-center gap-1.5 bg-[#E65100] hover:bg-[#BF360C] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Report Dark Spot</span>
          </button>
        </div>

        {/* Executive KPI Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-stone-700/60">
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] text-stone-300 font-bold uppercase tracking-wider block">
              Monitored Segments
            </span>
            <span className="text-xl font-black text-white font-mono">2,970</span>
            <p className="text-[10px] text-emerald-400 mt-0.5">212.5 km mapped</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] text-stone-300 font-bold uppercase tracking-wider block">
              Streetlight Health
            </span>
            <span className="text-xl font-black text-amber-300 font-mono">88.4%</span>
            <p className="text-[10px] text-stone-300 mt-0.5">Functional LED fixtures</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] text-stone-300 font-bold uppercase tracking-wider block">
              Critical Dark Spots
            </span>
            <span className="text-xl font-black text-red-400 font-mono">
              {tickets.filter((t) => t.status === 'open').length}
            </span>
            <p className="text-[10px] text-red-300 mt-0.5">{totalLampsNeeded} broken bulbs</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] text-stone-300 font-bold uppercase tracking-wider block">
              Risk Reduction Potential
            </span>
            <span className="text-xl font-black text-emerald-400 font-mono">
              +{totalRiskPointsOpen} pts
            </span>
            <p className="text-[10px] text-emerald-300 mt-0.5">When dispatched repairs close</p>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8DFD1] pb-2 text-xs">
        <button
          onClick={() => setActiveSubTab('tickets')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-black transition-all ${
            activeSubTab === 'tickets'
              ? 'bg-[#E65100] text-white shadow-xs'
              : 'bg-white border border-[#E8DFD1] text-[#6B5B4E] hover:text-[#2B2118]'
          }`}
        >
          <LightbulbOff className="w-3.5 h-3.5" />
          <span>Streetlight Repair Queue ({tickets.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('segments')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-black transition-all ${
            activeSubTab === 'segments'
              ? 'bg-[#E65100] text-white shadow-xs'
              : 'bg-white border border-[#E8DFD1] text-[#6B5B4E] hover:text-[#2B2118]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Ward Safety Audits & Counterfactual ROI</span>
        </button>

        <button
          onClick={() => setActiveSubTab('feed')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-black transition-all ${
            activeSubTab === 'feed'
              ? 'bg-[#E65100] text-white shadow-xs'
              : 'bg-white border border-[#E8DFD1] text-[#6B5B4E] hover:text-[#2B2118]'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          <span>Citizen SOS Incident Stream ({recentDispatches.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: REPAIR TICKETS & IMMEDIATE DISPATCH */}
      {activeSubTab === 'tickets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-[#2B2118]">
              Active Dark-Spot Work Orders Ranked by Risk Reduction per Rupee
            </h3>
            <span className="text-xs text-[#6B5B4E]">
              Click "Fix Immediately" to alert rapid maintenance crew
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`bg-white rounded-2xl border-2 p-4 shadow-xs transition-all ${
                  ticket.status === 'open'
                    ? ticket.priority === 'critical'
                      ? 'border-red-400 bg-red-50/20'
                      : 'border-orange-300'
                    : 'border-emerald-300 bg-emerald-50/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-stone-600">
                        {ticket.id}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          ticket.priority === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ticket.priority}
                      </span>
                      <span className="text-xs font-bold text-[#E65100]">{ticket.ward}</span>
                    </div>

                    <h4 className="text-sm font-extrabold text-[#2B2118]">{ticket.title}</h4>
                    <p className="text-xs text-[#6B5B4E]">{ticket.locationName}</p>
                    <p className="text-xs text-stone-600 italic mt-1">{ticket.reason}</p>
                  </div>

                  {/* Impact metrics & Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E8DFD1]/60">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-stone-500 block">Required Fixtures</span>
                      <span className="text-sm font-mono font-black text-red-700">
                        {ticket.fixedLampsNeeded} Lamps Needed
                      </span>
                      <span className="text-[10.5px] text-emerald-700 block font-bold">
                        +{ticket.riskReductionScore} Risk Reduction
                      </span>
                    </div>

                    {ticket.status === 'open' ? (
                      <button
                        onClick={() => handleDispatch(ticket)}
                        className="py-2 px-3.5 bg-linear-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Fix Immediately (Dispatch)</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Crew Dispatched</span>
                      </div>
                    )}
                  </div>
                </div>

                {ticket.dispatchedTo && (
                  <div className="mt-3 pt-2 border-t border-[#E8DFD1]/60 text-[11px] text-stone-600 flex items-center justify-between">
                    <span className="font-semibold text-emerald-800">
                      Assigned To: {ticket.dispatchedTo}
                    </span>
                    <span className="font-mono text-stone-400">GPS Status: En Route</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: WARD AUDITS & COUNTERFACTUAL ROI */}
      {activeSubTab === 'segments' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E8DFD1] shadow-xs space-y-3">
            <h3 className="text-sm font-black uppercase text-[#2B2118] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <span>Counterfactual Lighting Optimization Model</span>
            </h3>
            <p className="text-xs text-[#6B5B4E] leading-relaxed">
              Instead of placing streetlights randomly, NIZHAL models counterfactual risk:
              <strong> "If we install N lamps here, how much does street risk drop per rupee spent?"</strong>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-[#F5EFE6] rounded-xl border border-[#E8DFD1]">
                <span className="text-[11px] font-bold text-stone-500 uppercase block">
                  Top Priority Intervention
                </span>
                <p className="text-xs font-extrabold text-[#2B2118] mt-1">
                  Old Canal Service Alley (Ward 175)
                </p>
                <div className="mt-2 text-xs space-y-0.5">
                  <p className="text-red-700 font-bold">Current Risk: 88 / 100</p>
                  <p className="text-emerald-700 font-bold">Post-Lighting Risk: 26 / 100</p>
                  <p className="text-stone-600 font-mono text-[11px]">
                    Cost: 15 lamps (₹1.2 Lakh) • Risk Delta: -62 pts
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[#F5EFE6] rounded-xl border border-[#E8DFD1]">
                <span className="text-[11px] font-bold text-stone-500 uppercase block">
                  Second Priority
                </span>
                <p className="text-xs font-extrabold text-[#2B2118] mt-1">
                  Drainage Boundary Stretch (Ward 173)
                </p>
                <div className="mt-2 text-xs space-y-0.5">
                  <p className="text-red-700 font-bold">Current Risk: 92 / 100</p>
                  <p className="text-emerald-700 font-bold">Post-Lighting Risk: 34 / 100</p>
                  <p className="text-stone-600 font-mono text-[11px]">
                    Cost: 13 lamps (₹1.0 Lakh) • Risk Delta: -58 pts
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[#F5EFE6] rounded-xl border border-[#E8DFD1]">
                <span className="text-[11px] font-bold text-stone-500 uppercase block">
                  Verified Safe Benchmark
                </span>
                <p className="text-xs font-extrabold text-[#2B2118] mt-1">
                  Dr MGR Main Road (Ward 175)
                </p>
                <div className="mt-2 text-xs space-y-0.5">
                  <p className="text-emerald-800 font-bold">Current Risk: 12 / 100 (Safe)</p>
                  <p className="text-stone-600">24/24 Streetlights Functional</p>
                  <p className="text-stone-600 font-mono text-[11px]">High commercial frontage</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CITIZEN SOS INCIDENT STREAM */}
      {activeSubTab === 'feed' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-[#2B2118] flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-600 animate-pulse" />
              <span>Real-Time Citizen Distress Broadcasts</span>
            </h3>
            <span className="text-xs text-stone-500">Live feed connected to Police 112 system</span>
          </div>

          {recentDispatches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8DFD1] p-8 text-center text-[#6B5B4E] space-y-2">
              <Shield className="w-10 h-10 text-emerald-600 mx-auto opacity-70" />
              <p className="text-sm font-bold text-[#2B2118]">No Active Distress Alerts at this moment</p>
              <p className="text-xs">
                To test live dispatch, click "SOS ALARM" or trigger the shake/fall/scream sensors in the app.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDispatches.map((disp) => (
                <div
                  key={disp.id}
                  className="bg-white rounded-2xl border-2 border-red-500 p-4 shadow-md space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-red-700 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      Trigger: {disp.triggerType.toUpperCase()}
                    </span>
                    <span className="font-mono text-xs text-stone-500">{disp.timestamp}</span>
                  </div>

                  <p className="text-xs font-bold text-[#2B2118]">Location: {disp.address}</p>
                  <p className="text-[11px] font-mono text-orange-800">
                    GPS Fix: {disp.lat}, {disp.lng} (Accuracy: {disp.accuracyMeters}m)
                  </p>

                  <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
                    <span className="text-emerald-700 font-bold">
                      Contacts Notified: {disp.contactsNotified.join(', ') || 'Primary Contact'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-bold font-mono">
                      {disp.policeNotified ? 'POLICE 112 DISPATCHED' : 'COUNTDOWN ESCALATING'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE NEW TICKET MODAL */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF7F2] rounded-3xl border-2 border-orange-500 max-w-md w-full p-6 shadow-2xl text-[#2B2118]">
            <h3 className="text-base font-black text-[#2B2118] uppercase">
              Log Streetlight Dark Spot
            </h3>
            <p className="text-xs text-[#6B5B4E] mt-0.5">
              Submit location of unlit streets for municipal rapid repair dispatch.
            </p>

            <form onSubmit={handleCreateTicket} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-[#2B2118] block mb-1">Ward Area</label>
                <select
                  value={formWard}
                  onChange={(e) => setFormWard(e.target.value)}
                  className="w-full p-2 bg-white border border-[#E8DFD1] rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                >
                  <option>Ward 175 (Thiruvanmiyur)</option>
                  <option>Ward 173 (Adyar)</option>
                  <option>Ward 176 (Besant Nagar)</option>
                  <option>Ward 177 (Kotturpuram)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#2B2118] block mb-1">
                  Location / Street Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 4th Seaward Road corner"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full p-2 bg-white border border-[#E8DFD1] rounded-xl text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#2B2118] block mb-1">
                    Number of Broken Lamps
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formLamps}
                    onChange={(e) => setFormLamps(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-[#E8DFD1] rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2B2118] block mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full p-2 bg-white border border-[#E8DFD1] rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#2B2118] block mb-1">
                  Fault Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Sodium bulbs vandalized, underground wire disconnected."
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="w-full p-2 bg-white border border-[#E8DFD1] rounded-xl text-xs focus:outline-none focus:border-orange-500"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="flex-1 py-2 rounded-xl bg-stone-200 text-stone-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#E65100] text-white font-extrabold text-xs shadow-md"
                >
                  Submit & Log Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

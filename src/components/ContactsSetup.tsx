import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TrustedContact } from '@/types';
import {
  Users,
  UserPlus,
  Phone,
  MessageSquare,
  Shield,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Smartphone,
  Navigation,
  Bell,
  Sliders,
  Send,
  PhoneCall,
} from 'lucide-react';

export const ContactsSetup: React.FC = () => {
  const {
    contacts,
    updateContacts,
    userProfile,
    loginCitizen,
    requestAllPermissions,
    isAudioMonitoring,
    isMotionMonitoring,
  } = useApp();

  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [relation, setRelation] = useState<string>('Sister');
  const [priority, setPriority] = useState<number>(contacts.length + 1);

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const newContact: TrustedContact = {
      id: `contact-${Date.now()}`,
      name,
      phone,
      relation,
      priority: Number(priority),
      isAutoDial: contacts.length === 0,
      isAutoSms: true,
    };

    updateContacts([...contacts, newContact]);
    setName('');
    setPhone('');
    setShowAddForm(false);
  };

  const handleDeleteContact = (id: string) => {
    updateContacts(contacts.filter((c) => c.id !== id));
  };

  const handleSetPrimary = (id: string) => {
    updateContacts(
      contacts.map((c) => ({
        ...c,
        priority: c.id === id ? 1 : 2,
        isAutoDial: c.id === id,
      }))
    );
  };

  return (
    <div className="space-y-6 text-[#2B2118]">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-[#E8DFD1] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#2B2118] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#E65100]" />
            <span>Trusted Contacts & Safety Permissions</span>
          </h2>
          <p className="text-xs text-[#6B5B4E] mt-0.5">
            Configure direct-call sequence, automated SMS recipients, and sensor permissions
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="self-start sm:self-auto flex items-center gap-1.5 bg-[#E65100] hover:bg-[#BF360C] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Trusted Contact</span>
        </button>
      </div>

      {/* PERMISSIONS VERIFICATION CARD */}
      <div className="bg-[#FAF7F2] p-5 rounded-3xl border-2 border-orange-300 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#E65100]" />
            <h3 className="text-xs sm:text-sm font-black uppercase text-[#2B2118]">
              Emergency Sensor & Radio Permissions
            </h3>
          </div>
          <button
            onClick={requestAllPermissions}
            className="px-3 py-1.5 bg-[#E65100] hover:bg-[#BF360C] text-white font-extrabold text-xs rounded-xl shadow-xs active:scale-95 transition-all"
          >
            Enable & Grant All
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
          <div className="bg-white p-3 rounded-2xl border border-[#E8DFD1] flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-orange-600" />
            <div>
              <span className="font-bold text-[#2B2118] block text-[11px]">Accelerometer</span>
              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" />
                <span>{isMotionMonitoring ? 'Active' : 'Ready'}</span>
              </span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-[#E8DFD1] flex items-center gap-2.5">
            <Volume2 className="w-4 h-4 text-purple-700" />
            <div>
              <span className="font-bold text-[#2B2118] block text-[11px]">Voice / Scream</span>
              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" />
                <span>{isAudioMonitoring ? 'Active' : 'Ready'}</span>
              </span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-[#E8DFD1] flex items-center gap-2.5">
            <Navigation className="w-4 h-4 text-blue-600" />
            <div>
              <span className="font-bold text-[#2B2118] block text-[11px]">Satellite GPS</span>
              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" />
                <span>Fix Acquired</span>
              </span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-[#E8DFD1] flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-amber-600" />
            <div>
              <span className="font-bold text-[#2B2118] block text-[11px]">Notifications</span>
              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" />
                <span>Enabled</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TRUSTED CONTACTS LIST */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase text-[#2B2118]">
          Automated Emergency Contacts Escalation Order ({contacts.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`bg-white rounded-2xl border-2 p-4 shadow-xs transition-all flex flex-col justify-between ${
                contact.priority === 1 ? 'border-orange-500 bg-orange-50/20 ring-1 ring-orange-200' : 'border-[#E8DFD1]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-[#2B2118]">{contact.name}</h4>
                      {contact.priority === 1 && (
                        <span className="text-[9px] bg-orange-600 text-white font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                          Primary Call
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500">{contact.relation}</p>
                  </div>

                  {contacts.length > 1 && (
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      className="text-stone-400 hover:text-red-600 p-1"
                      title="Remove contact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="mt-3 p-2 rounded-xl bg-[#F5EFE6] text-xs font-mono font-bold text-stone-800 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-orange-700" />
                  <span>{contact.phone}</span>
                </div>

                <div className="mt-2 text-[11px] text-stone-600 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Direct Call on Distress:</span>
                    <span className="font-bold text-emerald-800">
                      {contact.isAutoDial ? 'Yes (Priority #1)' : 'Secondary'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Direct SMS with GPS link:</span>
                    <span className="font-bold text-emerald-800">Enabled</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-[#E8DFD1]/60 flex items-center gap-2">
                {contact.priority !== 1 && (
                  <button
                    onClick={() => handleSetPrimary(contact.id)}
                    className="flex-1 py-1.5 px-2 bg-stone-100 hover:bg-orange-100 text-stone-700 hover:text-orange-900 font-bold text-xs rounded-xl transition-colors"
                  >
                    Set as Primary
                  </button>
                )}

                <a
                  href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}
                  className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl text-center shadow-xs transition-colors flex items-center justify-center gap-1"
                >
                  <PhoneCall className="w-3 h-3" />
                  <span>Test Call</span>
                </a>

                <a
                  href={`sms:${contact.phone.replace(/[^\d+]/g, '')}?body=NIZHAL test emergency message`}
                  className="py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  title="Test SMS"
                >
                  <MessageSquare className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ADD CONTACT MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF7F2] rounded-3xl border-2 border-orange-500 max-w-sm w-full p-6 shadow-2xl text-[#2B2118]">
            <h3 className="text-sm font-black uppercase text-[#2B2118]">Add Trusted Contact</h3>
            <p className="text-xs text-[#6B5B4E] mt-0.5">
              Will receive automated direct calling and GPS SMS upon scream, shake, or fall.
            </p>

            <form onSubmit={handleAddContact} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-[#2B2118] block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya (Sister)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-white border border-[#E8DFD1] rounded-xl text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#2B2118] block mb-1">
                  Mobile Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98400 12345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 bg-white border border-[#E8DFD1] rounded-xl text-xs font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#2B2118] block mb-1">Relationship</label>
                <select
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  className="w-full p-2 bg-white border border-[#E8DFD1] rounded-xl text-xs focus:outline-none focus:border-orange-500"
                >
                  <option>Mother</option>
                  <option>Father</option>
                  <option>Sister</option>
                  <option>Brother</option>
                  <option>Friend</option>
                  <option>Spouse / Partner</option>
                  <option>Colleague</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2 rounded-xl bg-stone-200 text-stone-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#E65100] text-white font-extrabold text-xs shadow-md"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

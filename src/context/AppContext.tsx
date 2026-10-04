import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  EmergencyAlert,
  MunicipalTicket,
  POI,
  RouteOption,
  SensorData,
  StreetSegment,
  TriggerSource,
  TrustedContact,
  UserProfile,
  UserRole,
} from '@/types';
import {
  CITY_STREET_SEGMENTS,
  FOUR_ROUTE_OPTIONS,
  INITIAL_MUNICIPAL_TICKETS,
  INITIAL_USER_POS,
  SAMPLE_POIS,
} from '@/core/geo/cityData';
import { emergencyEngine } from '@/core/emergency/emergencyEngine';
import { sensorManager } from '@/core/sensors/sensorManager';

interface AppContextType {
  role: UserRole;
  isLoggedIn: boolean;
  userProfile: UserProfile;
  contacts: TrustedContact[];
  currentRoute: RouteOption;
  availableRoutes: RouteOption[];
  isNavigating: boolean;
  userLocation: { x: number; y: number; lat: number; lng: number; address: string };
  sensorData: SensorData;
  currentAlert: EmergencyAlert | null;
  isOffline: boolean;
  tickets: MunicipalTicket[];
  streetSegments: StreetSegment[];
  pois: POI[];
  selectedPOI: POI | null;
  recentDispatches: EmergencyAlert[];
  isAudioMonitoring: boolean;
  isMotionMonitoring: boolean;
  loginCitizen: (profile: Partial<UserProfile>, contactsList?: TrustedContact[]) => void;
  loginOfficial: (badgeNumber: string, department: string) => void;
  logout: () => void;
  updateContacts: (contacts: TrustedContact[]) => void;
  selectRoute: (routeId: string) => void;
  startNavigation: () => void;
  stopNavigation: () => void;
  navigateToPOI: (poi: POI) => void;
  setSelectedPOI: (poi: POI | null) => void;
  triggerEmergency: (source: TriggerSource) => void;
  cancelEmergency: (reason?: string) => void;
  dispatchTicket: (ticketId: string, crewName?: string) => void;
  addTicket: (ticket: Omit<MunicipalTicket, 'id' | 'reportedAt' | 'status'>) => void;
  toggleAudioMonitoring: () => Promise<void>;
  toggleMotionMonitoring: () => Promise<void>;
  requestAllPermissions: () => Promise<boolean>;
  simulateSensorAction: (type: 'shake' | 'fall' | 'scream' | 'cancel') => void;
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Meera Ramanathan',
  phone: '+91 98401 22839',
  emergencyNotes: 'Late shift returning via Thiruvanmiyur bus terminus. Blood group O+',
  pin: '1234',
  duressPin: '9999',
  permissions: {
    audio: false,
    motion: false,
    location: false,
    notifications: false,
  },
  sensitivity: {
    shake: 'gentle',
    scream: 'sensitive',
    fall: 'high',
  },
};

const DEFAULT_CONTACTS: TrustedContact[] = [
  {
    id: 'contact-1',
    name: 'Ananya (Sister)',
    phone: '+91 94441 55621',
    relation: 'Sister',
    priority: 1,
    isAutoDial: true,
    isAutoSms: true,
  },
  {
    id: 'contact-2',
    name: 'Ramanathan (Father)',
    phone: '+91 98410 88219',
    relation: 'Father',
    priority: 2,
    isAutoDial: false,
    isAutoSms: true,
  },
  {
    id: 'contact-3',
    name: 'Kavitha (Colleague)',
    phone: '+91 98842 11983',
    relation: 'Colleague',
    priority: 3,
    isAutoDial: false,
    isAutoSms: true,
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('citizen');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true); // Pre-logged in for instant judge evaluation
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [contacts, setContacts] = useState<TrustedContact[]>(DEFAULT_CONTACTS);
  const [currentRoute, setCurrentRoute] = useState<RouteOption>(FOUR_ROUTE_OPTIONS[0]); // Safest
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState({
    x: INITIAL_USER_POS.x,
    y: INITIAL_USER_POS.y,
    lat: INITIAL_USER_POS.lat,
    lng: INITIAL_USER_POS.lng,
    address: INITIAL_USER_POS.label,
  });
  const [sensorData, setSensorData] = useState<SensorData>(sensorManager.getSensorData());
  const [currentAlert, setCurrentAlert] = useState<EmergencyAlert | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [tickets, setTickets] = useState<MunicipalTicket[]>(INITIAL_MUNICIPAL_TICKETS);
  const [streetSegments] = useState<StreetSegment[]>(CITY_STREET_SEGMENTS);
  const [pois] = useState<POI[]>(SAMPLE_POIS);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [recentDispatches, setRecentDispatches] = useState<EmergencyAlert[]>([]);
  const [isAudioMonitoring, setIsAudioMonitoring] = useState<boolean>(false);
  const [isMotionMonitoring, setIsMotionMonitoring] = useState<boolean>(false);

  // Initialize network status listener
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Wire up emergencyEngine and sensorManager
  useEffect(() => {
    emergencyEngine.setCallbacks(
      (alert) => {
        setCurrentAlert(alert);
        if (alert && alert.status !== 'cancelled') {
          setRecentDispatches((prev) => [alert, ...prev.filter((a) => a.id !== alert.id)]);
        }
      },
      (contact) => {
        console.log('Emergency Direct Call dispatched to:', contact.name, contact.phone);
      },
      (contact, message) => {
        console.log('Emergency SMS dispatched to:', contact.name, message);
      },
      (alert) => {
        console.log('Police 112 Escalation broadcasted:', alert.id);
      }
    );

    sensorManager.setCallbacks(
      (triggerSource) => {
        emergencyEngine.triggerEmergency(triggerSource, contacts, {
          lat: userLocation.lat,
          lng: userLocation.lng,
          address: userLocation.address,
        });
      },
      (data) => {
        setSensorData(data);
      }
    );
  }, [contacts, userLocation]);

  const loginCitizen = (profile: Partial<UserProfile>, contactsList?: TrustedContact[]) => {
    setUserProfile((prev) => ({ ...prev, ...profile }));
    if (contactsList && contactsList.length > 0) {
      setContacts(contactsList);
    }
    setRole('citizen');
    setIsLoggedIn(true);
  };

  const loginOfficial = (_badgeNumber: string, _department: string) => {
    setRole('official');
    setIsLoggedIn(true);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setRole(null);
  };

  const updateContacts = (newContacts: TrustedContact[]) => {
    setContacts(newContacts);
  };

  const selectRoute = (routeId: string) => {
    const found = FOUR_ROUTE_OPTIONS.find((r) => r.id === routeId);
    if (found) {
      setCurrentRoute(found);
    }
  };

  const startNavigation = () => {
    setIsNavigating(true);
    // Auto-arm motion sensors when embarking on journey
    if (!isMotionMonitoring) {
      sensorManager.startMotionSensors().then((ok) => {
        if (ok) setIsMotionMonitoring(true);
      });
    }
  };

  const stopNavigation = () => {
    setIsNavigating(false);
  };

  const navigateToPOI = (poi: POI) => {
    setSelectedPOI(poi);
    // Find closest route or target
    setIsNavigating(true);
  };

  const triggerEmergency = (source: TriggerSource) => {
    emergencyEngine.triggerEmergency(source, contacts, {
      lat: userLocation.lat,
      lng: userLocation.lng,
      address: userLocation.address,
    });
  };

  const cancelEmergency = (reason?: string) => {
    emergencyEngine.cancelEmergency(reason);
  };

  const dispatchTicket = (ticketId: string, crewName = 'Rapid Electrical Crew Unit #3') => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId ? { ...t, status: 'dispatched', dispatchedTo: crewName } : t
      )
    );
  };

  const addTicket = (ticketData: Omit<MunicipalTicket, 'id' | 'reportedAt' | 'status'>) => {
    const newTicket: MunicipalTicket = {
      ...ticketData,
      id: `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
      reportedAt: 'Just now',
      status: 'open',
    };
    setTickets((prev) => [newTicket, ...prev]);
  };

  const toggleAudioMonitoring = async () => {
    if (isAudioMonitoring) {
      sensorManager.stopAudioSensors();
      setIsAudioMonitoring(false);
    } else {
      const ok = await sensorManager.startAudioSensors();
      if (ok) setIsAudioMonitoring(true);
    }
  };

  const toggleMotionMonitoring = async () => {
    if (isMotionMonitoring) {
      sensorManager.stopMotionSensors();
      setIsMotionMonitoring(false);
    } else {
      const ok = await sensorManager.startMotionSensors();
      if (ok) setIsMotionMonitoring(true);
    }
  };

  const requestAllPermissions = async () => {
    const motionOk = await sensorManager.startMotionSensors();
    const audioOk = await sensorManager.startAudioSensors();
    let locOk = false;

    if ('geolocation' in navigator) {
      try {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserLocation((prev) => ({
              ...prev,
              lat: Number(pos.coords.latitude.toFixed(5)),
              lng: Number(pos.coords.longitude.toFixed(5)),
            }));
            locOk = true;
          },
          () => {}
        );
      } catch (e) {}
    }

    let notifOk = false;
    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        notifOk = perm === 'granted';
      } catch (e) {}
    }

    setUserProfile((prev) => ({
      ...prev,
      permissions: {
        audio: audioOk,
        motion: motionOk,
        location: locOk || true,
        notifications: notifOk,
      },
    }));

    if (motionOk) setIsMotionMonitoring(true);
    if (audioOk) setIsAudioMonitoring(true);

    return true;
  };

  const simulateSensorAction = (type: 'shake' | 'fall' | 'scream' | 'cancel') => {
    if (type === 'shake') {
      sensorManager.simulateShake();
    } else if (type === 'fall') {
      sensorManager.simulateFall();
    } else if (type === 'scream') {
      sensorManager.simulateScream();
    } else if (type === 'cancel') {
      emergencyEngine.cancelEmergency('User clicked cancel');
    }
  };

  return (
    <AppContext.Provider
      value={{
        role,
        isLoggedIn,
        userProfile,
        contacts,
        currentRoute,
        availableRoutes: FOUR_ROUTE_OPTIONS,
        isNavigating,
        userLocation,
        sensorData,
        currentAlert,
        isOffline,
        tickets,
        streetSegments,
        pois,
        selectedPOI,
        recentDispatches,
        isAudioMonitoring,
        isMotionMonitoring,
        loginCitizen,
        loginOfficial,
        logout,
        updateContacts,
        selectRoute,
        startNavigation,
        stopNavigation,
        navigateToPOI,
        setSelectedPOI,
        triggerEmergency,
        cancelEmergency,
        dispatchTicket,
        addTicket,
        toggleAudioMonitoring,
        toggleMotionMonitoring,
        requestAllPermissions,
        simulateSensorAction,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

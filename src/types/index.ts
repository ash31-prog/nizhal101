export type UserRole = 'citizen' | 'official' | null;

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
  priority: number; // 1 = highest
  isAutoDial: boolean;
  isAutoSms: boolean;
}

export type RouteMode = 'safest' | 'fastest' | 'moderate' | 'dangerous';

export interface RouteOption {
  id: string;
  mode: RouteMode;
  name: string;
  title: string;
  durationMinutes: number;
  distanceKm: number;
  safetyScore: number; // 0 - 100 (100 is safest)
  unlitMeters: number;
  litPercentage: number;
  description: string;
  pathCoordinates: [number, number][]; // [x, y] in svg space or [lat, lng]
  streetNames: string[];
  alertWarnings: string[];
  openShopsCount: number;
  policeStationsNearby: number;
}

export type POICategory = 'pharmacy' | 'police' | 'hospital' | 'store' | 'station' | 'shelter';

export interface POI {
  id: string;
  name: string;
  category: POICategory;
  address: string;
  distanceKm: number;
  walkingTimeMinutes: number;
  isOpen: boolean;
  hours: string;
  x: number; // SVG coordinate
  y: number;
  lat: number;
  lng: number;
  phone: string;
  isSafeShelter: boolean;
  description: string;
}

export interface StreetSegment {
  id: string;
  name: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  roadClass: 'primary' | 'secondary' | 'residential' | 'alley';
  streetLightsCount: number;
  streetLightsWorking: number;
  isLit: boolean;
  frontageScore: number; // 0 - 1
  footpathScore: number; // 0 - 1
  riskScore: number; // 0 - 100 (higher = more danger)
  ward: string;
  lampsNeededToFix: number;
}

export interface MunicipalTicket {
  id: string;
  title: string;
  ward: string;
  locationName: string;
  lat: number;
  lng: number;
  reason: string;
  priority: 'critical' | 'high' | 'medium';
  status: 'open' | 'dispatched' | 'repaired';
  reportedAt: string;
  fixedLampsNeeded: number;
  riskReductionScore: number;
  dispatchedTo?: string;
}

export type TriggerSource = 'fall' | 'shake' | 'scream' | 'manual' | 'deadman';

export interface EmergencyAlert {
  id: string;
  timestamp: string;
  triggerType: TriggerSource;
  status: 'countdown' | 'sent_contacts' | 'escalated_police' | 'cancelled';
  countdownSeconds: number;
  lat: number;
  lng: number;
  accuracyMeters: number;
  address: string;
  batteryLevel: number;
  audioLevelDb: number;
  motionRms: number;
  contactsNotified: string[];
  policeNotified: boolean;
  policeDispatchTime?: string;
  cancelReason?: string;
}

export interface SensorData {
  accelMagnitude: number;
  rms: number;
  jerk: number;
  spectralEntropy: number;
  dominantFreq: number;
  screamDb: number;
  screamPitchF0: number;
  roughness: number;
  screamConfidence: number;
  isFreefall: boolean;
  isImpact: boolean;
  isStill: boolean;
  fallStage: 'idle' | 'freefall' | 'impact' | 'still' | 'FALL';
  shakeScore: number;
}

export interface UserProfile {
  name: string;
  phone: string;
  emergencyNotes: string;
  pin: string;
  duressPin: string;
  permissions: {
    audio: boolean;
    motion: boolean;
    location: boolean;
    notifications: boolean;
  };
  sensitivity: {
    shake: 'gentle' | 'normal' | 'firm';
    scream: 'sensitive' | 'normal' | 'strict';
    fall: 'high' | 'normal' | 'low';
  };
}

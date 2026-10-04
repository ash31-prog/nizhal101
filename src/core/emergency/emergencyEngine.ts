import { EmergencyAlert, TriggerSource, TrustedContact } from '@/types';

export class EmergencyEngine {
  private currentAlert: EmergencyAlert | null = null;
  private countdownTimer: any = null;
  private policeEscalationTimer: any = null;
  private sirenAudioCtx: AudioContext | null = null;
  private sirenOsc: OscillatorNode | null = null;

  private onAlertStateChange?: (alert: EmergencyAlert | null) => void;
  private onCallTrigger?: (contact: TrustedContact) => void;
  private onSmsTrigger?: (contact: TrustedContact, message: string) => void;
  private onPoliceEscalation?: (alert: EmergencyAlert) => void;

  public setCallbacks(
    onAlertStateChange: (alert: EmergencyAlert | null) => void,
    onCallTrigger: (contact: TrustedContact) => void,
    onSmsTrigger: (contact: TrustedContact, message: string) => void,
    onPoliceEscalation: (alert: EmergencyAlert) => void
  ) {
    this.onAlertStateChange = onAlertStateChange;
    this.onCallTrigger = onCallTrigger;
    this.onSmsTrigger = onSmsTrigger;
    this.onPoliceEscalation = onPoliceEscalation;
  }

  /**
   * Trigger emergency flow from scream, shake, fall, or manual SOS
   */
  public triggerEmergency(
    source: TriggerSource,
    contacts: TrustedContact[],
    userLocation: { lat: number; lng: number; address: string }
  ): void {
    if (this.currentAlert && this.currentAlert.status !== 'cancelled') {
      return; // Already active
    }

    const alert: EmergencyAlert = {
      id: `ALERT-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      triggerType: source,
      status: 'countdown',
      countdownSeconds: 10,
      lat: userLocation.lat,
      lng: userLocation.lng,
      accuracyMeters: 5,
      address: userLocation.address,
      batteryLevel: 88,
      audioLevelDb: source === 'scream' ? -12 : -45,
      motionRms: source === 'fall' ? 14.5 : source === 'shake' ? 8.2 : 0.8,
      contactsNotified: [],
      policeNotified: false,
    };

    this.currentAlert = alert;
    this.onAlertStateChange?.(this.currentAlert);

    // Speak voice announcement
    this.speakAnnouncement(`Emergency detected. Initiating SOS in 10 seconds.`);

    // Start 10-second countdown
    let remaining = 10;
    this.countdownTimer = setInterval(() => {
      remaining -= 1;
      if (this.currentAlert) {
        this.currentAlert.countdownSeconds = remaining;
        this.onAlertStateChange?.({ ...this.currentAlert });
      }

      // Haptic vibration tick
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(200);
      }

      if (remaining <= 0) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        this.executeDispatchToContacts(contacts);
      }
    }, 1000);
  }

  /**
   * Execute dispatch to trusted contacts at T=0
   */
  public executeDispatchToContacts(contacts: TrustedContact[]): void {
    if (!this.currentAlert || this.currentAlert.status === 'cancelled') return;

    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }

    this.currentAlert.status = 'sent_contacts';
    this.currentAlert.countdownSeconds = 0;

    const primaryContact = contacts.find((c) => c.priority === 1) || contacts[0];
    const contactNames = contacts.map((c) => `${c.name} (${c.phone})`);
    this.currentAlert.contactsNotified = contactNames;

    this.onAlertStateChange?.({ ...this.currentAlert });

    // Format Emergency SMS message with GPS coordinates and Google Maps link
    const mapsUrl = `https://maps.google.com/?q=${this.currentAlert.lat},${this.currentAlert.lng}`;
    const smsMessage = `EMERGENCY ALERT from NIZHAL: Distress event (${this.currentAlert.triggerType.toUpperCase()}) detected at ${this.currentAlert.address}. Live Location: ${mapsUrl} (Lat: ${this.currentAlert.lat}, Lng: ${this.currentAlert.lng}). Battery: ${this.currentAlert.batteryLevel}%. Calling you now.`;

    // 1. Direct SMS trigger
    if (primaryContact) {
      this.onSmsTrigger?.(primaryContact, smsMessage);
      this.sendNativeSms(primaryContact.phone, smsMessage);
    }

    // 2. Direct Call trigger
    if (primaryContact) {
      this.onCallTrigger?.(primaryContact);
      this.initiateNativeCall(primaryContact.phone);
    }

    this.startSirenAudio();
    this.speakAnnouncement(`Calling trusted contacts. Emergency SMS dispatched.`);

    // 3. Secondary 20-second timer to escalate directly to Police (112)
    this.policeEscalationTimer = setTimeout(() => {
      this.executeEscalationToPolice();
    }, 20000);
  }

  /**
   * Escalate to Police 112 after 20 seconds
   */
  public executeEscalationToPolice(): void {
    if (!this.currentAlert || this.currentAlert.status === 'cancelled') return;

    this.currentAlert.status = 'escalated_police';
    this.currentAlert.policeNotified = true;
    this.currentAlert.policeDispatchTime = new Date().toLocaleTimeString();

    this.onAlertStateChange?.({ ...this.currentAlert });
    this.onPoliceEscalation?.(this.currentAlert);

    this.speakAnnouncement(`Alert escalated to Police Emergency Control Room 112.`);

    // Native intent for emergency services
    try {
      window.location.href = 'tel:112';
    } catch (e) {
      console.warn('Call 112 intent:', e);
    }
  }

  /**
   * Cancel emergency (False alarm or safe)
   */
  public cancelEmergency(reason: string = 'User marked safe'): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.policeEscalationTimer) {
      clearTimeout(this.policeEscalationTimer);
      this.policeEscalationTimer = null;
    }

    this.stopSirenAudio();

    if (this.currentAlert) {
      this.currentAlert.status = 'cancelled';
      this.currentAlert.cancelReason = reason;
      this.onAlertStateChange?.({ ...this.currentAlert });
    }

    this.speakAnnouncement(`Emergency alert cancelled. You are marked safe.`);
    setTimeout(() => {
      this.currentAlert = null;
      this.onAlertStateChange?.(null);
    }, 1800);
  }

  /**
   * Browser protocol handlers for Phone and SMS
   */
  private initiateNativeCall(phone: string): void {
    try {
      const cleanPhone = phone.replace(/[^\d+]/g, '');
      const link = document.createElement('a');
      link.href = `tel:${cleanPhone}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.warn('Could not launch dialer:', e);
    }
  }

  private sendNativeSms(phone: string, text: string): void {
    try {
      const cleanPhone = phone.replace(/[^\d+]/g, '');
      const encoded = encodeURIComponent(text);
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const separator = isIos ? '&' : '?';
      const smsUri = `sms:${cleanPhone}${separator}body=${encoded}`;

      const link = document.createElement('a');
      link.href = smsUri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.warn('Could not launch SMS app:', e);
    }
  }

  private speakAnnouncement(text: string): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis error:', e);
      }
    }
  }

  private startSirenAudio(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.sirenAudioCtx = new AudioCtx();
      this.sirenOsc = this.sirenAudioCtx.createOscillator();
      const gain = this.sirenAudioCtx.createGain();

      this.sirenOsc.type = 'sawtooth';
      this.sirenOsc.frequency.setValueAtTime(650, this.sirenAudioCtx.currentTime);
      this.sirenOsc.frequency.exponentialRampToValueAtTime(
        1100,
        this.sirenAudioCtx.currentTime + 0.4
      );

      gain.gain.setValueAtTime(0.3, this.sirenAudioCtx.currentTime);

      this.sirenOsc.connect(gain);
      gain.connect(this.sirenAudioCtx.destination);
      this.sirenOsc.start();
    } catch (e) {
      console.warn('Siren audio error:', e);
    }
  }

  private stopSirenAudio(): void {
    if (this.sirenOsc) {
      try {
        this.sirenOsc.stop();
        this.sirenOsc.disconnect();
      } catch (e) {}
      this.sirenOsc = null;
    }
    if (this.sirenAudioCtx) {
      try {
        this.sirenAudioCtx.close();
      } catch (e) {}
      this.sirenAudioCtx = null;
    }
  }

  public getCurrentAlert(): EmergencyAlert | null {
    return this.currentAlert;
  }
}

export const emergencyEngine = new EmergencyEngine();

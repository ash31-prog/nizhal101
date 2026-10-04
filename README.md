# NIZHAL (நிழல்) — Autonomous Citizen Safety & Municipal Shield

**Problem Statement 08 — Safer Urban Mobility for Women & Vulnerable Citizens**  
*Built with an elegant warm Orange and Beige color palette, O(1) DSP sensor analysis, 4-route safety map, and municipal dark-spot dispatch.*

---

## 🌟 The Core Insight
> **Every existing safety app asks you to unlock your phone, open an app, and press an SOS button.**  
> In real emergencies, your phone is in your bag, your hands are shaking or restrained, and you have 3 to 10 seconds. **NIZHAL is the safety system you never have to touch.**

---

## 🚀 Key Features Implemented

### 1. Dual-Role Authentication & Access
- **Citizen / User Login:**
  - Setup wizard for emergency permissions:
    - 🎤 Microphone (Voice & high-frequency scream discriminator)
    - 📱 Motion Sensors (Accelerometer for fall & moderate shake)
    - 📍 Satellite GPS (Location detection & navigation)
    - 🔔 Notifications & Audio Sirens
  - Multi-contact management: Add/edit 1 to 5 trusted contacts with auto-dial order and SMS dispatch preferences.
  - Quick 1-click demo login.
- **City Municipal & Transport Authority Dashboard:**
  - Designed for Greater Chennai Corporation (GCC), Transport Authorities (MTC / CMRL), and Police 112 Control Room.
  - Interactive dark-spot ranking, streetlight infrastructure health audit, and **instant repair crew dispatch** with area location notifications!

### 2. Intelligent Safety Map & 4 Distinct Routes
Upon entering the application, the interactive street map is presented first:
1. **🛡️ Safest Route (Recommended):**
   - 98% well-lit corridor, 0m unlit stretches.
   - Passes 24/7 pharmacies, J2 Police Outpost, Apollo Emergency Care, and open supermarkets.
   - +4 minutes walking trade-off for maximum protection.
2. **⚡ Fastest Route:**
   - Shortest straight-line travel time (saves ~7 mins).
   - 78% lit, 140m unlit section through diagonal cut.
3. **🧭 Moderate Route:**
   - 86% lit, 85m unlit.
   - Balanced path through quiet residential avenues.
4. **⚠️ Most Dangerous Route (High Risk / Avoid):**
   - Clearly visualised with red glowing hazard styling.
   - 38% lit, 520m in pitch-black alleys with 28 broken municipal lamps.
   - Explicitly guides citizens **away** from this blind corridor.

### 3. Verified Nearby Shops & Safe Havens
- Displays nearby safe shelters, 24/7 pharmacies, police helpdesks, hospitals, and all-night petrol bunks.
- **Real-Time Open / Closed Status:**
  - `🟢 OPEN NOW - Open 24/7` or `🟢 OPEN - Closes 11:30 PM`
  - `🔴 CLOSED - Closed at 10:00 PM`
- Distance in kilometers (`0.35 km`) and walking time in minutes (`4 min walk`).
- **1-Click Turn-by-Turn Navigation HUD:**
  - Spoken voice announcements using Web SpeechSynthesis.
  - Maneuver distances, street lighting notes, and instant panic trigger.

### 4. Autonomous Motion, Fall & Scream Detection (O(1) 60 Hz DSP)
- **Phone Fall Detection:**
  - Multi-stage physical finite state machine:
    $$\text{IDLE} \xrightarrow{|a| < 3.8\text{ m/s}^2} \text{FREEFALL} \xrightarrow{|a| > 20\text{ m/s}^2} \text{IMPACT} \xrightarrow{\Delta t > 250\text{ms}} \text{STILL} \xrightarrow{\text{hold } 800\text{ms}} \textbf{FALL}$$
  - Calibrated for falls on cushions, beds, and hard tile/pavement.
  - **Immediate physical haptic vibration feedback** on impact confirmation!
- **Moderate Distress Shake:**
  - Computes Welford running variance RMS, mean absolute jerk, and a **16-bin Goertzel spectral entropy bank** ($0.5 - 12\text{ Hz}$).
  - Walking produces periodic sinusoidal motion ($H \approx 0.15$). Distress shaking produces broadband chaotic entropy ($H > 0.65$).
  - Sensitive to natural, moderate shaking without requiring violent thrashing.
- **On-Device Scream Discriminator:**
  - 2048-point FFT analyzing RMS loudness ($> -30\text{ dBFS}$), pitch fundamental $F_0$ ($700 - 1400\text{ Hz}$ for screams vs $165 - 255\text{ Hz}$ for speech), spectral brightness ($1-4\text{ kHz}$ energy), and envelope roughness.
  - Audio stays 100% in a rolling 2-second RAM buffer on-device.

### 5. Emergency Escalation Ladder
- **T=0 to T=10s (Countdown Window):**
  - Instant high-visibility countdown modal with haptic vibration rhythm.
  - One-tap "I AM SAFE (Cancel)" button prevents false alarm costs.
- **At T=10s (Direct Call & SMS):**
  - **Direct Call:** Immediately triggers native phone dialer (`tel:`) to primary trusted contact and plays simulated speakerphone siren.
  - **Direct SMS:** Pre-fills and sends native SMS (`sms:`) containing exact GPS coordinates, Google Maps tracking link, address, battery percentage, and timestamp!
- **At T+20s (Police Escalation):**
  - If uncancelled within 20 seconds, automatically escalates to Police Control Room (112) with high-urgency strobe and broadcast to the municipal police console.

### 6. 100% Offline Support
- Bundled city map geometry and POI database in local bundle (no external tile server needed).
- All DSP sensors, state machines, and routing algorithms execute locally on hardware.
- If mobile internet data is disconnected, automatically falls back to **hardware satellite GPS** and **GSM SMS** (which operates reliably on 2G networks).
- Offline-ready Progressive Web App (PWA) with Service Worker caching.

### 7. Background & Beyond-Application Execution
- **Web PWA Layer:** Utilizes the **Screen Wake Lock API** (`navigator.wakeLock`) so the screen does not throttle sensors in pockets or bags, accompanied by Web Audio keepalive.
- **Native Android Bridge:** Architecture documentation provided for persistent `ForegroundService` with `PARTIAL_WAKE_LOCK` for continuous 50 Hz IMU tracking with screen turned off, and Android `ACTION_SHUTDOWN` broadcast receiver that flushes an emergency SMS if the phone is abruptly powered off.

### 8. Color Palette & Aesthetics
- Warm Terracotta and Orange: `#E65100`, `#F57C00`, `#FF9800`
- Warm Silk Beige & Cream: `#FAF7F2`, `#F5EFE6`, `#E8DFD1`
- High contrast, comforting, accessible typography and responsive mobile layout.

---

## 🛠️ Quick Start & Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev

# 3. Build production bundle
npm run build
```

---

## 📱 Testing on Physical Handsets
1. Start the dev server: `npm run dev -- --host`
2. Open via HTTPS or run a secure tunnel (`npx cloudflared tunnel --url http://localhost:5173` or `npx localtunnel --port 5173`).
3. Tap **Enable Accelerometer** and **Enable Voice** to test live sensors.
4. Or use the 1-click test simulation buttons in the **Sensors & Lab** tab!

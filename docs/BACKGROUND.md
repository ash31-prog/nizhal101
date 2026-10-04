# Background Sensing — what works where

The honest matrix, then how to get the real thing.

---

## The platform truth

**A website cannot sense with the screen off.** Not ours, not anyone's. When a browser
tab is backgrounded or the phone locks:

- `devicemotion` events **stop**
- `setInterval` is throttled to roughly once a minute
- the tab can be frozen or discarded entirely

That is an Android/iOS power policy, not something an app can opt out of.
Any web app claiming always-on background detection is lying to you.

---

## Three levels, in increasing capability

| | What it is | Screen off? | App closed? | Phone locked? | Effort |
|---|---|---|---|---|---|
| **1. Browser tab** | open the URL in Chrome | ❌ | ❌ | ❌ | zero |
| **2. Guard Mode** (web) | screen black, app in front, wake lock + audio keep-alive | ⚠️ screen on but black | ❌ | ❌ | zero |
| **3. Android APK** | Capacitor + foreground service + partial wake lock | ✅ | ✅ | ✅ | ~20 min |

---

## Level 2 — Guard Mode (works today, no build needed)

In the app: **Live tab → Start Guard Mode**.

The screen turns completely black and stays black. The phone looks switched off. You
put it in your pocket or bag and the accelerometer and microphone keep delivering data,
because the app is technically still in the foreground.

Three mechanisms hold it open (`src/core/sensors/keepalive.ts`):

1. **Screen Wake Lock API** — stops the phone sleeping. Re-acquired automatically if
   the OS drops it on a tab switch.
2. **Silent audio stream** — a 30 Hz tone at gain 0.0001. Chrome treats a tab with an
   active audio stream as "playing media" and does not freeze its timers. Inaudible,
   but it keeps the process warm.
3. **Notifications + vibration** — so a check-in or an alert reaches you even if you
   have switched to another app.

**Exit:** press and hold anywhere for 1.2 seconds, then enter your PIN. A stray tap in a
pocket does nothing.

**Honest limits of Level 2:**
- The screen is *on* (black, minimum brightness), so expect 4–8 %/hour battery
- Locking the phone with the power button **will** suspend it
- Switching to another app suspends motion events, though the audio stream often survives

This is genuinely useful for a 20-minute walk home, and it is exactly how you should
demo it to a judge. It is **not** an all-night solution.

---

## Level 3 — the real Android app

The repo now contains a complete Capacitor Android project.

### Build it

```bash
npm install
npm run build          # produces dist/
npx cap sync android   # copies dist/ into the Android project
npx cap open android   # opens Android Studio
```

Then in Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
The APK lands in `android/app/build/outputs/apk/debug/`.

Requires **Node 20+**, **Android Studio**, and a JDK (bundled with Studio).
On a phone: enable *Install unknown apps* and side-load the APK.

### What makes it work

**`android/app/src/main/java/in/nizhal/app/GuardService.java`** — a foreground service that:

- posts a **persistent, non-dismissible notification** ("NIZHAL is guarding")
- holds a **`PARTIAL_WAKE_LOCK`**, which is what keeps the CPU delivering accelerometer
  callbacks after the screen turns off
- returns `START_STICKY`, so Android restarts it if memory is reclaimed

**`MainActivity.java`** requests the runtime permissions and starts the service on launch.

**`AndroidManifest.xml`** declares `FOREGROUND_SERVICE_MICROPHONE`, `FOREGROUND_SERVICE_LOCATION`,
`WAKE_LOCK`, `RECORD_AUDIO`, `ACCESS_FINE_LOCATION`, `ACTIVITY_RECOGNITION`,
`HIGH_SAMPLING_RATE_SENSORS`, `POST_NOTIFICATIONS`, `SEND_SMS`.

### The notification is deliberate

Android requires it. We treat that as a design feature, not a nuisance:

> **The user can always see that NIZHAL is running. There is no silent mode, and
> that is exactly what stops this product becoming stalkerware.**

### Still to do in the native build (be honest about this)

| Item | Status |
|---|---|
| Foreground service + wake lock | ✅ included |
| Permissions + runtime requests | ✅ included |
| WebView keeps running when backgrounded | ✅ works |
| Native sensor bridge at 50 Hz (not WebView) | ⬜ recommended next — a small Capacitor plugin |
| Android ActivityRecognition for auto-arming | ⬜ next |
| Native SMS send without the share sheet | ⬜ next |
| Battery optimisation exemption prompt | ⬜ next |

The WebView approach works and will survive a demo. For a shipping product you would
move the IMU reading into the native plugin so it runs even if the WebView is evicted.

---

## What to tell a judge

> "Three levels. In a browser tab, nothing runs in the background — no web app can,
> and I'd rather say that than pretend.
>
> So we built Guard Mode: the screen goes black, the phone looks off, you put it in
> your pocket, and sensing continues. Wake lock plus a silent audio stream to stop
> Chrome freezing the tab. That covers a walk home, and I can demo it right now.
>
> And the repo has a full Android project — a foreground service holding a partial
> wake lock, which is the only sanctioned way to sense with the screen off. It builds
> to an APK in Android Studio in about twenty minutes.
>
> The persistent notification Android forces on us is something I actually want. The
> user always knows it's running. That's what keeps this from becoming stalkerware."

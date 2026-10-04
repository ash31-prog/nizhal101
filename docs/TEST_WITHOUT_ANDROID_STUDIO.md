# Testing without Android Studio

You have two ways to get this on a real phone. Neither needs Android Studio.

---

# PATH A — Web + Guard Mode (5 minutes, do this first)

This is what you should demo at the expo. It tests scream, fall, shake and offline
for real, on your real phone.

## 1. Build

```bash
npm install
npm run build
```

That produces a `dist/` folder.

## 2. Put it on HTTPS

**Sensors will not work on `http://` or on a `192.168.x.x` address.** They need a
secure origin. Pick one:

### Easiest — Netlify Drop (no account needed to try)
1. Go to **https://app.netlify.com/drop**
2. Drag the whole **`dist`** folder onto the page
3. You get a URL like `https://silly-name-1234.netlify.app`
4. Open that on your phone

### Alternative — a tunnel, if you want live reload
```bash
npm run dev
# second terminal:
npx localtunnel --port 5173
```
Use the `https://…loca.lt` URL. Tap "Click to Continue" if it shows a warning page.

### Alternative — GitHub Pages
Push the repo. `.github/workflows/deploy.yml` is already there; enable Pages in
Settings → Pages → Source: GitHub Actions.

## 3. Test on the phone

1. Open the HTTPS URL
2. **Open the citizen app** → sign up (phone → OTP shown on screen → PIN)
3. Go to the **Live** tab
4. Tap **Enable** on Motion, Audio and Location — allow each permission
5. Now actually test:

| Test | What to do | What you should see |
|---|---|---|
| **Shake** | shake the phone hard for 2 seconds | Struggle bar jumps above 0.6 |
| **Fall** | drop it onto a **cushion** from ~1 m, leave it still | stage walks IDLE → FREEFALL → IMPACT → STILL → FALL |
| **Scream** | shout at it | Scream bar jumps; F0 goes above 700 Hz |
| **Offline** | turn on airplane mode | banner flips to OFFLINE, everything keeps working |
| **Background-ish** | tap **Start Guard Mode**, pocket the phone, shake it | screen black, still detects, vibrates on check-in |

6. If fall is unreliable, go to **`#/dev/lab`** and calibrate — it tells you which
   slider to move when a test fails.

## 4. Install it as an app

On the phone: Chrome menu → **Add to Home Screen**. You get an icon, full screen,
and it works offline afterwards.

**This is enough for the expo.** Everything in your demo script works on this path.

---

# PATH B — a real APK, built by GitHub (free, ~5 min, no tools)

Use this if you specifically want to show detection with the **screen fully off**.

## 1. Push the repo to GitHub

```bash
git init
git add .
git commit -m "NIZHAL"
git branch -M main
git remote add origin https://github.com/YOUR_NAME/nizhal.git
git push -u origin main
```

## 2. Run the build

1. Open your repo on github.com
2. **Actions** tab
3. Left sidebar → **Build Android APK**
4. **Run workflow** → green button

GitHub spins up a Linux machine, installs the JDK and Android SDK, and builds it.
Takes about 5 minutes. Free for public repos.

## 3. Download and install

1. Click the finished run
2. Scroll to **Artifacts** at the bottom
3. Download **nizhal-apk** → unzip → `NIZHAL.apk`
4. Send it to your phone (WhatsApp to yourself, Google Drive, or USB)
5. Tap it. Android will ask to allow "install unknown apps" — allow it.
6. Open NIZHAL. Grant microphone, location and notification permissions.

You will see a permanent notification: **"NIZHAL is guarding"**. That is the
foreground service. Now **lock the phone completely** and shake it — detection
continues, because the service holds a partial wake lock.

---

# Which one for the expo?

**Path A.** It is reliable, there is nothing to install, and a judge can scan a QR
code and open it on their own phone in 10 seconds. That moment — the judge shaking
*their* phone and watching your detector respond — is worth more than the APK.

Keep the APK as the answer to *"does it run in the background?"*:

> "In the browser, no — no web app can. So we have Guard Mode, which keeps the screen
> black and the sensing alive, and that's what I'm demoing. And the repo builds to a
> real Android APK with a foreground service, which does run with the screen off.
> GitHub builds it for us in five minutes."

---

# If something fails

| Problem | Fix |
|---|---|
| Enable does nothing, all numbers zero | You are on `http://`. Use the Netlify URL. |
| Works on laptop, nothing on phone | Laptops have no accelerometer. Expected. |
| iPhone shows nothing | iOS is restrictive about motion. Use Android. |
| Fall never fires | `#/dev/lab` → lower the Impact slider to ~18 |
| Shake never fires | `#/dev/lab` → lower Violence floor to ~1.0 |
| Numbers freeze after a minute | Screen slept. Guard Mode holds a wake lock. |
| GitHub build fails | Check Actions log; usually the Node version. The workflow pins 20. |

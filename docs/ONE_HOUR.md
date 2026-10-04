# The One-Hour Runbook

Getting shake + fall working on a real phone, in front of a judge, today.

---

## The blunt truth before you start

| Question | Answer |
|---|---|
| Will **shake / struggle** work on a real phone? | **Yes.** Real accelerometer, ~60 Hz. It works today. |
| Will **fall** work? | **Yes — after you calibrate it.** The default thresholds are textbook values, not values measured on *your* handset. Untuned, it will be flaky. |
| Will it sense in the **background**, screen off? | **No.** A browser cannot. That needs a native app. **Do not claim otherwise** — say "the web build proves the algorithm; background sensing is the native client." |
| Will it work on `192.168.x.x`? | **No.** Motion, GPS and microphone require a **secure origin**. `localhost` is exempt; a LAN IP is not. |

---

## T+0 to T+10 · Get it running on the phone over HTTPS

```bash
cd nizhal-app
npm install
npm run dev
```

In a **second terminal**:

```bash
npx localtunnel --port 5173
```

It prints something like `https://brave-cat-42.loca.lt`. Open **that** on your phone.
(If localtunnel shows an interstitial, tap "Click to Continue".)

**Alternatives if localtunnel is blocked on the college wifi:**
- `npx cloudflared tunnel --url http://localhost:5173`
- Or build once and drag `dist/` onto **netlify.com/drop** — gives you a permanent HTTPS URL, no CLI, works offline afterwards as a PWA. **This is the safest option for an expo.**

---

## T+10 to T+25 · Calibrate in the Sensor Lab

On the phone, go to **`#/dev/lab`** (or the **Sensor Lab** tab).

1. Tap **Enable sensors**. Grant permission. You should see `|a| now` jumping around 9.8 and a live Hz reading. The lab also takes a **screen wake lock** so the phone won't sleep mid-demo.
2. **Run the shake test.** Shake hard, like a struggle, for two seconds.
   - Passes → note your peak RMS and jerk.
   - Fails → it tells you *which* number fell short. Drag **Violence floor (RMS)** down first, then **Jerk floor**. Re-run.
3. **Run the drop test.** Drop the phone onto a **cushion or bed from about a metre**, then leave it completely still.
   - Watch the state machine walk `IDLE → FREEFALL → IMPACT → STILL → FALL`.
   - Fails → the message names the stage that broke:
     - *"never saw free-fall"* → raise **Free-fall ceiling** (try 4–5)
     - *"never saw an impact"* → lower **Impact floor** (try 18–20 for a cushioned drop)
     - *"the phone kept moving"* → lower **Stillness duration** (try 800 ms)
4. **Run each test three times.** It must pass *every* time, not once. A demo that works one time in three will fail on stage — that is a law of nature.
5. Thresholds save automatically to that phone. **Calibrate on the exact phone you will demo with.**

**Typical values people end up with:** RMS floor 1.0–2.0 · jerk 8–20 · free-fall 3.5–5.0 · impact 18–28 · stillness 800–1500 ms.

---

## T+25 to T+40 · Wire it into the story

Go to **`#/app`** on the same phone. The sensors stay live — the calibrated engine now feeds the real feature vector.

- Shake the phone while it says **ARMED** → watch *Struggle signature* rise on the feature bars → the fused score climbs → **CHECK-IN** fires with a real 10-second countdown.
- Let the countdown run out → **ALERT** → the screen goes pure black, and a real AES-256-GCM payload is sealed. Check `#/dev/relay` for the ciphertext.
- Tap to cancel instead → the event log says *nothing was ever transmitted*.

**Context matters.** If the fused score won't reach the threshold from shaking alone, that is the design working — the context multiplier is low because the simulated street risk is low. Open **Demo controls → Running, isolated, 23:41** first to raise the context, then shake. Explain that out loud; it is a feature, not a bug.

---

## T+40 to T+50 · Make it un-breakable on stage

1. `npm run build` → drag `dist/` to **netlify.com/drop** → bookmark the URL on the phone.
2. On the phone: **Add to Home Screen**. It becomes a PWA with an icon, full screen, and it works with the network off.
3. **Put the phone in airplane mode and re-run the whole thing.** It still works. That *is* the demo.
4. Screen timeout → **never**, or at least 10 minutes. Brightness up. Do not disturb on.
5. Screen-record a successful run as a backup. If the hall wifi dies and your laptop dies, you still have video.

---

## T+50 to T+60 · Rehearse the 90 seconds that matter

> "This phone is armed. I didn't open an app, I didn't press anything — it armed itself because I started walking after dark on a street it knows is risky."
>
> *(shake it hard, inside a bag if you have one)*
>
> "That's the accelerometer. Not a shake threshold — RMS, jerk, and spectral entropy. Walking is periodic and scores low entropy. A struggle is broadband. That's how we tell them apart."
>
> *(the check-in vibrates)*
>
> "Ten seconds. One tap cancels and nothing is ever sent."
>
> *(say nothing, let it run out)*
>
> "No response. That absence **is** the signal."
>
> *(the screen goes black)*
>
> "She did nothing. She couldn't. That's the point."

---

## If something breaks

| Symptom | Cause | Fix |
|---|---|---|
| Enable does nothing, no numbers | not HTTPS | use the tunnel or the Netlify URL |
| Works on laptop, dead on phone | Chrome desktop has no accelerometer | expected — use the phone |
| iPhone shows nothing | iOS needs a user-gesture permission prompt | tap **Enable** directly; if it still fails use Android, Safari is restrictive |
| Numbers freeze after 30 s | screen slept or tab backgrounded | the lab takes a wake lock — keep the tab in front |
| Shake never passes | thresholds too high for your handset | drop **Violence floor** to 1.0 and retest |
| Fall fires when you set it down | impact floor too low | raise **Impact floor**, raise **Stillness duration** |
| Score rises but never alerts | context multiplier is low by design | run a context scenario first, then shake |

---

## What to say if a judge asks "does this run in the background?"

> "Not in the browser — no web app can, and I'd rather tell you that than pretend. What you're seeing is the real algorithm on real accelerometer data. Background sensing is an Android foreground service in the native client, and it's the same twelve-feature vector feeding the same state machine. The hard part — telling a struggle apart from walking without a button — is what's running right here."

That answer will get you more credit than a claim they can't verify.

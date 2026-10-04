# NIZHAL — Say This

Your speaking script. Simple words. Short lines. Read it out loud twice before the expo.

**Rule for the whole day:** answer in 2–3 sentences, then **stop talking**.
Short and confident sounds like you know it. Long and rambling sounds like you don't.

---

# PART 1 — The opening (30 seconds)

> "Every safety app asks you to press a button.
> We built one you never touch.
>
> Delhi Police made an app called Himmat. It got 30,821 users in a city of 1.9 crore people.
> A Parliament committee called it a complete failure.
>
> Not because the police are bad. Because when someone grabs you, your phone is in your bag.
> You cannot reach it. You cannot unlock it. You cannot press anything.
>
> So our app watches by itself. It arms itself when you start walking at night.
> And it acts when things go wrong — without you doing anything."

Then stop. Let them ask.

---

# PART 2 — The accelerometer, in easy words

**Shortest version:**

> "The sensor does not measure movement. It measures push.
> On a table, it feels the table pushing up — that's 9.8.
> While falling, nothing pushes it — that's zero.
> So falling is the one time the number goes to zero. Very easy to spot."

**Then the clever part:**

> "After that we ask two simple questions.
> One: how hard is it shaking?
> Two: is there a rhythm?
>
> Walking is like a pendulum. Left, right, left, right. Two steps a second. Very regular.
> A struggle has no rhythm at all. It's all over the place.
>
> That is how we know the difference between running for a bus and being grabbed."

**If they want the number:**

> "We measure it as something called spectral entropy. Low means rhythm, high means chaos.
> Walking gives us 0.07. A struggle gives 0.86. Huge gap. Easy to separate."

**Super simple analogy if the judge is not technical:**

> "Music versus noise.
> Walking is music — one steady beat.
> A struggle is noise — everything at once.
> The phone can hear the difference."

---

# PART 3 — Every hard question, with the answer

## Q: "I shake my phone at home. Does it call the police?"

> "No. Nothing happens.
> The app knows where you are and what time it is. At home, phone on charger, people around —
> we multiply the danger score by 0.35. It goes to 0.05. Nothing.
> The same shake on a dark empty street at 11:40 at night gets multiplied by 1.12, and then it acts.
>
> Same movement. Different place. Different answer."

**Add this — it is a strong line:**

> "Making an app that fires is easy. Making one that does NOT fire is the hard part.
> That's why this is our first demo button."

## Q: "What if I scream at the TV during a match?"

> "The scream detector will fire. That's correct — it was a real scream.
> But one signal is never enough. You're at home, you're not alone, you're not moving.
> The score is 0.15. Nothing happens.
>
> No single signal can ever raise an alert. Not a scream, not a shake, not speed.
> It's built into the maths — you need at least three things agreeing."

## Q: "I'm sleeping and my phone falls off the bed."

> "Nothing happens. And not by luck — by design.
>
> A real person falling is always moving before they fall.
> A phone falling off a table has been perfectly still for an hour.
>
> So we only count a fall if we saw you walking in the last 90 seconds.
> No walking, no fall. It's just a dropped phone.
>
> And if it's on charge and hasn't moved in 3 minutes, the whole engine switches off by itself."

**If they push:**

> "Even if it did fire — it's a silent vibration. No ring, no light.
> First person told is one friend. Never the police.
> Police needs three signals agreeing, and a dropped phone gives one. So it can't reach them."

## Q: "They kidnap me and my bag with the phone falls on the road."

**This is the best question. Answer in this exact order.**

> "The struggle happens before the separation.
>
> She gets grabbed while the phone is still on her body. That's what starts the alert.
> The bag hits the ground six seconds later — by then we've already escalated.
> So we never needed the phone to stay with her."

**Then the clever part:**

> "And here's what I had to get right.
> A still phone on a bedside table means stand down.
> A still phone in the middle of a journey means she's been separated from it.
> Same reading. Opposite meaning. The situation decides."

**Then be honest — do not wait to be asked:**

> "Once she and the phone are apart, we cannot track her. No phone app can.
> Anyone who tells you otherwise is lying to you."

**Then recover — this is the winning line:**

> "What we give the police is the exact second and the exact junction.
>
> Without us: 'somewhere on her route, sometime between 11 at night and 7 in the morning.'
> That is dozens of cameras and eight hours of footage.
>
> With us: 23:47:12, one junction. Two or three cameras. Four minutes of footage.
> And the search starts in 90 seconds, not next morning.
>
> We don't say we'll find her. We say we'll tell you exactly where and when to start looking."

## Q: "What if there's no internet?"

> "Everything still works.
> The map is inside the app — 477 KB, downloaded once. The AI models run on the phone.
> The whole decision happens on the device.
>
> Only the final message needs a network. And if there's no data, it goes by SMS. 2G is enough.
>
> Turn on airplane mode right now and I'll run the whole demo again."

**Do it. Live. It's the strongest 20 seconds you have.**

## Q: "Won't the battery die?"

> "About 2% an hour, because by default we only use the accelerometer.
> Microphone is off unless you turn it on. GPS only runs during a journey.
>
> We took battery seriously because studies show it's one of the top reasons
> people uninstall these apps."

## Q: "How do I know you're not spying on me?"

> "There's no account. No email, no password, no sign-up on any server.
> Your identity is a key made on your phone that never leaves it.
> Your contacts are added by scanning a QR code — our server never sees them.
> The alert is encrypted so we cannot read it.
>
> Don't trust me. Open the network tab, scream at your phone, and see zero requests.
>
> We didn't promise not to misuse your data. We made it impossible for us to have it."

## Q: "This already exists. Safetipin does this."

> "Safetipin is good and it's real. But their map is built from user reports.
>
> Think about which streets women already avoid. The dangerous ones.
> So the dangerous streets get the fewest reports — and look safe on the map.
>
> A crowdsourced safety map is blindest exactly where danger is highest.
>
> We compute the map from open data instead. Ours works on day one with zero users.
> And their app still needs you to open it. Ours doesn't."

## Q: "What about false alarms?"

> "We designed for them instead of against them.
>
> A false alarm means one friend gets a message. A missed alarm means someone dies.
> So we tune for catching things, and we make cancelling easy — one tap, 10 seconds.
>
> We don't make false alarms impossible. We make them cheap."

## Q: "Does it run in the background with the screen off?"

**Be honest. This one is a trap.**

> "Not in the browser — no web app can. I'd rather tell you that than pretend.
>
> What you're seeing is the real algorithm on real sensor data.
> Background running is an Android foreground service in the native version.
> Same maths, same state machine.
>
> The hard part — telling a struggle from walking without a button — is what's running right here."

## Q: "What's your accuracy?"

**Never say 99%.**

> "For falls, about 85–95% catch rate when it's calibrated for that phone.
> For struggle versus walking, above 90%.
> Struggle versus running is harder, around 70–85% — that one's genuinely difficult.
> Screams versus cheering is our weakest case.
>
> Those are measured, not claimed. And that's exactly why no single signal
> can raise an alert on its own."

## Q: "Did you train on real attack data?"

> "No, and nobody has that data. It doesn't exist.
>
> So we flipped it. We train the model on normal behaviour only —
> walking, bus rides, phone in pocket, sitting still. 24,000 samples.
> Then anything it can't recognise is unusual.
>
> A calm walk scores 0.01. Being pulled into a car scores 1.00.
>
> We don't teach it what danger looks like. We teach it what you look like,
> and flag everything else."

## Q: "How will you make money?"

> "Free for users, forever. We sell the map, not the person.
>
> The city dashboard tells a corporation: if you can afford 200 streetlights,
> put them on these 10 roads first — here's the risk reduction per rupee.
>
> Safetipin already proved cities pay for this. Delhi found 7,483 dark spots and fixed 70%.
>
> The app helps one woman avoid one street tonight.
> The dashboard fixes the street so nobody has to avoid it next year."

## Q (Zoho judge): "Why should I be impressed?"

> "There is no OpenAI API key in this project.
>
> No paid AI service. No Google Maps. No Firebase. Three dependencies total.
> The model trains in five seconds on a laptop with numpy.
> The map is 477 KB inside the app. It works on 2G, offline, on a cheap phone.
>
> Everything is ours and everything is self-hosted."

---

# PART 4 — Tech stack, in plain English

**If they ask "what did you build it with," say this:**

> "Deliberately boring and deliberately ours. Nothing paid, nothing external."

| We used | What it is (simple) | Why we chose it |
|---|---|---|
| **React + TypeScript** | the thing that draws the screens | fast, standard, one file to deploy |
| **Vite** | packs the code into one bundle | instant reload while building |
| **Plain CSS** | our own styling | no library = small file, our own look |
| **OpenStreetMap** | free world map data | free, open, and we can read the details we need |
| **Overpass API** | the tool to download OSM data | ran once, saved the result in the app |
| **Hand-written SVG map** | we draw the streets ourselves | **no Google Maps, no API key, no internet needed** |
| **Dijkstra algorithm** | classic shortest-path maths | finds routes; we run it 6 times for safe vs fast |
| **Web Audio API** | built into every browser | listens on the phone, no upload |
| **DeviceMotion API** | built-in accelerometer access | real sensor, no app install needed |
| **Goertzel filter** | cheap way to check one frequency | 19× cheaper than a full FFT |
| **NumPy** | Python maths library | trained our AI model in 5 seconds |
| **Web Crypto API** | encryption built into the browser | real AES-256, no library to trust |
| **Service Worker** | makes a website work offline | the whole app runs with no internet |
| **FastAPI** (optional) | small Python server | the relay — under 60 lines |
| **Docker + nginx** | packaging to run anywhere | one command to deploy |

**The line to end on:**

> "Three runtime dependencies. No cloud AI. No paid APIs.
> You could run this whole thing on one small server, or on no server at all."

## If they ask about the AI specifically

| Model | Job | Simple explanation |
|---|---|---|
| **Autoencoder (9-5-3-5-9)** | spot unusual behaviour | learns what normal looks like, flags the rest |
| **Spectral entropy** | rhythm detector | tells walking from struggling |
| **Scream classifier** | audio | checks pitch, brightness and roughness |
| **Fusion function** | combines everything | 12 signals into one score, 0 to 1 |
| **State machine** | decides what to do | 5 steps from OFF to ALERT |

> "The autoencoder is a small neural network that squeezes your behaviour down to
> 3 numbers and tries to rebuild it. If it rebuilds it well, that's normal for you.
> If it can't, something unusual is happening. That's it. 24,000 training samples, numpy, 5 seconds."

---

# PART 5 — Words to swap

| Don't say | Say instead |
|---|---|
| "It prevents crime" | "It cuts detection time from hours to 90 seconds" |
| "99% accurate" | "85–95% on falls when calibrated, and here's our weak case" |
| "It's AI-powered" | "A small autoencoder trained on normal behaviour" |
| "We use machine learning" | name the model and the training data |
| "It's fully secure" | "No account, encrypted end-to-end, and here are 5 things we don't solve" |
| "It tracks you" | "Nothing leaves the phone until an alert fires" |
| "Real-time monitoring" | "On-device sensing. We never see it." |
| "Billion dollar market" | "Delhi fixed 7,483 dark spots. Cities already pay for this." |

---

# PART 6 — Safety net

**If you don't know an answer:**

> "I don't know that one. Let me tell you what I do know about it —"
> …then give the closest thing you *do* know.

Never guess. A judge respects "I don't know" and destroys a bluff.

**If the demo breaks:**

> "Give me ten seconds — everything runs offline, so it's just the browser."

Refresh. Keep talking while it loads. Have a screen recording on your phone as backup.

**If they challenge a number:**

> "That's measured, not estimated. I can show you the script that produces it."

**If two of you are presenting:** one person talks, one person drives the laptop. Never both talking.

---

# PART 7 — The 8 lines to memorise

1. "Every safety app asks you to press a button. We built one you never touch."
2. "The sensor doesn't measure movement, it measures push."
3. "Walking is music. A struggle is noise."
4. "A crowdsourced safety map is blindest exactly where danger is highest."
5. "We don't make false alarms impossible. We make them cheap."
6. "We didn't promise not to misuse your data. We made it impossible for us to have it."
7. "We don't teach it what danger looks like. We teach it what you look like."
8. "There is no OpenAI API key in this project."

**And the closing line, after the demo:**

> "She did nothing. She couldn't. That's the point."

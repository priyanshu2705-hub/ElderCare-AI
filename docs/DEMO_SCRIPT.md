# Demo script (about 4½ minutes)

**One-sentence pitch:** *"ElderCare AI turns confusing everyday situations into simple, spoken, actionable steps, and the senior, not the app, decides what the family sees."*

## Before you go on stage (10 minutes earlier)
1. `bash scripts/preflight.sh` and fix any ✗.
2. `cd backend && npm run seed`. This resets Dad's data so the demo starts clean.
3. Start MongoDB, backend, AI service, frontend. Open **http://localhost:5173** in **Chrome**.
4. **Window 1 (senior):** sign in with the **Senior** demo button. Tap the microphone once and click **Allow**. Turn the volume up. Zoom the browser to 110 to 125% for the room.
5. **Window 2 (family):** a private/incognito window, sign in with the **Family** demo button. Leave it on the *Overview* tab.
6. Have a real paper bill ready (or use **Try a sample bill**, which is clearly labelled "demo"). Put your phone in "do not disturb".
7. Check `http://localhost:8000/health`. If it says `demoMode: true`, everything still works. The on-screen labels will say "Demo mode", so say so confidently (see "If asked").

## The script
| Time | Scene | You say | You do | What the audience sees |
|---|---|---|---|---|
| 0:00 | **1. Problem** | "For many seniors, the problem isn't a lack of information. It's that everyday information has become hard to understand." | Hold up the paper bill (or show it on screen). | A dense, confusing document. |
| 0:30 | **2. Scan** | "Dad doesn't navigate menus. He just shows it." | Window 1 → **Understand Something** → **Take a photo** (or **Try a sample bill**). | "Reading your photo…" |
| 1:00 | **3. Simple explanation** | *(read the card aloud with it)* "This is your electricity bill. The amount is ₹1,240. Pay it before 15 October." | Point at: **What is this? / Amount / Due date / What should I do?** Tap **Read it to me**. | The card, spoken aloud. If demo mode: the yellow "sample" label. |
| 1:45 | **4. Voice** | "He doesn't even have to type." | Tap **Back**, tap the big microphone, say: **"Remind me tomorrow morning."** | "Okay. I'll remind you tomorrow at 9:00 AM: Pay electricity bill." and a green ✓ Saved. |
| 2:15 | **4b. Proof** | "And it's really stored." | **Today's Reminders** → show it listed under *Tomorrow*. | The reminder in the list. |
| 2:30 | **5. Emergency** | "Now the part that matters most." | Back to Home. Say **"I need help."** | The emergency screen opens by itself: *Are you in immediate danger?* |
| 2:50 | | "Notice it asks first. It never fakes a rescue." | Tap **YES — GET HELP**. Point at the contact **Call Rahul (Son)**, **112**, **108**, **Share My Location**, and the text **"No SMS or phone call was sent automatically."** *(Don't click the call buttons on a laptop.)* | Real call buttons plus an honest notice. |
| 3:20 | **6. Family dashboard** | "Rahul's phone shows what Dad chose to share." | Window 2 → click **Refresh**. Show the red **"Dad asked for help"** banner, then the **Reminders** tab (the new reminder and the doctor appointment), then the **Emergency** tab. | Live data from the same account. |
| 3:50 | **6b. Privacy** | "Family does **not** automatically see everything." | Window 2 → **Privacy** tab (✓ shared / 🔒 never stored). **Then in Window 1:** ⚙️ Settings → **Privacy** → switch **My reminders** OFF. Window 2 → **Refresh** → **Reminders** tab. | "Dad has not shared reminders with you." The data is gone from the family view, instantly. |
| 4:15 | **Close** | "ElderCare AI doesn't replace family, doctors, or caregivers. It gives seniors a simpler interface to the world around them, helping them stay independent for longer." | Return to the Home screen. | |

**Answers the cards give without you saying anything:** the emergency screen's honest notice, the "Never shared" box (photos and questions are never stored), and the medicine card's "check with your doctor or pharmacist".

## If something goes wrong (stay calm; each has a fallback)
| Problem | Do this |
|---|---|
| Microphone blocked / noisy room | Type the sentence in the box under the microphone. It runs the identical flow. |
| No internet | Demo mode still works fully (rule-based answers + sample bill). Say: "This is our offline demo mode. Labelled on screen." |
| Photo upload fails | Tap **Try a sample bill (demo)**. |
| Voice answers are silent | Click **Listen again** once (browsers need a click before speaking) or check volume. |
| Family window shows old data | Click **Refresh** (it also auto-refreshes every 30 s). |
| Anything weird | `cd backend && npm run seed`, reload both windows. |

## Optional extras (if you have time)
- **Explain Simply:** Understand Something → *Paste words to explain simply* → **Try an example** → *"Your insurance company may change the amount you pay next year."*
- **Reminder pop-up:** set a reminder for 2 minutes from now by voice; a large pop-up appears and is read aloud.
- **Accessibility:** ⚙️ Settings → **Huge** text, **High contrast** (the whole app changes instantly).
- **Safety:** say *"I have a headache. What disease do I have?"*. It will not diagnose and points to a doctor and to emergency help.

## Likely judge questions
- **"Isn't this just a chatbot?"** The AI stays in the background. The product is the interface: one big button, photo→card, honest emergency. The model can only request 8 whitelisted actions, and a separate server layer validates and performs them.
- **"What about privacy?"** Server-side filtering: switched-off data is never even queried. Photos and conversations aren't stored. Location only after a tap. The senior owns every switch.
- **"What if the AI is wrong?"** Confidence is shown; unreadable parts are listed; low-confidence photos are rejected with "take another photo"; medicine answers are limited to printed text and always point to a pharmacist; dosing questions are refused by fixed rules, not by the model.
- **"Does the emergency button actually alert my family?"** Honest answer: it saves the alert to their dashboard and gives one-tap calling. It does **not** send SMS in this MVP; that's the first thing we'd add (Twilio / push). We chose to say so on screen rather than pretend.
- **"Is the AI real?"** With an API key, the AI service uses Claude (vision + language). Without one, an offline demo mode runs and is labelled. *(Say which mode you're in.)*
- **"How would this scale or make money?"** Subscriptions for families; partnerships with insurers, banks and senior-care providers; localisation to regional languages.
- **"What are the limits?"** Reminders ring only while the app is open (push notifications are next); voice needs Chrome/Edge; no payments by design; family email linking isn't verified yet. Say these before they ask, since it builds trust.

# ElderCare AI

> *Helping seniors live independently, safely, and confidently.*

A voice-first assistant that turns confusing everyday situations (a bill, a medicine label, a notice, a reminder, an emergency) into simple, spoken, actionable guidance, with a separate family dashboard where **the senior decides what the family can see**.

**Status:** hackathon MVP. See [`docs/CHECKLIST.md`](docs/CHECKLIST.md) for exactly what is tested, what needs your first run, and what is not built. Presenting? See [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md).

---

## 1. Project overview
ElderCare AI helps older adults **Understand → Remember → Navigate → Communicate → Stay safe**. It is *not* a medical app and does not replace family, doctors or emergency services.

## 2. Problem statement
For many seniors the problem is not a lack of information. It is that everyday information (bills, notices, labels, apps) has become hard to understand, and the technology that holds it assumes small text, menus and typing.

## 3. Solution
- **Talk** (or type) instead of navigating menus.
- **Photograph** a paper and get a plain-language card: *what it is, amount, due date, what to do*.
- **Remember** things by voice ("Remind me to call my son at 7 PM").
- **Ask for help** with one big button, with honest, working call links.
- **Stay private:** family sees only what the senior switches on. Photos and conversations are never stored.

## 4. Features
| Feature | What it does |
|---|---|
| **Voice assistant** (home screen) | Big microphone, live transcript, spoken replies, always-visible typing box |
| **Understand Something** | Photo → OCR/vision → simple card, "Read it to me", one-tap reminder |
| **Explain Simply** | Paste hard words → plain language, key points, amounts, dates, action needed |
| **Daily life** | Reminders (by voice or screen), appointments and groceries (by voice), due-reminder pop-up with voice |
| **Emergency** | "Are you in immediate danger?" → call contacts / 112 / 108, share location (with permission), honest status |
| **Family dashboard** | Overview, Reminders, Emergency, Privacy tabs, filtered on the server |
| **Privacy controls** | Six plain-language switches; "Never shared" is explained |
| **Accessibility** | 3 text sizes, high contrast, voice speed/on-off, keyboard, ARIA, skip links, reduced motion |
| **Onboarding** | Welcome → how to talk to me → trusted contact → privacy |

## 5. Architecture
```
 React (Vite + Tailwind)                          Family dashboard
 Senior UI: voice, camera, big buttons            (read-only, permission-filtered)
        │  REST + JWT                                    │
        ▼                                                ▼
 ┌─────────────────────  Node.js / Express (:5000)  ─────────────────────┐
 │ auth · roles · validation · rate limits · upload checks               │
 │ TOOL EXECUTOR: the ONLY code that writes to the database for the AI   │
 │ PRIVACY FILTER: decides what the family dashboard may load            │
 └───────────────┬──────────────────────────────────────┬────────────────┘
        internal HTTP + key                       Mongoose
                 ▼                                      ▼
 ┌─────  FastAPI AI service (:8000)  ─────┐        MongoDB (:27017)
 │ safety pre-check → LLM → validate →    │
 │ safety post-check · vision · OCR hook  │   The AI service has NO database access.
 │ providers: anthropic | mock (demo)     │
 └────────────────────────────────────────┘
```
**Rule:** `AI → validated tool call → Express tool executor → database`. The model can only *request* one of 8 whitelisted tools.

## 6. Tech stack
React 18, React Router 6, Tailwind CSS 3, Vite 5, lucide-react · Node 18+/Express 4, Mongoose 8, JWT, bcryptjs, zod, helmet, multer, express-rate-limit · Python 3.10+, FastAPI, Pydantic 2, Pillow, Anthropic SDK · MongoDB 7 · Browser Web Speech API (voice in/out).

## 7. Folder structure
```
eldercare-ai/
├── frontend/            React app (src/: pages, components, layouts, hooks, context, services, utils)
├── backend/             Express API (routes, models, middleware, services, config, scripts/seed.js, tests)
├── ai-service/          FastAPI (routes, services, providers, prompts, schemas, utils, tests)
├── scripts/preflight.sh checks your machine before a demo
├── docs/                DEMO_SCRIPT.md, CHECKLIST.md
├── .env.example · docker-compose.yml · README.md
```
Route files in `backend/routes/` contain their handlers (no separate `controllers/` folder, to keep the MVP small).

## 8. Installation
You need **Node 18+**, **Python 3.10+**, and **MongoDB** (Docker is easiest). Use **Chrome or Edge** for voice. Then:
```bash
cp .env.example .env            # then edit JWT_SECRET (see section 9)
bash scripts/preflight.sh       # tells you what is missing at any time
```
**Option A: run the three services yourself (best for development)**
```bash
docker compose up -d mongo                                   # 1. database
cd backend && npm install && npm run seed && npm run dev     # 2. API        (terminal 1)
cd ai-service && python3 -m venv .venv && source .venv/bin/activate \
  && pip install -r requirements.txt && uvicorn main:app --port 8000   # 3. AI service (terminal 2)
cd frontend && npm install && npm run dev                    # 4. website    (terminal 3)  → http://localhost:5173
```
**Option B: everything in Docker**
```bash
docker compose --profile app up --build -d
docker compose --profile app run --rm backend npm run seed
# open http://localhost:8080
```
> Microphone, camera and location only work on **`localhost` or HTTPS**. Opening the site by a plain `http://192.168…` address on a phone will block them. See section 20 (tips) and deployment below.

## 9. Environment variables (`.env`, never committed)
| Variable | Used by | Meaning |
|---|---|---|
| `MONGODB_URI` | backend | e.g. `mongodb://localhost:27017/eldercare` (or an Atlas URI) |
| `JWT_SECRET` | backend | long random string. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. **Production refuses to start with the placeholder.** |
| `PORT`, `FRONTEND_URL`, `BACKEND_URL`, `DEFAULT_TIMEZONE` | backend | defaults: 5000, `http://localhost:5173`, `http://localhost:5000`, `Asia/Kolkata` |
| `AI_SERVICE_URL`, `AI_INTERNAL_KEY` | backend + AI | where the AI service lives, and a shared secret so only the backend can call it |
| `AI_PROVIDER` | AI service | `mock` (default, no key) or `anthropic` |
| `AI_API_KEY` | AI service | your key from https://console.anthropic.com. Stays on the server only |
| `AI_MODEL` | AI service | default `claude-sonnet-5-5` |
| `AI_TIMEOUT_SECONDS`, `OCR_HINTS` | AI service | optional |
| `VITE_API_URL` | frontend | leave empty in dev (Vite proxies `/api`) |

**No key? It still works.** With `AI_PROVIDER=mock` the app runs in **demo mode**: an offline rule engine handles reminders, lists, groceries and appointments; the photo flow returns a **sample bill**. Everything produced this way is **labelled "Demo mode"** on screen, never passed off as real AI.

## 10. Run the frontend
`cd frontend && npm install && npm run dev` → http://localhost:5173 · `npm run build` for production · `npm test` for unit tests.

## 11. Run the backend
`cd backend && npm install && npm run dev` (watch mode) or `npm start` · health check: `GET http://localhost:5000/api/health` · `npm test`.

## 12. Run the AI service
```bash
cd ai-service && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8000 --reload
```
`GET http://localhost:8000/health` shows `{"provider":"mock","demoMode":true}` or `anthropic`. Optional local OCR: install Tesseract + `pip install pytesseract`, set `OCR_HINTS=true`. The vision model reads images directly, so OCR is optional.

## 13. MongoDB setup
- **Docker:** `docker compose up -d mongo` (data persists in a volume; port bound to `127.0.0.1` only).
- **Atlas (free):** create a cluster, add a database user and your IP, copy the connection string into `MONGODB_URI`.
- **Collections** (created automatically): `users`, `elderprofiles`, `reminders`, `appointments`, `groceryitems`, `trustedcontacts`, `emergencyevents`, `privacysettings`, `activitylogs`. There is deliberately **no** `documents` or `conversations` collection.
- `npm run seed` (in `backend/`) recreates **only** the two demo accounts and their data. Run it right before a demo to reset.

## 14. Demo credentials *(demo data only; never use in production)*
| Role | Email | Password |
|---|---|---|
| Senior ("Dad") | `elder@example.com` | `Demo@1234` |
| Family ("Rahul", Dad's son) | `family@example.com` | `Demo@1234` |

The login page has one-tap buttons that fill these in. Seeded data: 3 reminders today (2 done, 1 pending), an electricity-bill reminder tomorrow, a doctor appointment next Friday, a grocery list, Rahul as emergency contact, one resolved past alert.

## 15. API documentation
All routes are under `/api`. Errors are `{ "error": { "message": "…friendly…" } }`; stack traces are never returned. Auth is `Authorization: Bearer <jwt>`.

| Method & path | Role | Purpose / body |
|---|---|---|
| `POST /auth/register` | public | `{name, email, password≥8, role: elder\|caregiver}` → `{token, user}` |
| `POST /auth/login` · `GET /auth/me` | public / any | sign in; current user |
| `GET/PUT /profile` | elder | accessibility, preferences, `onboardingDone` |
| `GET /reminders?scope=today\|upcoming\|all` · `POST` · `PUT /:id` · `DELETE /:id` | elder | `{title, description?, date YYYY-MM-DD, time HH:mm, category}`; `PUT` may set `status: pending\|done` |
| `GET/POST /appointments` · `DELETE /:id` | elder | `{title, date, time, location?}` |
| `GET/POST /grocery` · `PUT /:id {bought}` · `DELETE /:id` | elder | `{name, quantity?}` |
| `GET/POST /trusted-contacts` · `PUT/DELETE /:id` | elder | `{name, relationship?, phone, email?, emergencyContact}`; a caregiver account with the same email is linked automatically |
| `GET/PUT /privacy` | elder | `shareReminders, shareAppointments, shareGrocery, shareEmergencyEvents, shareActivity, allowLocationInEmergency` (`shareDocuments` can only be `false`) |
| `POST /emergency/trigger` | elder | `{triggerType: button\|voice\|text}` → event, contacts, numbers, honest `notice` |
| `GET /emergency` · `PUT /emergency/:id` | elder | history · `{status}` or `{locationShared, location:{lat,lng,accuracy}}` |
| `GET /caregiver/elders` · `GET /caregiver/dashboard?elderId=` | caregiver | **privacy-filtered** view; 403 for anyone not linked |
| `POST /ai/chat` | elder, 30/min | `{text≤500, topic?}` → `{intent, reply, tool?, action?, demoMode}` |
| `POST /ai/explain` | elder, 30/min | `{text≤4000}` → `{simpleExplanation, keyPoints, amounts, dates, actionRequired, uncertainty}` |
| `POST /documents/analyze` | elder, 30/min | multipart field `image` (JPG/PNG/WebP ≤5 MB, real file signature checked), or `?sample=true` → `{analysis}` |
| `GET /health` | public | `{ok:true}` |

*Internal (backend → AI service, header `x-internal-key`):* `POST /ai/chat`, `/ai/explain`, `/ai/analyze-document`, `/ai/analyze-document/sample`, and `GET /health` (open).

## 16. AI architecture
1. **Safety pre-check** (deterministic, no model): emergency phrases, symptom talk, dosage questions get fixed safe answers.
2. **Intent + tool request** by the LLM as strict JSON: `intent` ∈ DOCUMENT_EXPLANATION, IMAGE_UNDERSTANDING, REMINDER_CREATE, REMINDER_LIST, APPOINTMENT, GROCERY, SIMPLE_EXPLANATION, GENERAL_ASSISTANCE, EMERGENCY, UNKNOWN, and an optional `toolCall`.
3. **Validation:** unknown intents/tools dropped; low confidence → asks the person to repeat; emergencies never carry a tool.
4. **Tool executor (Express):** whitelist of 8 tools, arguments validated with zod, dates checked (not in the past). The spoken confirmation is built from **what was actually saved**.
5. **Safety post-check:** replies claiming "I called/sent/paid…" or containing dose amounts are replaced.
6. **Photos:** resize/EXIF-strip → quality check (too dark/tiny → "take another photo") → vision model → validated card. Medicine: only printed facts, dosing lines removed, pharmacist note added. Confidence < 0.4 → retake message, no invented details.

**Swapping the LLM:** add `ai-service/providers/<name>_provider.py` implementing `complete_json` (and `vision_json`) and register it in `providers/__init__.py`. Nothing else changes. If a real provider fails: chat falls back to the offline rules (labelled demo); **photos never fall back to fake results.**

## 17. Privacy design
- **Data minimisation:** photos are processed in memory and discarded; conversations are not stored; the activity log holds only lines like "Completed: Water the plants" (emergency lines are excluded from the activity feed).
- **Role-based access:** a caregiver sees an elder **only** if the elder listed their email as a trusted contact. No other way in.
- **Server-side filtering** (`services/privacyFilter.js`): sections the senior has switched off are **never queried**, not just hidden in the UI. Tested.
- **Location:** requested only after the senior taps *Share My Location*; stored only on that emergency event; family sees it only if the senior also allows it.
- **No hidden surveillance:** no background location, camera or microphone use.
- **Defaults to review:** the six sharing switches default to **ON**, but a family member sees nothing until the senior adds them, and onboarding step 4 shows every switch. If you prefer opt-in, change the defaults in `backend/models/PrivacySettings.js`.
- **Caregiver linking caveat:** email addresses are not verified in this MVP (someone who registers as a caregiver with a listed email gets access). Production needs invite codes or email verification.

## 18. Safety considerations
- ElderCare AI is **not** a doctor, pharmacist, bank or emergency service, and says so on screen.
- No diagnosis, no dosing advice, no payments (there is no payment code at all).
- **Emergency honesty:** the app saves the request and shows `tel:` call buttons (112 / 108 / contacts). It **does not send SMS or notify anyone automatically** and says so in text and speech. Family sees the alert on their dashboard; the banner tells them to *call*.
- Emergency detection runs in Express too, so it works even if the AI service is down; the emergency screen shows call buttons even if the server can't be reached.
- Uncertainty is shown, not hidden: low-confidence cards warn, unreadable parts are listed.

## 19. Future improvements
Real SMS/push alerts (Twilio/FCM + service worker so reminders ring when the app is closed) · PWA install · "Where are my glasses?" object finder · screens for the grocery list and appointments · Hindi and regional languages · caregiver invite codes / email verification · httpOnly-cookie sessions · family-to-senior messages · medication-reminder safety review with clinicians · automated end-to-end tests in CI.

## 20. Hackathon demo instructions
See **[`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md)** (scene-by-scene script, timings, fallbacks, judge Q&A).
Quick tips: run `bash scripts/preflight.sh` · `npm run seed` right before presenting · use Chrome/Edge · allow the microphone once beforehand · open the family dashboard in a second window or incognito · on a laptop don't click `tel:` links (they may open another app).

### Deploying beyond localhost
Use HTTPS (required for mic/camera/location). With Docker: set a real `JWT_SECRET` and `AI_INTERNAL_KEY` in `.env`, run `docker compose --profile app up --build -d`, and put a TLS proxy in front of port 8080, for example Caddy: `yourdomain.com { reverse_proxy localhost:8080 }`. The backend and AI service are not published to the host in this compose file.

### Tests
`cd backend && npm test` (privacy filter; no DB needed) · `cd ai-service && python3 tests/test_offline.py && python3 tests/test_vision_logic.py` · `cd frontend && npm test`.

---
*ElderCare AI doesn't replace family, doctors, or caregivers. It gives seniors a simpler interface to the world around them, helping them stay independent for longer.*

# ElderCare AI frontend (React + Vite + Tailwind)

    cd frontend
    npm install
    npm run dev          # http://localhost:5173  (proxies /api to the backend on :5000)

Needs the backend (`npm run dev` in /backend) and, for AI answers, the AI service (see /ai-service). 
Use **Chrome or Edge** for voice input (Firefox has no speech recognition; the typing box always works).
Microphone, camera and location need `localhost` or HTTPS.

Tests: `npm test` (date/time helpers).

#!/usr/bin/env bash
# Run before a demo:  bash scripts/preflight.sh
# Checks your computer is ready. Changes nothing.
cd "$(dirname "$0")/.." || exit 1
bad=0; ok() { echo "  ✓ $1"; }; no() { echo "  ✗ $1"; bad=$((bad+1)); }; warn() { echo "  ! $1"; }

echo "Tools"
if command -v node >/dev/null; then v=$(node -p "process.versions.node.split('.')[0]"); [ "$v" -ge 18 ] && ok "Node $(node -v)" || no "Node 18+ needed (you have $(node -v))"; else no "Node.js not found (https://nodejs.org)"; fi
if command -v python3 >/dev/null; then python3 -c "import sys; sys.exit(0 if sys.version_info >= (3,10) else 1)" && ok "$(python3 --version)" || no "Python 3.10+ needed ($(python3 --version))"; else no "Python 3 not found"; fi
command -v docker >/dev/null && ok "Docker found (optional: easiest way to run MongoDB)" || warn "Docker not found. You can use MongoDB Atlas or a local install instead."

echo "Settings (.env)"
if [ -f .env ]; then
  ok ".env exists"
  get() { grep -E "^$1=" .env | head -1 | cut -d= -f2-; }
  js=$(get JWT_SECRET); [ -z "$js" ] && no "JWT_SECRET is empty" || { echo "$js" | grep -qi "change-me" && warn "JWT_SECRET is still the placeholder (OK for a local demo, not for deployment)" || ok "JWT_SECRET is set"; }
  [ -z "$(get MONGODB_URI)" ] && no "MONGODB_URI is empty" || ok "MONGODB_URI is set"
  prov=$(get AI_PROVIDER); key=$(get AI_API_KEY)
  if [ "$prov" = "anthropic" ] && [ -z "$key" ]; then warn "AI_PROVIDER=anthropic but AI_API_KEY is empty -> the AI service will run in DEMO mode"
  elif [ "$prov" = "anthropic" ]; then ok "Real AI is configured (provider: anthropic)"
  else warn "AI_PROVIDER=${prov:-mock} -> DEMO mode (built-in answers, sample bill). Fine for a demo, and the app labels it."; fi
else no ".env is missing. Run:  cp .env.example .env"; fi

echo "Installed packages"
[ -d backend/node_modules ] && ok "backend packages installed" || no "run:  cd backend && npm install"
[ -d frontend/node_modules ] && ok "frontend packages installed" || no "run:  cd frontend && npm install"
if [ -d ai-service/.venv ]; then ok "AI service virtual environment exists"; else no "run:  cd ai-service && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"; fi

echo "Running services"
port() { (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null && { exec 3>&- 3<&-; return 0; } || return 1; }
port 27017 && ok "MongoDB is reachable on :27017" || no "MongoDB is not running. Run:  docker compose up -d mongo"
port 5000 && ok "Backend is running on :5000" || warn "Backend is not running yet (cd backend && npm run dev)"
port 8000 && ok "AI service is running on :8000" || warn "AI service is not running yet (cd ai-service && uvicorn main:app --port 8000)"
port 5173 && ok "Frontend is running on :5173" || warn "Frontend is not running yet (cd frontend && npm run dev)"

echo; [ "$bad" -eq 0 ] && echo "Ready. (Warnings are OK.)" || echo "$bad problem(s) to fix above."
exit $bad

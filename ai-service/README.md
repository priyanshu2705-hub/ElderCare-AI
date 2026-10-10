# ElderCare AI service (FastAPI)

    cd ai-service
    python3 -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
    pip install -r requirements.txt
    uvicorn main:app --port 8000 --reload

Runs in **demo mode** (offline rule engine, no key) by default. For real AI set in the root `.env`:

    AI_PROVIDER=anthropic
    AI_API_KEY=sk-ant-...        # https://console.anthropic.com
    AI_MODEL=claude-sonnet-5-5

Tests (no packages needed): `python3 tests/test_offline.py` and `python3 tests/test_vision_logic.py`

To add another LLM: create `providers/<name>_provider.py` implementing `complete_json` (and `vision_json`), then register it in `providers/__init__.py`.

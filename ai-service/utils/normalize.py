"""Validate and clean what the LLM (or rule engine) returned. Never trust model output."""
from services.safety import INTENTS

TOOL_NAMES = {
    "createReminder", "listReminders", "completeReminder", "addGroceryItem",
    "createAppointment", "getUpcomingAppointments", "getTrustedContacts", "getPrivacySettings",
}
ASK_AGAIN = "I want to be sure I understood. Could you say that again, a little slower?"


def normalize_chat(raw: dict) -> dict:
    intent = str(raw.get("intent", "UNKNOWN")).upper()
    if intent not in INTENTS:
        intent = "UNKNOWN"
    try:
        confidence = max(0.0, min(1.0, float(raw.get("confidence", 0.5))))
    except (TypeError, ValueError):
        confidence = 0.5

    tool = raw.get("toolCall")
    tool_call = None
    if isinstance(tool, dict) and tool.get("name") in TOOL_NAMES and isinstance(tool.get("args", {}), dict):
        tool_call = {"name": tool["name"], "args": tool.get("args", {})}

    reply = str(raw.get("reply") or "")
    if tool_call and confidence < 0.35:          # unsure -> ask instead of acting
        tool_call, reply = None, ASK_AGAIN
    if intent == "EMERGENCY":
        tool_call = None

    action = raw.get("action") if raw.get("action") == "OPEN_CAMERA" else None
    return {"intent": intent, "reply": reply, "toolCall": tool_call, "confidence": confidence, "action": action}

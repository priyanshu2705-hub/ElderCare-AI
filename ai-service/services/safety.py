"""Deterministic safety rules. They run BEFORE and AFTER the LLM, so safety never
depends on the model behaving. Pure Python, no third-party imports."""
import re

INTENTS = [
    "DOCUMENT_EXPLANATION", "IMAGE_UNDERSTANDING", "REMINDER_CREATE", "REMINDER_LIST", "APPOINTMENT",
    "GROCERY", "SIMPLE_EXPLANATION", "GENERAL_ASSISTANCE", "EMERGENCY", "UNKNOWN",
]

EMERGENCY_RE = re.compile(
    r"\b(emergency|i need help(?!\s+(with|to|in|understanding|reading|finding|figuring))|need help now|"
    r"i('| ha)ve fallen|i fell|can'?t breathe|cannot breathe|chest pain|heart attack|call (an )?ambulance|someone help)\b",
    re.I,
)
SERIOUS_RE = re.compile(r"chest pain|breathe|heart attack", re.I)

# First-person symptom talk, or "what disease do I have" style questions
SYMPTOM_RE = re.compile(
    r"(\bi (have|am having|feel|am feeling|got|keep getting)\b.*\b(pain|ache|dizz|fever|vomit|bleed|faint|headache|numb|swollen|"
    r"swelling|nausea|cough|weak|breathless|rash|cramp)\w*)"
    r"|(\bmy\b.*\b(hurts?|aching|paining|swollen|bleeding)\b)"
    r"|(\bwhat (disease|illness|condition|is wrong with me)\b)|(\bdo i have (cancer|diabetes|a tumou?r|a stroke|an infection)\b)|\bdiagnos\w*",
    re.I,
)
DOSAGE_RE = re.compile(
    r"(\bhow (many|much|often)\b.*\b(tablets?|pills?|capsules?|medicine|medication|drops|syrup|insulin|dose)\b)"
    r"|(\b(tablets?|pills?|capsules?|medicine|medication|insulin)\b.*\b(how many|how much|how often|dosage|dose)\b)"
    r"|(\bcan i (take|stop|skip|double|mix)\b.*\b(tablets?|pills?|medicine|medication|insulin)\b)"
    r"|\bwhat dose\b|\bdosage\b",
    re.I,
)

MEDICAL_EMERGENCY_REPLY = (
    "Chest pain and trouble breathing can be serious. I am opening the emergency screen. "
    "Please call 112 or your family right now."
)
EMERGENCY_REPLY = "I am here to help. I will open the emergency screen now."
SYMPTOM_REPLY = (
    "I'm sorry you are not feeling well. I can't tell what is causing it, and I am not a doctor. "
    "Please speak to a doctor or pharmacist soon. If it is severe, sudden, or you find it hard to breathe, "
    "tap I NEED HELP or call 112 right away."
)
DOSAGE_REPLY = (
    "I can't tell you how much medicine to take or when. Please follow your doctor's prescription, "
    "or ask your pharmacist. If you like, take a photo of the box and I will read what is printed on it."
)
SAFE_NO_ACTION = "I can't do that myself, but I can show you how. What would you like to do?"
DOSE_REDIRECT = "Please ask your doctor or pharmacist about the right amount."

ACTION_CLAIM_RE = re.compile(r"\b(i('| ha)ve|i)\s+(just\s+|already\s+)?(called|sent|texted|paid|booked|alerted|notified|messaged|transferred)\b", re.I)
DOSE_NUMBER_RE = re.compile(r"\b\d+(\.\d+)?\s?(mg|mcg|ml|tablets?|pills?|capsules?|drops)\b", re.I)
# "take 2 tablets", "once a day", "twice daily" style instructions
DOSE_INSTRUCTION_RE = re.compile(
    r"\b(take|use|apply|swallow|chew|inject)\b.*\b(\d+|one|two|three|once|twice|daily|times|morning|night|before|after)\b"
    r"|\b(once|twice|thrice)\s+(a\s+)?(day|daily)\b|\b\d+\s+times\b", re.I)


def pre_check(text: str):
    """Return a ready-made chat result if the message needs a fixed, safe answer, else None."""
    if EMERGENCY_RE.search(text):
        reply = MEDICAL_EMERGENCY_REPLY if SERIOUS_RE.search(text) else EMERGENCY_REPLY
        return {"intent": "EMERGENCY", "reply": reply, "toolCall": None, "confidence": 1.0, "action": None}
    if SYMPTOM_RE.search(text):
        return {"intent": "GENERAL_ASSISTANCE", "reply": SYMPTOM_REPLY, "toolCall": None, "confidence": 1.0, "action": None}
    if DOSAGE_RE.search(text):
        return {"intent": "GENERAL_ASSISTANCE", "reply": DOSAGE_REPLY, "toolCall": None, "confidence": 1.0, "action": None}
    return None


def sanitize_reply(reply: str, has_tool: bool) -> str:
    """Post-check on whatever the LLM said."""
    reply = (reply or "").strip()
    if not reply:
        return "I'm sorry, I did not understand. Could you say that another way?"
    if not has_tool and ACTION_CLAIM_RE.search(reply):
        return SAFE_NO_ACTION            # the model claimed an action it cannot perform
    if DOSE_NUMBER_RE.search(reply):
        return DOSE_REDIRECT             # never give amounts in chat answers
    return reply[:600]

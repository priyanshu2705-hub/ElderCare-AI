"""Offline assistant used in DEMO mode (no API key) and as a fallback when the LLM is
unreachable. It understands the common requests well enough to demo the whole app.
Pure Python, returns plain dicts."""
import re
from datetime import date, timedelta

MONTHS = {m: i + 1 for i, m in enumerate(
    ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"])}
MONTH_RE = "|".join(MONTHS)
WEEKDAYS = {"monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6}
WD_RE = "|".join(WEEKDAYS)
MER = r"(a\.?m\.?|p\.?m\.?)"


# ---------- date / time parsing ----------
def parse_date(text: str, today_str: str):
    t, today = text.lower(), date.fromisoformat(today_str)
    if "day after tomorrow" in t:
        return today + timedelta(days=2)
    if re.search(r"\btomorrow\b", t):
        return today + timedelta(days=1)
    if re.search(r"\b(today|tonight|this (morning|afternoon|evening))\b", t):
        return today
    m = re.search(rf"\b(\d{{1,2}})(?:st|nd|rd|th)?\s+(?:of\s+)?({MONTH_RE})\b", t)
    m2 = re.search(rf"\b({MONTH_RE})\s+(\d{{1,2}})(?:st|nd|rd|th)?\b", t)
    if m or m2:
        day, month = (int(m[1]), MONTHS[m[2]]) if m else (int(m2[2]), MONTHS[m2[1]])
        try:
            d = date(today.year, month, day)
            return d if d >= today else date(today.year + 1, month, day)
        except ValueError:
            return None
    m = re.search(rf"\b({WD_RE})\b", t)
    if m:
        diff = (WEEKDAYS[m[1]] - today.weekday()) % 7 or 7
        return today + timedelta(days=diff)
    if "next week" in t:
        return today + timedelta(days=7)
    return None


def _hour_no_meridiem(h: int) -> int:
    if h >= 13 or h == 0:
        return h % 24
    if h == 12:
        return 12
    return h + 12 if h <= 8 else h        # 1-8 -> PM (call at 7 = 19:00), 9-11 -> AM


def parse_time(text: str):
    t = text.lower()
    m = re.search(rf"\b(\d{{1,2}})(?::(\d{{2}}))?\s*{MER}(?![a-z])", t)
    if m and 1 <= int(m[1]) <= 12:
        h, mi = int(m[1]) % 12, int(m[2] or 0)
        return f"{h + (12 if m[3].startswith('p') else 0):02d}:{mi:02d}"
    m = re.search(r"\b([01]?\d|2[0-3]):([0-5]\d)\b", t)
    if m:
        return f"{int(m[1]):02d}:{m[2]}"
    m = re.search(r"\b(\d{1,2})\s*o'?clock\b", t) or re.search(
        rf"\bat\s+(\d{{1,2}})(?!\d)(?!\s*(?:st|nd|rd|th|{MONTH_RE}))", t)
    if m and int(m[1]) <= 23:
        return f"{_hour_no_meridiem(int(m[1])):02d}:00"
    for word, hhmm in (("noon", "12:00"), ("morning", "09:00"), ("afternoon", "15:00"), ("evening", "18:00"), ("tonight", "20:00"), ("night", "20:00")):
        if re.search(rf"\b{word}\b", t):
            return hhmm
    return None


STRIP_PATTERNS = [
    r"\bday after tomorrow\b", r"\btomorrow\b", r"\btoday\b", r"\btonight\b",
    r"\b(this|in the)\s+(morning|afternoon|evening)\b", r"\b(morning|afternoon|evening|noon)\b",
    rf"\b(next\s+|on\s+)?({WD_RE})\b", r"\bnext week\b",
    rf"\bat\s+\d{{1,2}}(:\d{{2}})?\s*{MER}?", rf"\b\d{{1,2}}(:\d{{2}})?\s*{MER}", r"\b\d{1,2}\s*o'?clock\b",
    rf"\b\d{{1,2}}(st|nd|rd|th)?\s+(of\s+)?({MONTH_RE})\b", rf"\b({MONTH_RE})\s+\d{{1,2}}(st|nd|rd|th)?\b",
    r"\bplease\b", r"\b(can|could) you\b", r"^(me\s+)?(to|about|that)\s+",
]


def clean_title(text: str) -> str:
    s = text
    for p in STRIP_PATTERNS:
        s = re.sub(p, " ", s, flags=re.I)
    s = re.sub(r"\s+", " ", s).strip(" ,.-")
    s = re.sub(r"\s+(on|at|for|by|in)$", "", s, flags=re.I)
    s = re.sub(r"^(to|about|that)\s+", "", s, flags=re.I)
    return (s[:1].upper() + s[1:]) if s else ""


def _guess_category(title: str) -> str:
    t = title.lower()
    if re.search(r"\b(bill|pay|rent|premium)\b", t): return "bill"
    if re.search(r"\b(call|phone|ring)\b", t): return "call"
    if re.search(r"\b(medicine|tablet|pill|capsule)\b", t): return "medicine"
    if re.search(r"\b(doctor|appointment|clinic|hospital)\b", t): return "appointment"
    return "general"


def _res(intent, reply, tool=None, args=None, conf=0.8, action=None):
    return {"intent": intent, "reply": reply, "toolCall": {"name": tool, "args": args or {}} if tool else None,
            "confidence": conf, "action": action}


def _reminder_for(subject: str, text: str, ctx: dict):
    """Shared by 'remind me ...' and 'my X bill is due ...'."""
    today, now = ctx["today"], ctx.get("nowTime", "09:00")
    title = subject or (ctx.get("recentTopic") or "").strip()
    if not title:
        return _res("REMINDER_CREATE", "Sure. What should I remind you about?", conf=0.6)
    d, t = parse_date(text, today), parse_time(text)
    if d is None and t is None:
        return _res("REMINDER_CREATE", "Sure. When should I remind you?", conf=0.6)
    if d is None:
        d = date.fromisoformat(today) + timedelta(days=0 if t > now else 1)
    if t is None:
        t = "09:00"
        if d.isoformat() == today and t <= now:
            return _res("REMINDER_CREATE", "What time today should I remind you?", conf=0.6)
    args = {"title": title, "date": d.isoformat(), "time": t, "category": _guess_category(title)}
    return _res("REMINDER_CREATE", "Okay, I will set that reminder.", "createReminder", args, 0.85)


# ---------- main entry ----------
def handle_chat(text: str, ctx: dict) -> dict:
    t = text.lower().strip()
    today = ctx["today"]

    # reminders: create
    # (search the ORIGINAL text so names like "Rahul" keep their capital letters)
    m = re.search(r"\b(?:remind me|set (?:a |an )?reminder|don'?t let me forget)\b(.*)", text.strip(), re.I)
    if m:
        return _reminder_for(clean_title(m[1]), t, ctx)

    # "my electricity bill is due tomorrow"
    m = re.search(r"\b(?:my\s+)?([a-z]+(?:\s[a-z]+)?)?\s*bill\b.*\bdue\b", t)
    if m and not re.search(r"\b(when|what)\b", t):
        kind = (m[1] or "").replace("my ", "").strip()
        kind = re.sub(r"^(the|my|an?)\s+", "", kind)
        subject = f"Pay {kind} bill".replace("  ", " ") if kind else "Pay bill"
        return _reminder_for(subject, t, ctx)

    # completing things
    m = re.search(r"\bmark\s+(.+?)\s+(?:as\s+)?(?:done|finished|complete|completed)\b", t)
    if m:
        return _res("REMINDER_LIST", "Okay.", "completeReminder", {"titleMatch": m[1].replace("my ", "")}, 0.8)
    m = re.search(r"\bi(?:'ve| have)?\s+(?:already\s+)?(called|paid|finished|done)\s*(.*)", t)
    if m:
        key = {"called": "call", "paid": "pay"}.get(m[1]) or (m[2].replace("my ", "").strip() or "")
        if key:
            return _res("REMINDER_LIST", "Okay.", "completeReminder", {"titleMatch": key}, 0.7)

    # grocery
    m = re.search(r"\b(?:add|put)\s+(.+?)\s+(?:to|on|in)\s+(?:my\s+)?(?:grocery|shopping)(?:\s+list)?", t) or \
        re.search(r"\b(?:i need to buy|need to buy|buy)\s+(.+)", t)
    if m:
        name = re.sub(r"^(some|a|an)\s+", "", m[1].strip(" .,"))
        if name:
            return _res("GROCERY", "Okay.", "addGroceryItem", {"name": name[:80]}, 0.8)

    # appointments
    if re.search(r"\b(appointment|doctor|dentist|clinic)\b", t):
        if re.search(r"\b(when|what|do i have|any|next|upcoming)\b", t):
            return _res("APPOINTMENT", "Let me check.", "getUpcomingAppointments", {}, 0.8)
        d = parse_date(t, today)
        if d:
            kind = "Dentist" if "dentist" in t else "Doctor" if "doctor" in t else "Clinic" if "clinic" in t else ""
            title = f"{kind} appointment".strip().capitalize()
            return _res("APPOINTMENT", "Okay.", "createAppointment",
                        {"title": title, "date": d.isoformat(), "time": parse_time(t) or "10:00"}, 0.75)

    # listing
    if re.search(r"(what (do i|should i|have i got).*(today|to do|need)|my reminders|any reminders|what('s| is) (on )?(my )?(today|schedule)|what do i need to do|when is my .* due)", t):
        scope = "upcoming" if re.search(r"upcoming|coming up|this week|\bdue\b|tomorrow", t) else "today"
        return _res("REMINDER_LIST", "Let me check.", "listReminders", {"scope": scope}, 0.8)

    # privacy / contacts
    if re.search(r"\b(privacy|can (my )?(family|son|daughter) see|who can see)\b", t):
        return _res("GENERAL_ASSISTANCE", "Let me check.", "getPrivacySettings", {}, 0.8)
    if re.search(r"\b(trusted contacts?|emergency contacts?|who are my contacts)\b", t):
        return _res("GENERAL_ASSISTANCE", "Let me check.", "getTrustedContacts", {}, 0.8)

    # camera-based requests
    if re.search(r"where (are|is|did i (keep|put|leave))\b.*\bmy\b", t):
        return _res("IMAGE_UNDERSTANDING",
                    "I do not keep track of where things are. If you take a photo of the room, I will tell you only what I can actually see.",
                    action="OPEN_CAMERA")
    if re.search(r"\b(medicine|tablet|pill|capsule|strip)\b", t):
        return _res("IMAGE_UNDERSTANDING",
                    "Please take a photo of the medicine box or strip. I can read what is printed on it. For how to take it, please ask your doctor or pharmacist.",
                    action="OPEN_CAMERA")
    if re.search(r"\b(this paper|this letter|this bill|this document|this notice|read this|what does this|explain this|what is this|error)\b", t):
        return _res("DOCUMENT_EXPLANATION", "Please take a photo of it. I will explain it in simple words.", action="OPEN_CAMERA")
    if re.search(r"\b(simple words|explain simply|simple explanation|in simple)\b", t):
        return _res("SIMPLE_EXPLANATION", "Please take a photo of the paper, and I will explain it in simple words.", action="OPEN_CAMERA")

    # small talk
    if re.search(r"\bwhat('s| is)? the time\b|\bwhat time is it\b", t):
        return _res("GENERAL_ASSISTANCE", f"It is {_say_time(ctx.get('nowTime', '09:00'))}.", conf=0.9)
    if re.search(r"\b(what day|which day|what('s| is) the date|today'?s date)\b", t):
        d = date.fromisoformat(today)
        return _res("GENERAL_ASSISTANCE", f"Today is {d.strftime('%A')}, {d.day} {d.strftime('%B')}.", conf=0.9)
    if re.search(r"\b(thank you|thanks)\b", t):
        return _res("GENERAL_ASSISTANCE", "You are most welcome.", conf=0.9)
    if re.search(r"^(hi|hello|hey|good (morning|afternoon|evening|night))\b", t):
        return _res("GENERAL_ASSISTANCE", f"Hello {ctx.get('elderName', '')}. How can I help you?".replace("  ", " "), conf=0.9)

    return _res("UNKNOWN", "I am not sure I understood. You can ask me to set a reminder, read a paper, or say I need help.", conf=0.3)


def _say_time(hhmm: str) -> str:
    h, m = map(int, hhmm.split(":"))
    return f"{h % 12 or 12}:{m:02d} {'PM' if h >= 12 else 'AM'}"


# ---------- plain-language fallback for /ai/explain ----------
AMOUNT_RE = re.compile(r"(?:₹|rs\.?|inr)\s?[\d,]+(?:\.\d+)?", re.I)
DATE_RE = re.compile(rf"\b\d{{1,2}}(?:st|nd|rd|th)?\s+(?:{MONTH_RE})(?:\s+\d{{4}})?\b|\b\d{{1,2}}[/-]\d{{1,2}}[/-]\d{{2,4}}\b", re.I)


def explain_text(text: str) -> dict:
    t = text.lower()
    amounts, dates = AMOUNT_RE.findall(text), DATE_RE.findall(text)
    if "premium" in t and ("revision" in t or "revised" in t):
        return {
            "simpleExplanation": "Your insurance company may change the amount you pay next year. Check the new amount when you receive your renewal notice.",
            "keyPoints": ["The price of your insurance may change.", "Look at the renewal notice for the new amount."],
            "amounts": amounts, "dates": dates, "actionRequired": True, "uncertainty": None,
        }
    return {
        "simpleExplanation": "I found some details in this text. In demo mode I cannot rewrite it in simple words. Connect an AI key for a full explanation.",
        "keyPoints": ([f"Amount mentioned: {a}" for a in amounts[:3]] + [f"Date mentioned: {d}" for d in dates[:3]]),
        "amounts": amounts, "dates": dates,
        "actionRequired": bool(dates) or bool(re.search(r"\b(pay|payment|due|deadline|last date)\b", t)),
        "uncertainty": "Demo mode: only amounts and dates were picked out automatically.",
    }

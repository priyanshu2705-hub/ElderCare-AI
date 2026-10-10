from typing import Any, Optional

from pydantic import BaseModel, Field


class ChatContext(BaseModel):
    elderName: str = "friend"
    today: str                      # YYYY-MM-DD in the elder's timezone
    nowTime: str = "09:00"          # HH:mm
    timezone: str = "Asia/Kolkata"
    todaysReminders: list[dict[str, Any]] = []
    recentTopic: Optional[str] = None


class ChatRequest(BaseModel):
    text: str = Field(min_length=1, max_length=500)
    context: ChatContext


class ToolCall(BaseModel):
    name: str
    args: dict[str, Any] = {}


class ChatResponse(BaseModel):
    intent: str
    reply: str
    toolCall: Optional[ToolCall] = None
    confidence: float = 0.5
    action: Optional[str] = None    # only "OPEN_CAMERA"
    demoMode: bool = False


class ExplainRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


class ExplainResponse(BaseModel):
    simpleExplanation: str
    keyPoints: list[str] = []
    amounts: list[str] = []
    dates: list[str] = []
    actionRequired: bool = False
    uncertainty: Optional[str] = None
    demoMode: bool = False


class SuggestedReminder(BaseModel):
    title: str
    date: str
    time: str = "09:00"


class DocumentAnalysis(BaseModel):
    documentType: str = "Unknown paper"
    category: str = "other"
    amount: Optional[str] = None
    dueDate: Optional[str] = None
    importantPoints: list[str] = []
    simpleExplanation: str
    actionRequired: bool = False
    confidence: float = 0.5
    unreadableParts: list[str] = []
    suggestedReminder: Optional[SuggestedReminder] = None
    needsRetake: bool = False
    safetyNote: Optional[str] = None
    demoMode: bool = False
    demoNote: Optional[str] = None
    sample: bool = False

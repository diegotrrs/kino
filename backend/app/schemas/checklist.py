import re
from datetime import datetime

from pydantic import BaseModel, field_validator

MAX_CHECKLIST_ITEM_LENGTH = 200
MAX_CHECKLIST_ITEMS = 100


class ChecklistItemCreate(BaseModel):
    text: str

    @field_validator("text")
    @classmethod
    def clean_text(cls, v: str) -> str:
        cleaned = re.sub(r"<[^>]+>", "", v).strip()
        if not cleaned:
            raise ValueError("Text must not be empty")
        if len(cleaned) > MAX_CHECKLIST_ITEM_LENGTH:
            raise ValueError(f"Text must be at most {MAX_CHECKLIST_ITEM_LENGTH} characters")
        return cleaned


class ChecklistItemResponse(BaseModel):
    id: int
    text: str
    is_done: bool
    position: int
    created_at: datetime
    updated_at: datetime | None

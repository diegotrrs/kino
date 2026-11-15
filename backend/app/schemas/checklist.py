import re
from datetime import datetime

from pydantic import BaseModel, Field, field_validator, model_validator

MAX_CHECKLIST_ITEM_LENGTH = 200
MAX_CHECKLIST_ITEMS = 100


def _clean_text(v: str) -> str:
    cleaned = re.sub(r"<[^>]+>", "", v).strip()
    if not cleaned:
        raise ValueError("Text must not be empty")
    if len(cleaned) > MAX_CHECKLIST_ITEM_LENGTH:
        raise ValueError(f"Text must be at most {MAX_CHECKLIST_ITEM_LENGTH} characters")
    return cleaned


class ChecklistItemCreate(BaseModel):
    text: str

    @field_validator("text")
    @classmethod
    def clean_text(cls, v: str) -> str:
        return _clean_text(v)


class ChecklistItemUpdate(BaseModel):
    text: str | None = None
    is_done: bool | None = None

    # Validators skip unset defaults, so a None here was sent explicitly
    @field_validator("text")
    @classmethod
    def clean_text(cls, v: str | None) -> str:
        if v is None:
            raise ValueError("Text must not be null")
        return _clean_text(v)

    @field_validator("is_done")
    @classmethod
    def require_is_done(cls, v: bool | None) -> bool:
        if v is None:
            raise ValueError("is_done must not be null")
        return v

    @model_validator(mode="after")
    def require_a_change(self) -> "ChecklistItemUpdate":
        if not self.model_fields_set:
            raise ValueError("Send text or is_done")
        return self


class ChecklistOrder(BaseModel):
    item_ids: list[int] = Field(..., max_length=MAX_CHECKLIST_ITEMS)

    @field_validator("item_ids")
    @classmethod
    def reject_duplicates(cls, v: list[int]) -> list[int]:
        if len(set(v)) != len(v):
            raise ValueError("Each item may appear only once")
        return v


class ChecklistItemResponse(BaseModel):
    id: int
    text: str
    is_done: bool
    position: int
    created_at: datetime
    updated_at: datetime | None

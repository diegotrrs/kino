import re
from datetime import date

from pydantic import BaseModel, field_validator

MAX_DAY_NAME_LENGTH = 60


class DayNameSet(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        cleaned = re.sub(r"<[^>]+>", "", v).strip()
        if not cleaned:
            raise ValueError("Name must not be empty")
        if len(cleaned) > MAX_DAY_NAME_LENGTH:
            raise ValueError(f"Name must be at most {MAX_DAY_NAME_LENGTH} characters")
        return cleaned


class DayNameResponse(BaseModel):
    date: date
    name: str

import re
from datetime import date as Date
from datetime import datetime
from datetime import time as Time
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

TravelMode = Literal["flight", "train"]

# Which ticket fields each travel mode has; anything else is rejected rather than stored
TRAVEL_FIELDS_BY_MODE: dict[str, frozenset[str]] = {
    "flight": frozenset({"origin", "destination", "number", "terminal", "gate", "seat", "booking_reference"}),
    "train": frozenset({"origin", "destination", "coach", "seat", "booking_reference"}),
}


class EventExpenseCreate(BaseModel):
    label: str
    amount: float
    currency: str

    @field_validator('amount')
    @classmethod
    def amount_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError('amount must be greater than 0')
        return v


class EventExpenseResponse(BaseModel):
    id: int
    event_id: int
    label: str
    amount: float
    currency: str
    created_at: datetime


class EventLinkCreate(BaseModel):
    url: str


class EventLinkResponse(BaseModel):
    id: int
    event_id: int
    url: str
    title: str | None = None
    created_at: datetime


class TravelDetailsIn(BaseModel):
    origin: str | None = Field(None, max_length=60)
    destination: str | None = Field(None, max_length=60)
    number: str | None = Field(None, max_length=10)
    terminal: str | None = Field(None, max_length=10)
    gate: str | None = Field(None, max_length=10)
    coach: str | None = Field(None, max_length=10)
    seat: str | None = Field(None, max_length=10)
    booking_reference: str | None = Field(None, max_length=20)

    # Runs before the length limits, so they apply to the cleaned text
    @field_validator("*", mode="before")
    @classmethod
    def clean_text(cls, v: object) -> object:
        if not isinstance(v, str):
            return v
        cleaned = re.sub(r"<[^>]+>", "", v).strip()
        return cleaned or None


class TravelDetailsOut(BaseModel):
    origin: str | None = None
    destination: str | None = None
    number: str | None = None
    terminal: str | None = None
    gate: str | None = None
    coach: str | None = None
    seat: str | None = None
    booking_reference: str | None = None


def _check_travel(travel_mode: str | None, travel: TravelDetailsIn | None) -> None:
    if travel is None:
        return
    if travel_mode is None:
        raise ValueError("travel needs a travel_mode")
    filled = {name for name, value in travel.model_dump().items() if value is not None}
    not_allowed = filled - TRAVEL_FIELDS_BY_MODE[travel_mode]
    if not_allowed:
        raise ValueError(f"{', '.join(sorted(not_allowed))} not allowed for a {travel_mode}")


class EventBase(BaseModel):
    calendar_id: int
    title: str
    description: str | None = None
    date: Date
    start_time: Time
    end_date: Date | None = None
    end_time: Time | None = None
    location: str | None = None
    color: str = '#AEC6E4'
    travel_mode: TravelMode | None = None


class EventCreate(EventBase):
    travel: TravelDetailsIn | None = None

    @model_validator(mode="after")
    def check_travel(self) -> "EventCreate":
        _check_travel(self.travel_mode, self.travel)
        return self


class EventUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    date: Date | None = None
    start_time: Time | None = None
    end_date: Date | None = None
    end_time: Time | None = None
    location: str | None = None
    color: str | None = None
    travel_mode: TravelMode | None = None
    travel: TravelDetailsIn | None = None

    @model_validator(mode="after")
    def check_travel(self) -> "EventUpdate":
        if "travel" in self.model_fields_set and self.travel is not None and "travel_mode" not in self.model_fields_set:
            raise ValueError("travel needs a travel_mode")
        _check_travel(self.travel_mode, self.travel)
        return self


class EventResponse(EventBase):
    id: int
    uuid: UUID
    calendar_uuid: UUID
    created_at: datetime
    updated_at: datetime | None = None
    links: list[EventLinkResponse] = []
    expenses: list[EventExpenseResponse] = []
    travel: TravelDetailsOut | None = None

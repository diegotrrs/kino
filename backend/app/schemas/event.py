from datetime import date as Date
from datetime import datetime
from datetime import time as Time
from uuid import UUID

from pydantic import BaseModel, field_validator


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


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    date: Date | None = None
    start_time: Time | None = None
    end_date: Date | None = None
    end_time: Time | None = None
    location: str | None = None
    color: str | None = None


class EventResponse(EventBase):
    id: int
    uuid: UUID
    calendar_uuid: UUID
    created_at: datetime
    updated_at: datetime | None = None
    links: list[EventLinkResponse] = []
    expenses: list[EventExpenseResponse] = []

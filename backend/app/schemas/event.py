from datetime import date as Date
from datetime import datetime
from datetime import time as Time
from uuid import UUID

from pydantic import BaseModel


class EventBase(BaseModel):
    calendar_id: int
    title: str
    description: str | None = None
    date: Date
    start_time: Time
    end_time: Time | None = None
    location: str | None = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    date: Date | None = None
    start_time: Time | None = None
    end_time: Time | None = None
    location: str | None = None


class EventResponse(EventBase):
    id: int
    uuid: UUID
    created_at: datetime
    updated_at: datetime | None = None

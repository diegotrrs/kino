from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class CalendarCreate(BaseModel):
    name: str
    created_by: int = 0


class CalendarUpdate(BaseModel):
    name: str | None = None


class CalendarFavouriteUpdate(BaseModel):
    is_favourite: bool


class CalendarResponse(BaseModel):
    id: int
    uuid: UUID
    name: str
    created_by: int
    created_at: datetime
    updated_at: datetime | None = None
    is_favourite: bool = False


class DeletedCalendarResponse(BaseModel):
    id: int
    uuid: UUID
    name: str
    created_by: int
    created_at: datetime
    deleted_at: datetime


class CalendarUserAdd(BaseModel):
    user_id: int

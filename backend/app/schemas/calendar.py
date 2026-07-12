from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


class CalendarCreate(BaseModel):
    name: str
    created_by: int = 0
    start_date: date | None = None


class CalendarUpdate(BaseModel):
    name: str | None = None
    is_public: bool | None = None
    start_date: date | None = None


class CalendarFavouriteUpdate(BaseModel):
    is_favourite: bool


class CalendarResponse(BaseModel):
    id: int
    uuid: UUID
    name: str
    is_public: bool = False
    created_by: int
    start_date: date
    created_at: datetime
    updated_at: datetime | None = None
    is_favourite: bool = False
    role: str | None = None


class CalendarInvite(BaseModel):
    email: str


class CalendarMemberResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str


class DeletedCalendarResponse(BaseModel):
    id: int
    uuid: UUID
    name: str
    created_by: int
    created_at: datetime
    deleted_at: datetime


class CalendarUserAdd(BaseModel):
    user_id: int


class CalendarExpenseCreate(BaseModel):
    label: str
    amount: float
    currency: str


class CalendarExpenseResponse(BaseModel):
    id: int
    calendar_id: int
    label: str
    amount: float
    currency: str
    created_at: datetime

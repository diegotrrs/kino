from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class UserCreate(BaseModel):
    name: str
    email: str


class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None


class UserResponse(BaseModel):
    id: int
    uuid: UUID
    name: str
    email: str
    created_at: datetime
    updated_at: datetime | None = None

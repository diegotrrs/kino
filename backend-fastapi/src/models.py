from .database import Base
from sqlalchemy import Column, String, Boolean, Date
import uuid


class Note(Base):
    __tablename__ = "notes"
    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        unique=True,
        nullable=False,
    )
    name = Column(String)
    completed = Column(Boolean, unique=False, default=True)


class Calendar(Base):
    __tablename__ = "calendars"
    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        unique=True,
        nullable=False,
    )
    name = Column(String)
    description = Column(String(100), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

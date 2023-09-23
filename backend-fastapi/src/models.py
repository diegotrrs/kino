from .database import Base
from sqlalchemy import Column, String, Boolean
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

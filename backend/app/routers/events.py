from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extensions import connection

from ..database import get_db
from ..schemas.event import EventCreate, EventUpdate, EventResponse
from .. import crud

router = APIRouter()


@router.get("/", response_model=list[EventResponse])
def list_events(skip: int = 0, limit: int = 100, db: connection = Depends(get_db)):
    return crud.get_events(db, skip=skip, limit=limit)


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: int, db: connection = Depends(get_db)):
    event = crud.get_event(db, event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.post("/", response_model=EventResponse, status_code=201)
def create_event(event: EventCreate, db: connection = Depends(get_db)):
    return crud.create_event(db, event)


@router.patch("/{event_id}", response_model=EventResponse)
def update_event(event_id: int, event: EventUpdate, db: connection = Depends(get_db)):
    updated = crud.update_event(db, event_id, event)
    if updated is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return updated


@router.delete("/{event_id}", status_code=204)
def delete_event(event_id: int, db: connection = Depends(get_db)):
    if not crud.delete_event(db, event_id):
        raise HTTPException(status_code=404, detail="Event not found")

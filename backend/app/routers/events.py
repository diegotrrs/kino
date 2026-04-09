from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extensions import connection

from ..auth import get_current_user
from .. import crud
from ..database import get_db
from ..schemas.event import EventCreate, EventResponse, EventUpdate

router = APIRouter()


@router.get("/", response_model=list[EventResponse])
def list_events(
    skip: int = 0,
    limit: int = 100,
    calendar_id: int | None = None,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if calendar_id is not None:
        if crud.get_user_role(db, calendar_id, current_user["id"]) is None:
            raise HTTPException(status_code=403, detail="Not a member of this calendar")
        return crud.get_events_by_calendar(db, calendar_id, skip=skip, limit=limit)
    return crud.get_events(db, skip=skip, limit=limit)


@router.get("/{event_id}", response_model=EventResponse)
def get_event(
    event_id: int,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    event = crud.get_event(db, event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    if crud.get_user_role(db, event["calendar_id"], current_user["id"]) is None:
        raise HTTPException(status_code=403, detail="Not a member of this calendar")
    return event


@router.post("/", response_model=EventResponse, status_code=201)
def create_event(
    event: EventCreate,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if crud.get_user_role(db, event.calendar_id, current_user["id"]) is None:
        raise HTTPException(status_code=403, detail="Not a member of this calendar")
    return crud.create_event(db, event)


@router.patch("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: int,
    event: EventUpdate,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    existing = crud.get_event(db, event_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Event not found")
    if crud.get_user_role(db, existing["calendar_id"], current_user["id"]) is None:
        raise HTTPException(status_code=403, detail="Not a member of this calendar")
    updated = crud.update_event(db, event_id, event)
    return updated


@router.delete("/{event_id}", status_code=204)
def delete_event(
    event_id: int,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    existing = crud.get_event(db, event_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Event not found")
    if crud.get_user_role(db, existing["calendar_id"], current_user["id"]) is None:
        raise HTTPException(status_code=403, detail="Not a member of this calendar")
    crud.delete_event(db, event_id)

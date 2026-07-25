from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extensions import connection

from .. import crud
from ..auth import get_current_user, get_optional_user
from ..database import get_db
from ..schemas.event import (
    EventCreate,
    EventExpenseCreate,
    EventExpenseResponse,
    EventLinkCreate,
    EventLinkResponse,
    EventResponse,
    EventUpdate,
)

router = APIRouter()


@router.get("/", response_model=list[EventResponse])
def list_events(
    skip: int = 0,
    limit: int = 100,
    calendar_uuid: str | None = None,
    db: connection = Depends(get_db),
    current_user: dict | None = Depends(get_optional_user),
):
    if calendar_uuid is not None:
        calendar = crud.get_calendar_by_uuid(db, calendar_uuid, current_user["id"] if current_user else None)
        if calendar is None:
            raise HTTPException(status_code=404, detail="Calendar not found")
        if not calendar["is_public"]:
            if current_user is None or calendar.get("role") is None:
                raise HTTPException(status_code=403, detail="Not authorized to view this calendar's events")
        return crud.get_events_by_calendar(db, calendar["id"], skip=skip, limit=limit)
    if current_user is None:
        raise HTTPException(status_code=401, detail="Authentication required")
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


@router.post("/{event_id}/links", response_model=EventLinkResponse, status_code=201)
def create_event_link(
    event_id: int,
    link: EventLinkCreate,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    existing = crud.get_event(db, event_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Event not found")
    if crud.get_user_role(db, existing["calendar_id"], current_user["id"]) is None:
        raise HTTPException(status_code=403, detail="Not a member of this calendar")
    return crud.create_event_link(db, event_id, link.url, None)


@router.delete("/{event_id}/links/{link_id}", status_code=204)
def delete_event_link(
    event_id: int,
    link_id: int,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    existing = crud.get_event(db, event_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Event not found")
    if crud.get_user_role(db, existing["calendar_id"], current_user["id"]) is None:
        raise HTTPException(status_code=403, detail="Not a member of this calendar")
    deleted = crud.delete_event_link(db, link_id, event_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Link not found")


@router.post("/{event_id}/expenses", response_model=EventExpenseResponse, status_code=201)
def create_event_expense(
    event_id: int,
    expense: EventExpenseCreate,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    existing = crud.get_event(db, event_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Event not found")
    if crud.get_user_role(db, existing["calendar_id"], current_user["id"]) is None:
        raise HTTPException(status_code=403, detail="Not a member of this calendar")
    return crud.create_event_expense(db, event_id, expense.label, expense.amount, expense.currency)


@router.delete("/{event_id}/expenses/{expense_id}", status_code=204)
def delete_event_expense(
    event_id: int,
    expense_id: int,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    existing = crud.get_event(db, event_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Event not found")
    if crud.get_user_role(db, existing["calendar_id"], current_user["id"]) is None:
        raise HTTPException(status_code=403, detail="Not a member of this calendar")
    deleted = crud.delete_event_expense(db, expense_id, event_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Expense not found")

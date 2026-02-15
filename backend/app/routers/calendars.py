from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extensions import connection

from backend.app.auth import get_current_user

from .. import crud
from ..database import get_db
from ..schemas.calendar import (
    CalendarCreate,
    CalendarResponse,
    CalendarUpdate,
    CalendarUserAdd,
)
from ..schemas.user import UserResponse

router = APIRouter()


@router.get("/", response_model=list[CalendarResponse])
def list_calendars(
    skip: int = 0,
    limit: int = 100,
    db: connection = Depends(get_db),
    _user: dict = Depends(get_current_user),
):

    return crud.get_calendars(db, skip=skip, limit=limit)


@router.get("/{calendar_id}", response_model=CalendarResponse)
def get_calendar(calendar_id: int):
    calendar = crud.get_calendar(db, calendar_id)
    if calendar is None:
        raise HTTPException(status_code=404, detail="Calendar not found")
    return calendar


@router.post("/", response_model=CalendarResponse, status_code=201)
def create_calendar(
    calendar: CalendarCreate,
    db: connection = Depends(get_db),
    _user: dict = Depends(get_current_user),
):
    return crud.create_calendar(db, calendar)


@router.patch("/{calendar_id}", response_model=CalendarResponse)
def update_calendar(
    calendar_id: int,
    calendar: CalendarUpdate,
    db: connection = Depends(get_db),
    _user: dict = Depends(get_current_user),
):
    updated = crud.update_calendar(db, calendar_id, calendar)
    if updated is None:
        raise HTTPException(status_code=404, detail="Calendar not found")
    return updated


@router.delete("/{calendar_id}", status_code=204)
def delete_calendar(
    calendar_id: int,
    db: connection = Depends(get_db),
    _user: dict = Depends(get_current_user),
):
    if not crud.delete_calendar(db, calendar_id):
        raise HTTPException(status_code=404, detail="Calendar not found")


@router.get("/{calendar_id}/users", response_model=list[UserResponse])
def list_calendar_users(
    calendar_id: int,
    db: connection = Depends(get_db),
    _user: dict = Depends(get_current_user),
):
    calendar = crud.get_calendar(db, calendar_id)
    if calendar is None:
        raise HTTPException(status_code=404, detail="Calendar not found")
    return crud.get_calendar_users(db, calendar_id)


@router.post("/{calendar_id}/users", status_code=201)
def add_calendar_user(
    calendar_id: int,
    body: CalendarUserAdd,
    db: connection = Depends(get_db),
    _user: dict = Depends(get_current_user),
):
    calendar = crud.get_calendar(db, calendar_id)
    if calendar is None:
        raise HTTPException(status_code=404, detail="Calendar not found")
    result = crud.add_user_to_calendar(db, calendar_id, body.user_id)
    if result is None:
        raise HTTPException(status_code=409, detail="User already in calendar")
    return result


@router.delete("/{calendar_id}/users/{user_id}", status_code=204)
def remove_calendar_user(
    calendar_id: int,
    user_id: int,
    db: connection = Depends(get_db),
    _user: dict = Depends(get_current_user),
):
    if not crud.remove_user_from_calendar(db, calendar_id, user_id):
        raise HTTPException(status_code=404, detail="User not in calendar")

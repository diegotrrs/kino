import logging
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extensions import connection

from .. import crud
from ..auth import get_current_user, get_optional_user
from ..database import get_db
from ..email import send_calendar_invite_email
from ..schemas.calendar import (
    CalendarCreate,
    CalendarExpenseCreate,
    CalendarExpenseResponse,
    CalendarFavouriteUpdate,
    CalendarInvite,
    CalendarMemberResponse,
    CalendarResponse,
    CalendarUpdate,
    CalendarUserAdd,
    DeletedCalendarResponse,
)
from ..schemas.day_name import DayNameResponse, DayNameSet

logger = logging.getLogger(__name__)
router = APIRouter()


def _get_id_by_uuid(db: connection, calendar_uuid: str) -> int:
    """Resolve a calendar UUID to its integer primary key, or raise 404."""
    with db.cursor() as cur:
        cur.execute("SELECT id FROM calendars WHERE uuid = %s", (calendar_uuid,))
        row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Calendar not found")
    return row["id"]


@router.get("/", response_model=list[CalendarResponse])
def list_calendars(
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return crud.get_calendars_by_user(db, current_user["id"])


# Must be defined before /{calendar_uuid} to avoid string paths being captured
@router.get("/favourites", response_model=list[CalendarResponse])
def list_favourite_calendars(
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return crud.get_favourite_calendars(db, current_user["id"])


@router.get("/deleted", response_model=list[DeletedCalendarResponse])
def list_deleted_calendars(
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return crud.get_deleted_calendars_by_user(db, current_user["id"])


@router.get("/{calendar_uuid}", response_model=CalendarResponse)
def get_calendar(
    calendar_uuid: str,
    db: connection = Depends(get_db),
    current_user: dict | None = Depends(get_optional_user),
):
    calendar = crud.get_calendar_by_uuid(db, calendar_uuid, current_user["id"] if current_user else None)
    if calendar is None:
        raise HTTPException(status_code=404, detail="Calendar not found")
    if not calendar["is_public"]:
        if current_user is None or calendar.get("role") is None:
            raise HTTPException(status_code=403, detail="This calendar is private")
    return calendar


@router.post("/", response_model=CalendarResponse, status_code=201)
def create_calendar(
    calendar: CalendarCreate,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    calendar.created_by = current_user["id"]
    return crud.create_calendar(db, calendar)


@router.patch("/{calendar_uuid}", response_model=CalendarResponse)
def update_calendar(
    calendar_uuid: str,
    calendar: CalendarUpdate,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    calendar_id = _get_id_by_uuid(db, calendar_uuid)
    if crud.get_user_role(db, calendar_id, current_user["id"]) != "owner":
        raise HTTPException(status_code=403, detail="Only the owner can edit this calendar")
    updated = crud.update_calendar(db, calendar_id, calendar)
    if updated is None:
        raise HTTPException(status_code=404, detail="Calendar not found")
    return updated


@router.patch("/{calendar_uuid}/favourite", response_model=CalendarResponse)
def toggle_calendar_favourite(
    calendar_uuid: str,
    body: CalendarFavouriteUpdate,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    calendar_id = _get_id_by_uuid(db, calendar_uuid)
    updated = crud.set_calendar_favourite(db, calendar_id, current_user["id"], body.is_favourite)
    if not updated:
        raise HTTPException(status_code=404, detail="Calendar not found")
    return crud.get_calendar(db, calendar_id, current_user["id"])


@router.post("/{calendar_uuid}/restore", status_code=204)
def restore_calendar(
    calendar_uuid: str,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    with db.cursor() as cur:
        cur.execute("SELECT id FROM deleted_calendars WHERE uuid = %s", (calendar_uuid,))
        row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Deleted calendar not found")
    if not crud.restore_calendar(db, row["id"], current_user["id"]):
        raise HTTPException(status_code=404, detail="Deleted calendar not found")


@router.delete("/{calendar_uuid}", status_code=204)
def delete_calendar(
    calendar_uuid: str,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    calendar_id = _get_id_by_uuid(db, calendar_uuid)
    if crud.get_user_role(db, calendar_id, current_user["id"]) != "owner":
        raise HTTPException(status_code=403, detail="Only the owner can delete this calendar")
    if not crud.delete_calendar(db, calendar_id):
        raise HTTPException(status_code=404, detail="Calendar not found")


@router.get("/{calendar_uuid}/users", response_model=list[CalendarMemberResponse])
def list_calendar_users(
    calendar_uuid: str,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    calendar_id = _get_id_by_uuid(db, calendar_uuid)
    if crud.get_user_role(db, calendar_id, current_user["id"]) is None:
        raise HTTPException(status_code=403, detail="Not a member of this calendar")
    return crud.get_calendar_users(db, calendar_id)


@router.post("/{calendar_uuid}/invite", response_model=CalendarMemberResponse, status_code=201)
def invite_user(
    calendar_uuid: str,
    body: CalendarInvite,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    calendar_id = _get_id_by_uuid(db, calendar_uuid)
    if crud.get_user_role(db, calendar_id, current_user["id"]) != "owner":
        raise HTTPException(status_code=403, detail="Only the owner can invite users")
    result = crud.invite_user_to_calendar(db, calendar_id, body.email)
    if result is None:
        raise HTTPException(status_code=404, detail="No user found with that email, or already a member")
    # Send invite email (best-effort — failure must not affect the response)
    try:
        calendar = crud.get_calendar(db, calendar_id)
        send_calendar_invite_email(
            to_email=body.email,
            calendar_name=calendar["name"],
            inviter_name=current_user["name"],
        )
    except Exception:
        logger.exception("Failed to send invite email to %s", body.email)
    # Return the full member response
    users = crud.get_calendar_users(db, calendar_id)
    with db.cursor() as cur:
        cur.execute("SELECT id FROM users WHERE email = %s", (body.email,))
        user = cur.fetchone()
    return next(m for m in users if m["id"] == user["id"])


@router.post("/{calendar_uuid}/users", status_code=201)
def add_calendar_user(
    calendar_uuid: str,
    body: CalendarUserAdd,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    calendar_id = _get_id_by_uuid(db, calendar_uuid)
    if crud.get_user_role(db, calendar_id, current_user["id"]) != "owner":
        raise HTTPException(status_code=403, detail="Only the owner can add users")
    calendar = crud.get_calendar(db, calendar_id)
    if calendar is None:
        raise HTTPException(status_code=404, detail="Calendar not found")
    result = crud.add_user_to_calendar(db, calendar_id, body.user_id)
    if result is None:
        raise HTTPException(status_code=409, detail="User already in calendar")
    return result


@router.delete("/{calendar_uuid}/users/{user_id}", status_code=204)
def remove_calendar_user(
    calendar_uuid: str,
    user_id: int,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    calendar_id = _get_id_by_uuid(db, calendar_uuid)
    if crud.get_user_role(db, calendar_id, current_user["id"]) != "owner":
        raise HTTPException(status_code=403, detail="Only the owner can remove users")
    if not crud.remove_user_from_calendar(db, calendar_id, user_id):
        raise HTTPException(status_code=404, detail="User not in calendar")


@router.get("/{calendar_uuid}/expenses", response_model=list[CalendarExpenseResponse])
def list_calendar_expenses(
    calendar_uuid: str,
    db: connection = Depends(get_db),
    current_user: dict | None = Depends(get_optional_user),
):
    calendar = crud.get_calendar_by_uuid(db, calendar_uuid, current_user["id"] if current_user else None)
    if calendar is None:
        raise HTTPException(status_code=404, detail="Calendar not found")
    if not calendar["is_public"]:
        if current_user is None or calendar.get("role") is None:
            raise HTTPException(status_code=403, detail="This calendar is private")
    calendar_id = calendar["id"]
    return crud.get_calendar_expenses(db, calendar_id)


@router.post("/{calendar_uuid}/expenses", response_model=CalendarExpenseResponse, status_code=201)
def create_calendar_expense(
    calendar_uuid: str,
    expense: CalendarExpenseCreate,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    calendar_id = _get_id_by_uuid(db, calendar_uuid)
    if crud.get_user_role(db, calendar_id, current_user["id"]) is None:
        raise HTTPException(status_code=403, detail="Not a member of this calendar")
    return crud.create_calendar_expense(db, calendar_id, expense.label, expense.amount, expense.currency)


@router.delete("/{calendar_uuid}/expenses/{expense_id}", status_code=204)
def delete_calendar_expense(
    calendar_uuid: str,
    expense_id: int,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    calendar_id = _get_id_by_uuid(db, calendar_uuid)
    if crud.get_user_role(db, calendar_id, current_user["id"]) is None:
        raise HTTPException(status_code=403, detail="Not a member of this calendar")
    if not crud.delete_calendar_expense(db, expense_id, calendar_id):
        raise HTTPException(status_code=404, detail="Expense not found")


@router.get("/{calendar_uuid}/day-names", response_model=list[DayNameResponse])
def list_day_names(
    calendar_uuid: str,
    db: connection = Depends(get_db),
    current_user: dict | None = Depends(get_optional_user),
):
    calendar = crud.get_calendar_by_uuid(db, calendar_uuid, current_user["id"] if current_user else None)
    if calendar is None:
        raise HTTPException(status_code=404, detail="Calendar not found")
    if not calendar["is_public"]:
        if current_user is None or calendar.get("role") is None:
            raise HTTPException(status_code=403, detail="This calendar is private")
    return crud.get_day_names(db, calendar["id"])


@router.put("/{calendar_uuid}/day-names/{day}", response_model=DayNameResponse)
def set_day_name(
    calendar_uuid: str,
    day: date,
    body: DayNameSet,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    calendar_id = _get_id_by_uuid(db, calendar_uuid)
    if crud.get_user_role(db, calendar_id, current_user["id"]) is None:
        raise HTTPException(status_code=403, detail="Not a member of this calendar")
    return crud.set_day_name(db, calendar_id, day, body.name)


@router.delete("/{calendar_uuid}/day-names/{day}", status_code=204)
def delete_day_name(
    calendar_uuid: str,
    day: date,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    calendar_id = _get_id_by_uuid(db, calendar_uuid)
    if crud.get_user_role(db, calendar_id, current_user["id"]) is None:
        raise HTTPException(status_code=403, detail="Not a member of this calendar")
    if not crud.delete_day_name(db, calendar_id, day):
        raise HTTPException(status_code=404, detail="Day has no name")

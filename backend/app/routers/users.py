from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extensions import connection

from .. import crud
from ..auth import get_current_user
from ..database import get_db
from ..schemas.calendar import CalendarResponse
from ..schemas.user import UserResponse, UserUpdate

router = APIRouter()


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="You can only view your own profile")
    user = crud.get_user(db, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/{user_id}/calendars", response_model=list[CalendarResponse])
def list_user_calendars(
    user_id: int,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="You can only view your own calendars")
    return crud.get_calendars_by_user(db, user_id)


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    body: UserUpdate,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="You can only update your own profile")
    updates = body.model_dump(exclude_unset=True)
    user = crud.update_user(db, user_id, updates)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="You can only delete your own account")
    if not crud.delete_user(db, user_id):
        raise HTTPException(status_code=404, detail="User not found")

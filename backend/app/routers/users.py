from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extensions import connection

from .. import crud
from ..database import get_db
from ..schemas.user import UserCreate, UserResponse

router = APIRouter()


@router.get("/", response_model=list[UserResponse])
def list_users(skip: int = 0, limit: int = 100, db: connection = Depends(get_db)):
    return crud.get_users(db, skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: connection = Depends(get_db)):
    user = crud.get_user(db, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/", response_model=UserResponse, status_code=201)
def create_user(user: UserCreate, db: connection = Depends(get_db)):
    return crud.create_user(db, user)


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: int, db: connection = Depends(get_db)):
    if not crud.delete_user(db, user_id):
        raise HTTPException(status_code=404, detail="User not found")

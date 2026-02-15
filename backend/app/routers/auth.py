from fastapi import APIRouter, Depends, HTTPException, status
from psycopg2.extensions import connection

from ..auth import create_access_token, verify_password
from ..crud.users import create_user, get_user_by_email
from ..database import get_db
from ..schemas.auth import LoginRequest, SignupRequest, TokenResponse
from ..schemas.user import UserCreate

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: connection = Depends(get_db)):
    user = get_user_by_email(db, body.email)
    if user is None or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    access_token = create_access_token({"sub": str(user["id"])})
    return TokenResponse(access_token=access_token)


@router.post("/signup", response_model=TokenResponse, status_code=201)
def signup(body: SignupRequest, db: connection = Depends(get_db)):
    existing = get_user_by_email(db, body.email)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )
    user = create_user(
        db, UserCreate(name=body.name, email=body.email, password=body.password)
    )
    access_token = create_access_token({"sub": str(user["id"])})
    return TokenResponse(access_token=access_token)

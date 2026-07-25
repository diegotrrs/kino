import logging
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from psycopg2.extensions import connection

from ..auth import create_access_token, get_current_user, hash_password, verify_password
from ..config import get_settings
from ..crud.users import (
    create_password_reset_token,
    create_user,
    get_password_reset_token,
    get_user_by_email,
    mark_token_used,
    update_user_password,
)
from ..database import get_db
from ..email import send_password_reset_email
from ..schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    ResetPasswordRequest,
    SignupRequest,
    TokenResponse,
)
from ..schemas.user import UserCreate, UserResponse

logger = logging.getLogger(__name__)

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


@router.get("/me", response_model=UserResponse)
def me(current_user: dict = Depends(get_current_user)):
    return current_user


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


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(body: ForgotPasswordRequest, db: connection = Depends(get_db)):
    _GENERIC_MESSAGE = "If that email is registered, a reset link has been sent."
    user = get_user_by_email(db, body.email)
    if user is None:
        return MessageResponse(message=_GENERIC_MESSAGE)

    token = secrets.token_hex(32)
    expires_at = datetime.now(UTC) + timedelta(hours=1)
    create_password_reset_token(db, user["id"], token, expires_at)

    settings = get_settings()
    reset_url = f"{settings.app_base_url}/reset-password?token={token}"
    try:
        send_password_reset_email(to_email=body.email, reset_url=reset_url)
    except Exception:
        logger.exception("Failed to send password reset email to %s", body.email)

    return MessageResponse(message=_GENERIC_MESSAGE)


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(body: ResetPasswordRequest, db: connection = Depends(get_db)):
    row = get_password_reset_token(db, body.token)
    if row is None or row["used_at"] is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")

    expires_at = row["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)
    if datetime.now(UTC) > expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")

    new_hash = hash_password(body.password)
    update_user_password(db, row["user_id"], new_hash)
    mark_token_used(db, body.token)

    return MessageResponse(message="Password updated")

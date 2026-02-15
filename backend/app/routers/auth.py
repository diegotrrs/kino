from fastapi import APIRouter, Depends, HTTPException, status
from psycopg2.extensions import connection

from ..auth import create_access_token, verify_password
from ..crud.users import get_user_by_email
from ..database import get_db
from ..schemas.auth import LoginRequest, TokenResponse

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

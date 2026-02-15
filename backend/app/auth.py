from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext
from psycopg2.extensions import connection

from .config import get_settings
from .database import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict) -> str:
    settings = get_settings()
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.jwt_expiration_minutes
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm="HS256")


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: connection = Depends(get_db),
) -> dict:
    settings = get_settings()
    try:
        payload = jwt.decode(
            credentials.credentials, settings.jwt_secret_key, algorithms=["HS256"]
        )
        print(payload)
        sub = payload.get("sub")
        if sub is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    user_id = int(sub)
    with db.cursor() as cur:
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )
    return user

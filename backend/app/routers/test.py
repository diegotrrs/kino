import logging
import time

from fastapi import APIRouter, Depends, Header, HTTPException, status
from psycopg2.extensions import connection

from ..config import get_settings
from ..crud.test import delete_user, reset_test_user_data
from ..database import get_db

logger = logging.getLogger(__name__)

router = APIRouter()

# Simple in-process rate limit: max 1 call per 5 seconds
_last_called_at: float = 0.0
_RATE_LIMIT_SECONDS = 5


@router.delete("/reset", status_code=204)
def reset_test_user(
    x_test_secret: str = Header(...),
    db: connection = Depends(get_db),
) -> None:
    global _last_called_at

    settings = get_settings()

    if not settings.test_reset_secret or not settings.test_user_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Test reset is not configured",
        )

    if x_test_secret != settings.test_reset_secret:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden",
        )

    now = time.monotonic()
    if now - _last_called_at < _RATE_LIMIT_SECONDS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests",
        )
    _last_called_at = now

    reset_test_user_data(db, settings.test_user_id)
    logger.info("Test user %d data reset", settings.test_user_id)


@router.delete("/users/{user_id}", status_code=204)
def delete_test_user(
    user_id: int,
    x_test_secret: str = Header(...),
    db: connection = Depends(get_db),
) -> None:
    settings = get_settings()

    if not settings.test_reset_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Test reset is not configured",
        )

    if x_test_secret != settings.test_reset_secret:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden",
        )

    delete_user(db, user_id)
    logger.info("Test user %d deleted", user_id)

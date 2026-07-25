import re

from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extensions import connection

from .. import crud
from ..auth import get_current_user
from ..database import get_db
from ..schemas.auth import MessageResponse
from ..schemas.feedback import FeedbackCreate, WishlistItemResponse

feedback_router = APIRouter()
wishlist_router = APIRouter()


def _strip_tags(text: str) -> str:
    return re.sub(r'<[^>]+>', '', text)


@feedback_router.post("/", response_model=MessageResponse, status_code=201)
def submit_feedback(
    body: FeedbackCreate,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    clean_content = _strip_tags(body.content).strip()
    if not clean_content:
        raise HTTPException(status_code=400, detail="Feedback cannot be empty")
    crud.submit_feedback(db, current_user["id"], clean_content)
    return MessageResponse(message="Thank you for your feedback!")


@wishlist_router.get("/", response_model=list[WishlistItemResponse])
def list_wishlist(
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return crud.get_wishlist(db, current_user["id"])


@wishlist_router.post("/{wishlist_id}/vote", status_code=204)
def add_vote(
    wishlist_id: int,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    crud.add_vote(db, wishlist_id, current_user["id"])


@wishlist_router.delete("/{wishlist_id}/vote", status_code=204)
def remove_vote(
    wishlist_id: int,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    crud.remove_vote(db, wishlist_id, current_user["id"])

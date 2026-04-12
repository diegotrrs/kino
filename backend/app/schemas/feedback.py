from pydantic import BaseModel, Field


class FeedbackCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)


class WishlistItemResponse(BaseModel):
    id: int
    title: str
    description: str
    vote_count: int
    user_has_voted: bool

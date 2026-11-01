from unittest.mock import patch

import pytest
from fastapi import HTTPException

from app.routers import feedback as router
from app.schemas.feedback import FeedbackCreate


@pytest.fixture
def crud():
    with patch("app.routers.feedback.crud") as mock_crud:
        yield mock_crud


class TestSubmitFeedback:
    @pytest.mark.parametrize("content", ["<p></p>", "<b>   </b>", "<script></script>"])
    def test_content_that_is_empty_after_stripping_tags_is_rejected(self, crud, db, user, content):
        with pytest.raises(HTTPException) as exc:
            router.submit_feedback(body=FeedbackCreate(content=content), db=db, current_user=user)

        assert exc.value.status_code == 400
        crud.submit_feedback.assert_not_called()

    def test_stored_content_has_tags_and_surrounding_whitespace_removed(self, crud, db, user):
        router.submit_feedback(body=FeedbackCreate(content="  <b>Great</b> app "), db=db, current_user=user)

        crud.submit_feedback.assert_called_once_with(db, user["id"], "Great app")


class TestWishlistVotes:
    def test_vote_is_recorded_for_the_current_user(self, crud, db, user):
        router.add_vote(wishlist_id=4, db=db, current_user=user)

        crud.add_vote.assert_called_once_with(db, 4, user["id"])

    def test_vote_removal_is_for_the_current_user(self, crud, db, user):
        router.remove_vote(wishlist_id=4, db=db, current_user=user)

        crud.remove_vote.assert_called_once_with(db, 4, user["id"])

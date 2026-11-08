import pytest
from pydantic import ValidationError

from app.schemas.auth import ResetPasswordRequest, SignupRequest
from app.schemas.calendar import CalendarExpenseCreate
from app.schemas.day_name import DayNameSet
from app.schemas.event import EventCreate, EventExpenseCreate, EventUpdate
from app.schemas.feedback import FeedbackCreate
from app.schemas.user import UserUpdate

EXPENSE_SCHEMAS = [
    pytest.param(EventExpenseCreate, id="event_expense"),
    pytest.param(CalendarExpenseCreate, id="calendar_expense"),
]


class TestExpenseAmount:
    @pytest.mark.parametrize("schema", EXPENSE_SCHEMAS)
    @pytest.mark.parametrize("amount", [0, -0.01, -50])
    def test_zero_or_negative_amount_is_rejected(self, schema, amount):
        with pytest.raises(ValidationError):
            schema(label="Taxi", amount=amount, currency="EUR")

    @pytest.mark.parametrize("schema", EXPENSE_SCHEMAS)
    def test_positive_amount_is_accepted(self, schema):
        assert schema(label="Taxi", amount=0.01, currency="EUR").amount == 0.01

    @pytest.mark.xfail(strict=True, reason="Bug: currency is unvalidated; >3 chars overflows VARCHAR(3) with a 500")
    @pytest.mark.parametrize("schema", EXPENSE_SCHEMAS)
    def test_currency_must_be_a_three_letter_code(self, schema):
        with pytest.raises(ValidationError):
            schema(label="Taxi", amount=5, currency="EURO")


class TestFeedbackContent:
    def test_empty_content_is_rejected(self):
        with pytest.raises(ValidationError):
            FeedbackCreate(content="")

    def test_content_at_the_limit_is_accepted(self):
        assert len(FeedbackCreate(content="a" * 500).content) == 500

    def test_content_over_the_limit_is_rejected(self):
        with pytest.raises(ValidationError):
            FeedbackCreate(content="a" * 501)


class TestPartialUpdates:
    def test_event_update_dumps_only_fields_that_were_set(self):
        assert EventUpdate(title="New").model_dump(exclude_unset=True) == {"title": "New"}

    def test_event_update_keeps_explicit_none_so_fields_can_be_cleared(self):
        assert EventUpdate(location=None).model_dump(exclude_unset=True) == {"location": None}

    def test_user_update_dumps_only_fields_that_were_set(self):
        assert UserUpdate(locale="es").model_dump(exclude_unset=True) == {"locale": "es"}


class TestPasswordPolicy:
    @pytest.mark.xfail(strict=True, reason="Bug: no minimum password length")
    @pytest.mark.parametrize("schema", [SignupRequest, ResetPasswordRequest], ids=["signup", "reset"])
    def test_empty_password_is_rejected(self, schema):
        fields = {"name": "Ana", "email": "ana@example.com"} if schema is SignupRequest else {"token": "t"}
        with pytest.raises(ValidationError):
            schema(password="", **fields)


class TestEventDates:
    @pytest.mark.xfail(strict=True, reason="Bug: an event can end before it starts")
    def test_end_before_start_is_rejected(self):
        with pytest.raises(ValidationError):
            EventCreate(
                calendar_id=1,
                title="Flight",
                date="2035-01-02",
                start_time="10:00",
                end_date="2035-01-01",
                end_time="09:00",
            )


class TestDayNameSet:
    def test_name_is_trimmed(self):
        assert DayNameSet(name="  Visit to Vatican  ").name == "Visit to Vatican"

    def test_html_tags_are_stripped(self):
        assert DayNameSet(name="<b>Rome</b>").name == "Rome"

    @pytest.mark.parametrize("name", ["", "   ", "<i></i>", "x" * 61], ids=["empty", "blank", "only_tags", "too_long"])
    def test_invalid_names_are_rejected(self, name):
        with pytest.raises(ValidationError):
            DayNameSet(name=name)

    def test_sixty_characters_is_allowed(self):
        assert len(DayNameSet(name="x" * 60).name) == 60

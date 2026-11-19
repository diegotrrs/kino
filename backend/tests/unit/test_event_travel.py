from unittest.mock import patch

import pytest
from pydantic import ValidationError

from app.routers import events as router
from app.schemas.event import EventCreate, EventUpdate

CALENDAR_ID = 9
FLIGHT = {
    "origin": "LHR",
    "destination": "FCO",
    "number": "BA 2490",
    "terminal": "5",
    "gate": "B32",
    "seat": "14A",
    "booking_reference": "K7XQ2M",
}
TRAIN = {
    "origin": "London St Pancras",
    "destination": "Paris Gare du Nord",
    "coach": "7",
    "seat": "61",
    "booking_reference": "Q4PL9X",
}


def _event(**overrides) -> dict:
    base = {"calendar_id": CALENDAR_ID, "title": "Flight to Rome", "date": "2035-06-01", "start_time": "07:15"}
    return base | overrides


class TestTravelOnCreate:
    def test_flight_accepts_all_flight_fields(self):
        event = EventCreate(**_event(travel_mode="flight", travel=FLIGHT))

        assert event.travel_mode == "flight"
        assert event.travel.gate == "B32"

    def test_train_accepts_all_train_fields(self):
        event = EventCreate(**_event(travel_mode="train", travel=TRAIN))

        assert event.travel.coach == "7"

    def test_ordinary_event_has_no_travel_mode_by_default(self):
        event = EventCreate(**_event())

        assert event.travel_mode is None
        assert event.travel is None

    def test_travel_without_a_travel_mode_is_rejected(self):
        with pytest.raises(ValidationError):
            EventCreate(**_event(travel=FLIGHT))

    def test_unknown_travel_mode_is_rejected(self):
        with pytest.raises(ValidationError):
            EventCreate(**_event(travel_mode="bus", travel={"seat": "3"}))

    @pytest.mark.parametrize("field", ["number", "terminal", "gate"])
    def test_flight_only_fields_are_rejected_on_a_train(self, field):
        with pytest.raises(ValidationError):
            EventCreate(**_event(travel_mode="train", travel={field: "X1"}))

    def test_coach_is_rejected_on_a_flight(self):
        with pytest.raises(ValidationError):
            EventCreate(**_event(travel_mode="flight", travel={"coach": "7"}))

    @pytest.mark.parametrize(
        "field, length",
        [("seat", 11), ("number", 11), ("terminal", 11), ("gate", 11), ("booking_reference", 21), ("origin", 61)],
    )
    def test_fields_longer_than_their_limit_are_rejected(self, field, length):
        with pytest.raises(ValidationError):
            EventCreate(**_event(travel_mode="flight", travel={field: "x" * length}))

    def test_html_is_stripped_and_text_trimmed(self):
        event = EventCreate(**_event(travel_mode="flight", travel={"gate": " <b>B32</b> "}))

        assert event.travel.gate == "B32"

    def test_blank_fields_are_stored_as_null(self):
        event = EventCreate(**_event(travel_mode="flight", travel={"gate": "   ", "seat": ""}))

        assert event.travel.gate is None
        assert event.travel.seat is None


class TestTravelOnUpdate:
    def test_travel_without_a_travel_mode_is_rejected(self):
        with pytest.raises(ValidationError):
            EventUpdate(travel=FLIGHT)

    def test_a_date_only_update_does_not_touch_travel(self):
        update = EventUpdate(date="2035-06-02")

        assert "travel" not in update.model_fields_set
        assert "travel_mode" not in update.model_fields_set


@pytest.fixture
def crud():
    with patch("app.routers.events.crud") as mock_crud:
        yield mock_crud


def _listed_flight() -> dict:
    return {"id": 5, "calendar_id": CALENDAR_ID, "travel_mode": "flight", "travel": dict(FLIGHT)}


class TestBookingReferenceVisibility:
    @pytest.mark.parametrize("role", ["owner", "editor"])
    def test_members_see_the_booking_reference(self, crud, db, user, role):
        crud.get_calendar_by_uuid.return_value = {"id": CALENDAR_ID, "is_public": True, "role": role}
        crud.get_events_by_calendar.return_value = [_listed_flight()]

        events = router.list_events(calendar_uuid="cal-uuid", db=db, current_user=user)

        assert events[0]["travel"]["booking_reference"] == "K7XQ2M"

    def test_non_member_of_a_public_calendar_does_not_see_the_booking_reference(self, crud, db, user):
        crud.get_calendar_by_uuid.return_value = {"id": CALENDAR_ID, "is_public": True, "role": None}
        crud.get_events_by_calendar.return_value = [_listed_flight()]

        events = router.list_events(calendar_uuid="cal-uuid", db=db, current_user=user)

        assert events[0]["travel"]["booking_reference"] is None
        assert events[0]["travel"]["seat"] == "14A"

    def test_anonymous_visitor_does_not_see_the_booking_reference(self, crud, db):
        crud.get_calendar_by_uuid.return_value = {"id": CALENDAR_ID, "is_public": True, "role": None}
        crud.get_events_by_calendar.return_value = [_listed_flight()]

        events = router.list_events(calendar_uuid="cal-uuid", db=db, current_user=None)

        assert events[0]["travel"]["booking_reference"] is None

    def test_ordinary_events_are_listed_unchanged_for_visitors(self, crud, db):
        crud.get_calendar_by_uuid.return_value = {"id": CALENDAR_ID, "is_public": True, "role": None}
        crud.get_events_by_calendar.return_value = [{"id": 6, "travel_mode": None, "travel": None}]

        events = router.list_events(calendar_uuid="cal-uuid", db=db, current_user=None)

        assert events[0]["travel"] is None

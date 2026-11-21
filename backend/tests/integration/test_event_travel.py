from app.crud.calendars import create_calendar, delete_calendar
from app.crud.test import delete_user, reset_test_user_data
from app.schemas.calendar import CalendarCreate

FLIGHT = {
    "origin": "LHR",
    "destination": "FCO",
    "number": "BA 2490",
    "terminal": "5",
    "gate": "B32",
    "seat": "14A",
}
TRAIN = {
    "origin": "London St Pancras",
    "destination": "Paris Gare du Nord",
    "coach": "7",
    "seat": "61",
}
EMPTY_TRAVEL = dict.fromkeys(["origin", "destination", "number", "terminal", "gate", "coach", "seat"])


def _create(client, calendar: dict, headers: dict, **fields) -> dict:
    payload = {"calendar_id": calendar["id"], "title": "Flight to Rome", "date": "2035-06-01", "start_time": "07:15:00"}
    res = client.post("/api/events/", json=payload | fields, headers=headers)
    assert res.status_code == 201, res.text
    return res.json()


def _list(client, calendar: dict, headers: dict | None = None) -> list[dict]:
    return client.get(f"/api/events/?calendar_uuid={calendar['uuid']}", headers=headers or {}).json()


class TestCreateTravelEvents:
    def test_flight_round_trips_through_create_get_and_list(self, client, calendar, owner_headers):
        created = _create(
            client, calendar, owner_headers, travel_mode="flight", travel=FLIGHT, booking_reference="K7XQ2M"
        )

        fetched = client.get(f"/api/events/{created['id']}", headers=owner_headers).json()
        listed = _list(client, calendar, owner_headers)[0]

        for event in (created, fetched, listed):
            assert event["travel_mode"] == "flight"
            assert event["travel"] == EMPTY_TRAVEL | FLIGHT
            assert event["booking_reference"] == "K7XQ2M"

    def test_train_round_trips(self, client, calendar, owner_headers):
        created = _create(client, calendar, owner_headers, travel_mode="train", travel=TRAIN)

        fetched = client.get(f"/api/events/{created['id']}", headers=owner_headers).json()

        assert fetched["travel_mode"] == "train"
        assert fetched["travel"] == EMPTY_TRAVEL | TRAIN

    def test_ordinary_events_have_no_travel(self, client, calendar, owner_headers):
        created = _create(client, calendar, owner_headers)

        assert created["travel_mode"] is None
        assert created["travel"] is None
        assert created["booking_reference"] is None
        assert _list(client, calendar, owner_headers)[0]["travel"] is None

    def test_an_ordinary_event_keeps_a_booking_reference_and_address(self, client, calendar, owner_headers):
        created = _create(
            client, calendar, owner_headers, title="Vatican Museums",
            booking_reference=" VM-2035 ", location="<b>Viale Vaticano</b>",
        )

        fetched = client.get(f"/api/events/{created['id']}", headers=owner_headers).json()

        assert fetched["booking_reference"] == "VM-2035"
        assert fetched["location"] == "Viale Vaticano"
        assert fetched["travel"] is None

    def test_mismatched_fields_are_rejected_and_nothing_is_created(self, client, calendar, owner_headers):
        payload = {"calendar_id": calendar["id"], "title": "Train", "date": "2035-06-01", "start_time": "07:15:00"}

        for extra in [
            {"travel": FLIGHT},
            {"travel_mode": "train", "travel": {"gate": "B32"}},
            {"travel_mode": "flight", "travel": {"booking_reference": "K7XQ2M"}},
        ]:
            res = client.post("/api/events/", json=payload | extra, headers=owner_headers)
            assert res.status_code == 422

        assert _list(client, calendar, owner_headers) == []


class TestUpdateTravelEvents:
    def test_moving_a_flight_to_another_day_keeps_its_details(self, client, calendar, owner_headers):
        created = _create(
            client, calendar, owner_headers, travel_mode="flight", travel=FLIGHT, booking_reference="K7XQ2M"
        )

        res = client.patch(
            f"/api/events/{created['id']}",
            json={"date": "2035-06-02", "start_time": "08:00:00"},
            headers=owner_headers,
        )

        assert res.status_code == 200
        assert res.json()["travel_mode"] == "flight"
        assert res.json()["travel"] == EMPTY_TRAVEL | FLIGHT
        assert res.json()["booking_reference"] == "K7XQ2M"

    def test_the_booking_reference_can_be_changed_and_cleared(self, client, calendar, owner_headers):
        created = _create(client, calendar, owner_headers, booking_reference="OLD1")

        url = f"/api/events/{created['id']}"
        changed = client.patch(url, json={"booking_reference": "NEW2"}, headers=owner_headers)
        cleared = client.patch(url, json={"booking_reference": ""}, headers=owner_headers)

        assert changed.json()["booking_reference"] == "NEW2"
        assert cleared.json()["booking_reference"] is None

    def test_sending_travel_replaces_the_details(self, client, calendar, owner_headers):
        created = _create(client, calendar, owner_headers, travel_mode="flight", travel=FLIGHT)

        res = client.patch(
            f"/api/events/{created['id']}",
            json={"travel_mode": "flight", "travel": {"origin": "LHR", "destination": "FCO", "gate": "C40"}},
            headers=owner_headers,
        )

        assert res.json()["travel"] == EMPTY_TRAVEL | {"origin": "LHR", "destination": "FCO", "gate": "C40"}


class TestBookingReferenceOnPublicCalendars:
    def test_visitors_get_the_flight_without_its_booking_reference(
        self, client, calendar, owner_headers, other_headers
    ):
        client.patch(f"/api/calendars/{calendar['uuid']}", json={"is_public": True}, headers=owner_headers)
        _create(client, calendar, owner_headers, travel_mode="flight", travel=FLIGHT, booking_reference="K7XQ2M")

        anonymous = _list(client, calendar)[0]
        non_member = _list(client, calendar, other_headers)[0]
        owner = _list(client, calendar, owner_headers)[0]

        assert anonymous["travel"] == EMPTY_TRAVEL | FLIGHT
        assert anonymous["booking_reference"] is None
        assert non_member["booking_reference"] is None
        assert owner["booking_reference"] == "K7XQ2M"

    def test_visitors_get_an_ordinary_event_without_its_booking_reference(
        self, client, calendar, owner_headers, other_headers
    ):
        client.patch(f"/api/calendars/{calendar['uuid']}", json={"is_public": True}, headers=owner_headers)
        _create(client, calendar, owner_headers, booking_reference="VM-2035", location="Viale Vaticano")

        for headers in (None, other_headers):
            event = _list(client, calendar, headers)[0]
            assert event["booking_reference"] is None
            assert event["location"] == "Viale Vaticano"
        assert _list(client, calendar, owner_headers)[0]["booking_reference"] == "VM-2035"


class TestTravelWithLinksAndExpenses:
    def test_an_event_with_links_expenses_and_travel_is_listed_once(self, client, calendar, owner_headers):
        created = _create(client, calendar, owner_headers, travel_mode="flight", travel=FLIGHT)
        for url in ["https://example.com/a", "https://example.com/b"]:
            client.post(f"/api/events/{created['id']}/links", json={"url": url}, headers=owner_headers)
        for label in ["Seat upgrade", "Bag"]:
            client.post(
                f"/api/events/{created['id']}/expenses",
                json={"label": label, "amount": 20, "currency": "GBP"},
                headers=owner_headers,
            )

        listed = _list(client, calendar, owner_headers)

        assert len(listed) == 1
        assert len(listed[0]["links"]) == 2
        assert len(listed[0]["expenses"]) == 2
        assert listed[0]["travel"]["gate"] == "B32"


def _details_row(db_conn, event_id: int) -> dict | None:
    with db_conn.cursor() as cur:
        cur.execute("SELECT * FROM event_travel_details WHERE event_id = %s", (event_id,))
        return cur.fetchone()


class TestChangingTheTravelMode:
    def test_back_to_an_ordinary_event_deletes_the_details(self, client, db_conn, calendar, owner_headers):
        created = _create(client, calendar, owner_headers, travel_mode="flight", travel=FLIGHT)

        res = client.patch(f"/api/events/{created['id']}", json={"travel_mode": None}, headers=owner_headers)

        assert res.json()["travel_mode"] is None
        assert res.json()["travel"] is None
        assert _details_row(db_conn, created["id"]) is None

    def test_flight_to_train_keeps_shared_fields_and_drops_flight_only_ones(self, client, calendar, owner_headers):
        created = _create(
            client, calendar, owner_headers, travel_mode="flight", travel=FLIGHT,
            booking_reference="K7XQ2M", location="Heathrow T5",
        )

        res = client.patch(f"/api/events/{created['id']}", json={"travel_mode": "train"}, headers=owner_headers)

        assert res.json()["travel_mode"] == "train"
        assert res.json()["travel"] == EMPTY_TRAVEL | {"origin": "LHR", "destination": "FCO", "seat": "14A"}
        assert res.json()["booking_reference"] == "K7XQ2M"
        assert res.json()["location"] == "Heathrow T5"

    def test_back_to_an_ordinary_event_keeps_the_reference_and_address(self, client, calendar, owner_headers):
        created = _create(
            client, calendar, owner_headers, travel_mode="flight", travel=FLIGHT,
            booking_reference="K7XQ2M", location="Heathrow T5",
        )

        res = client.patch(f"/api/events/{created['id']}", json={"travel_mode": None}, headers=owner_headers)

        assert res.json()["booking_reference"] == "K7XQ2M"
        assert res.json()["location"] == "Heathrow T5"

    def test_train_to_flight_drops_the_coach(self, client, calendar, owner_headers):
        created = _create(client, calendar, owner_headers, travel_mode="train", travel=TRAIN)

        res = client.patch(f"/api/events/{created['id']}", json={"travel_mode": "flight"}, headers=owner_headers)

        assert res.json()["travel"]["coach"] is None
        assert res.json()["travel"]["seat"] == "61"

    def test_making_an_ordinary_event_a_flight_creates_empty_details(self, client, db_conn, calendar, owner_headers):
        created = _create(client, calendar, owner_headers)

        res = client.patch(f"/api/events/{created['id']}", json={"travel_mode": "flight"}, headers=owner_headers)

        assert res.json()["travel_mode"] == "flight"
        assert res.json()["travel"] == EMPTY_TRAVEL
        assert _details_row(db_conn, created["id"]) is not None


def _archived_travel(db_conn, event_ids: list[int]) -> list[dict]:
    with db_conn.cursor() as cur:
        cur.execute(
            "SELECT event_id, gate, coach FROM deleted_event_travel_details WHERE event_id = ANY(%s) ORDER BY event_id",
            (event_ids,),
        )
        return cur.fetchall()


class TestTravelSurvivesDeleteAndRestore:
    def test_restoring_a_calendar_brings_back_flights_and_trains_unchanged(self, client, calendar, owner_headers):
        flight = _create(
            client, calendar, owner_headers, travel_mode="flight", travel=FLIGHT, booking_reference="K7XQ2M"
        )
        train = _create(client, calendar, owner_headers, travel_mode="train", travel=TRAIN, booking_reference="Q4PL9X")
        ordinary = _create(client, calendar, owner_headers, booking_reference="VM-2035")

        assert client.delete(f"/api/calendars/{calendar['uuid']}", headers=owner_headers).status_code == 204
        assert client.post(f"/api/calendars/{calendar['uuid']}/restore", headers=owner_headers).status_code == 204

        restored = {event["id"]: event for event in _list(client, calendar, owner_headers)}
        assert restored[flight["id"]]["travel_mode"] == "flight"
        assert restored[flight["id"]]["travel"] == EMPTY_TRAVEL | FLIGHT
        assert restored[train["id"]]["travel_mode"] == "train"
        assert restored[train["id"]]["travel"] == EMPTY_TRAVEL | TRAIN
        assert restored[ordinary["id"]]["travel_mode"] is None
        assert restored[ordinary["id"]]["travel"] is None
        assert {event_id: event["booking_reference"] for event_id, event in restored.items()} == {
            flight["id"]: "K7XQ2M", train["id"]: "Q4PL9X", ordinary["id"]: "VM-2035",
        }

    def test_deleting_archives_the_details_and_restoring_empties_the_archive(
        self, client, db_conn, calendar, owner_headers
    ):
        flight = _create(client, calendar, owner_headers, travel_mode="flight", travel=FLIGHT)

        client.delete(f"/api/calendars/{calendar['uuid']}", headers=owner_headers)
        assert _archived_travel(db_conn, [flight["id"]]) == [{"event_id": flight["id"], "gate": "B32", "coach": None}]

        client.post(f"/api/calendars/{calendar['uuid']}/restore", headers=owner_headers)
        assert _archived_travel(db_conn, [flight["id"]]) == []


class TestTestDataCleanupRemovesArchivedTravel:
    def test_reset_removes_archived_travel_details(self, client, db_conn, owner, owner_headers):
        cal = create_calendar(db_conn, CalendarCreate(name="Reset me", created_by=owner["id"]))
        flight = _create(client, cal, owner_headers, travel_mode="flight", travel=FLIGHT)
        delete_calendar(db_conn, cal["id"])

        reset_test_user_data(db_conn, owner["id"])

        assert _archived_travel(db_conn, [flight["id"]]) == []

    def test_deleting_the_user_removes_archived_travel_details(self, client, db_conn, owner, owner_headers):
        cal = create_calendar(db_conn, CalendarCreate(name="Delete me", created_by=owner["id"]))
        flight = _create(client, cal, owner_headers, travel_mode="flight", travel=FLIGHT)
        delete_calendar(db_conn, cal["id"])

        delete_user(db_conn, owner["id"])

        assert _archived_travel(db_conn, [flight["id"]]) == []

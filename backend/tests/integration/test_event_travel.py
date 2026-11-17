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
EMPTY_TRAVEL = dict.fromkeys(
    ["origin", "destination", "number", "terminal", "gate", "coach", "seat", "booking_reference"]
)


def _create(client, calendar: dict, headers: dict, **fields) -> dict:
    payload = {"calendar_id": calendar["id"], "title": "Flight to Rome", "date": "2035-06-01", "start_time": "07:15:00"}
    res = client.post("/api/events/", json=payload | fields, headers=headers)
    assert res.status_code == 201, res.text
    return res.json()


def _list(client, calendar: dict, headers: dict | None = None) -> list[dict]:
    return client.get(f"/api/events/?calendar_uuid={calendar['uuid']}", headers=headers or {}).json()


class TestCreateTravelEvents:
    def test_flight_round_trips_through_create_get_and_list(self, client, calendar, owner_headers):
        created = _create(client, calendar, owner_headers, travel_mode="flight", travel=FLIGHT)

        fetched = client.get(f"/api/events/{created['id']}", headers=owner_headers).json()
        listed = _list(client, calendar, owner_headers)[0]

        for event in (created, fetched, listed):
            assert event["travel_mode"] == "flight"
            assert event["travel"] == EMPTY_TRAVEL | FLIGHT

    def test_train_round_trips(self, client, calendar, owner_headers):
        created = _create(client, calendar, owner_headers, travel_mode="train", travel=TRAIN)

        fetched = client.get(f"/api/events/{created['id']}", headers=owner_headers).json()

        assert fetched["travel_mode"] == "train"
        assert fetched["travel"] == EMPTY_TRAVEL | TRAIN

    def test_ordinary_events_have_no_travel(self, client, calendar, owner_headers):
        created = _create(client, calendar, owner_headers)

        assert created["travel_mode"] is None
        assert created["travel"] is None
        assert _list(client, calendar, owner_headers)[0]["travel"] is None

    def test_mismatched_fields_are_rejected_and_nothing_is_created(self, client, calendar, owner_headers):
        payload = {"calendar_id": calendar["id"], "title": "Train", "date": "2035-06-01", "start_time": "07:15:00"}

        for extra in [{"travel": FLIGHT}, {"travel_mode": "train", "travel": {"gate": "B32"}}]:
            res = client.post("/api/events/", json=payload | extra, headers=owner_headers)
            assert res.status_code == 422

        assert _list(client, calendar, owner_headers) == []


class TestUpdateTravelEvents:
    def test_moving_a_flight_to_another_day_keeps_its_details(self, client, calendar, owner_headers):
        created = _create(client, calendar, owner_headers, travel_mode="flight", travel=FLIGHT)

        res = client.patch(
            f"/api/events/{created['id']}",
            json={"date": "2035-06-02", "start_time": "08:00:00"},
            headers=owner_headers,
        )

        assert res.status_code == 200
        assert res.json()["travel_mode"] == "flight"
        assert res.json()["travel"] == EMPTY_TRAVEL | FLIGHT

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
        _create(client, calendar, owner_headers, travel_mode="flight", travel=FLIGHT)

        anonymous = _list(client, calendar)[0]["travel"]
        non_member = _list(client, calendar, other_headers)[0]["travel"]
        owner = _list(client, calendar, owner_headers)[0]["travel"]

        assert anonymous == EMPTY_TRAVEL | FLIGHT | {"booking_reference": None}
        assert non_member["booking_reference"] is None
        assert owner["booking_reference"] == "K7XQ2M"


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
        created = _create(client, calendar, owner_headers, travel_mode="flight", travel=FLIGHT)

        res = client.patch(f"/api/events/{created['id']}", json={"travel_mode": "train"}, headers=owner_headers)

        assert res.json()["travel_mode"] == "train"
        assert res.json()["travel"] == EMPTY_TRAVEL | {
            "origin": "LHR", "destination": "FCO", "seat": "14A", "booking_reference": "K7XQ2M",
        }

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

import pytest


@pytest.fixture
def user() -> dict:
    """The authenticated user acting in router tests."""
    return {"id": 1, "name": "Ana", "email": "ana@example.com"}


@pytest.fixture
def db() -> object:
    """Opaque stand-in for a connection. Router tests patch `crud`, so the
    connection is only passed through and never used."""
    return object()

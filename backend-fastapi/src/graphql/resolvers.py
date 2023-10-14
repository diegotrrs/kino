from ariadne import ScalarType
from datetime import date, datetime

from ariadne import (
    MutationType,
    QueryType,
    convert_kwargs_to_snake_case,
)
from ..models import Note, Calendar
from ..database import SessionLocal

DATE_TIME_FORMAT = "%d-%m-%Y"

query = QueryType()
mutation = MutationType()

date_scalar = ScalarType("Date")

'''
It is used to convert Python date objects to a string representation that can be sent as a response to the client.
'''
@date_scalar.serializer
def serialize_date(value) -> str:
    return value.isoformat()

'''
It is used to parse the incoming string value (assumed to be in YYYY-MM-DD format) from the client and convert it to a Python date object that can be used within your resolvers and models.
'''
@date_scalar.value_parser
def parse_date_value(value) -> date:
    return datetime.strptime(value, DATE_TIME_FORMAT).date()

'''
It is used to parse the date literals from the GraphQL query (if provided as a literal in the query) and convert them into Python date objects.
'''
@date_scalar.literal_parser
def parse_date_literal(ast) -> date:
    return datetime.strptime(ast.value, DATE_TIME_FORMAT).date()

@query.field("getAllCalendars")
def resolve_getAllCalendar(*_):
    db = SessionLocal()
    calendars = db.query(Calendar).all()
    db.close()
    return calendars

@query.field("getAllNotes")
def resolve_getAllNotes(*_):
    db = SessionLocal()
    notes = db.query(Note).all()
    db.close()
    return notes


@query.field("getNoteById")
@convert_kwargs_to_snake_case
def resolve_getNoteById(*_, note_id):
    db = SessionLocal()
    note = db.query(Note).filter(Note.id == note_id).first()
    db.close()
    return note

@query.field("getCalendarById")
@convert_kwargs_to_snake_case
def resolve_getCalendarById(*_, calendar_id):
    db = SessionLocal()
    calendar = db.query(Calendar).filter(Calendar.id == calendar_id).first()
    db.close()
    return calendar

@mutation.field("createCalendar")
def resolve_createCalendar(*_, input):
    name = input.get("name")
    start_date = input.get("startDate")
    end_date = input.get("endDate")
    location = input.get("location")
    db = SessionLocal()

    calendar = Calendar(name=name, start_date=start_date, end_date=end_date, location=location)
    db.add(calendar)
    db.commit()
    db.refresh(calendar)
    return calendar


@mutation.field("createNote")
def resolve_createNote(*_, input):
    name = input.get("name")
    completed = input.get("completed")    
    db = SessionLocal()

    note = Note(name=name, completed=completed)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@mutation.field("updateNote")
def resolve_updateNote(*_, input):
    id = input.get("id")
    name = input.get("name")
    completed = input.get("completed")
    db = SessionLocal()

    note = db.query(Note).filter(Note.id == id).first()
    if note:
        if name:
            note.name = name

        if completed is not None:
            note.completed = completed

        db.commit()
        db.refresh(note)
    return note


@mutation.field("deleteNote")
@convert_kwargs_to_snake_case
def resolve_deleteNote(*_, note_id):
    db = SessionLocal()
    note = db.query(Note).filter(Note.id == note_id).first()
    if note:
        db.delete(note)
        db.commit()
        return True
    return False

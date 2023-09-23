from src.database import SessionLocal
from src.models import Note
from ariadne import (
    MutationType,
    QueryType,
    load_schema_from_path,
    make_executable_schema,
    snake_case_fallback_resolvers,
    convert_kwargs_to_snake_case,
)

type_defs = [
    load_schema_from_path("./src/graphql/core.graphql"),
]

query = QueryType()
mutation = MutationType()

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

schema = make_executable_schema(
    type_defs,
    query,
    mutation,
    snake_case_fallback_resolvers,
)
from src.database import SessionLocal
from src.models import User
from ariadne import (
    MutationType,
    QueryType,
    load_schema_from_path,
    make_executable_schema,
    snake_case_fallback_resolvers,
)

type_defs = [
    load_schema_from_path("./src/graphql/core.graphql"),
]

query = QueryType()

@query.field("users")
def resolve_users(*_):
    db = SessionLocal()
    users = db.query(User).all()
    db.close()
    return users

#mutation = MutationType()

schema = make_executable_schema(
    type_defs,
    query,
    #mutation,
    snake_case_fallback_resolvers,
)
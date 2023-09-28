from ariadne import (
    load_schema_from_path,
    make_executable_schema,
    snake_case_fallback_resolvers,
)
from .resolvers import query, mutation, date_scalar

type_defs = [load_schema_from_path("./src/graphql/schema.graphql")]


schema = make_executable_schema(
    type_defs,
    date_scalar,
    query,
    mutation,
    snake_case_fallback_resolvers,
)

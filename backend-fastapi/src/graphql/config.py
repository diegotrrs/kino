from ariadne import (
    load_schema_from_path,
    make_executable_schema,
    snake_case_fallback_resolvers,
)
from .resolvers import query, mutation

type_defs = [load_schema_from_path("./src/graphql/core.graphql")]

schema = make_executable_schema(
    type_defs,
    query,
    mutation,
    snake_case_fallback_resolvers,
)
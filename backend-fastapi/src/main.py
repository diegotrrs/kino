from fastapi import FastAPI
from ariadne.asgi import GraphQL
from src.database import engine
from src.models import Base
from src.graphql.config import schema

Base.metadata.create_all(bind=engine)

# FastAPI setup
app = FastAPI()

app.add_route("/", GraphQL(schema=schema, debug=True))

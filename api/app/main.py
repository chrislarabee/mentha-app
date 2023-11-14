import os

from fastapi import FastAPI

from app.routes.category import CategoryRouter
from app.storage.db import MenthaDB

app = FastAPI(title="Mentha App API")

db = MenthaDB(
    user=os.environ["DB_USER"],
    pwd=os.environ["DB_PWD"],
    host=os.environ["DB_URL"],
)

category_router = CategoryRouter(db.categories)
app.include_router(category_router.create_fastapi_router(), prefix="/categories")

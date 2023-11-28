import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.account import AccountRouter

from app.routes.category import CategoryRouter
from app.routes.institution import InstitutionRouter
from app.storage.db import MenthaDB

app = FastAPI(title="Mentha App API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = MenthaDB(
    user=os.environ["DB_USER"],
    pwd=os.environ["DB_PWD"],
    host=os.environ["DB_URL"],
)

category_router = CategoryRouter(db.categories)
app.include_router(category_router.create_fastapi_router(), prefix="/categories")

institution_router = InstitutionRouter(db.institutions)
app.include_router(institution_router.create_fastapi_router(), prefix="/institutions")

account_router = AccountRouter(db.accounts, db.institutions)
app.include_router(account_router.create_fastapi_router(), prefix="/accounts")

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.account import AccountRouter
from app.routes.budget import BudgetRouter
from app.routes.category import CategoryRouter
from app.routes.institution import InstitutionRouter
from app.routes.rule import RuleRouter
from app.routes.transaction import TransactionRouter
from app.routes.trend import TrendRouter
from app.storage.db import MenthaDB


def create_app(db: MenthaDB) -> FastAPI:
    # Closes down db connections whenever the app exits:
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        yield
        await db.dispose_async()

    app = FastAPI(title="Mentha App API", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    account_router = AccountRouter(db.accounts, db.institutions)
    app.include_router(account_router.create_fastapi_router(), prefix="/accounts")

    budget_router = BudgetRouter(db)
    app.include_router(budget_router.create_fastapi_router(), prefix="/budgets")

    category_router = CategoryRouter(db.categories)
    app.include_router(category_router.create_fastapi_router(), prefix="/categories")

    institution_router = InstitutionRouter(db.institutions)
    app.include_router(
        institution_router.create_fastapi_router(), prefix="/institutions"
    )

    rule_router = RuleRouter(db.rules, db.categories)
    app.include_router(rule_router.create_fastapi_router(), prefix="/rules")

    transaction_router = TransactionRouter(db)
    app.include_router(
        transaction_router.create_fastapi_router(), prefix="/transactions"
    )

    trend_router = TrendRouter(db)
    app.include_router(trend_router.create_fastapi_router(), prefix="/trends")

    return app

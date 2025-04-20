from typing import Generator, Iterable
from uuid import UUID, uuid4

import pytest
import sqlalchemy as sa
from fastapi.testclient import TestClient

from app.core import create_app
from app.storage.db import MenthaDB, MenthaDBConfig


def pytest_addoption(parser: pytest.Parser):
    parser.addoption(
        "--run-integration-tests",
        action="store_true",
        default=False,
        help="include integration tests",
    )


# Integration test marker config
def pytest_configure(config: pytest.Config):
    config.addinivalue_line(
        "markers",
        "integration: mark test as an integration test",
    )


def pytest_collection_modifyitems(config: pytest.Config, items: Iterable[pytest.Item]):
    if config.getoption("--run-integration-tests"):
        return
    skip_integration_tests = pytest.mark.skip(
        reason="need --run-integration-tests option to run"
    )
    for item in items:
        if "integration" in item.keywords:
            item.add_marker(skip_integration_tests)


@pytest.fixture(scope="session")
def mentha_client() -> Generator[TestClient, None, None]:
    conf = MenthaDBConfig(user="postgres", pwd="test", host="localhost:5432")
    db_url = MenthaDB.construct_db_url(conf)
    test_db_name = "mentha-db-test"
    src_engine = sa.create_engine(db_url, isolation_level="AUTOCOMMIT")
    with src_engine.connect() as conn:
        conn.exec_driver_sql(f'CREATE DATABASE "{test_db_name}";')

    conf.dbname = test_db_name
    test_db_url = MenthaDB.construct_db_url(conf)
    test_engine = sa.create_engine(test_db_url, isolation_level="AUTOCOMMIT")

    # Reflect the src db and then copy it to the test db:
    md = sa.MetaData()
    md.reflect(bind=src_engine)
    md.create_all(bind=test_engine)

    db = MenthaDB(conf)
    app = create_app(db)
    client = TestClient(app=app)
    yield client
    client.close()
    test_engine.dispose()
    db.dispose()
    with src_engine.connect() as conn:
        conn.exec_driver_sql(f'DROP DATABASE "{test_db_name}";')
    src_engine.dispose()


@pytest.fixture(scope="session")
def owner() -> UUID:
    return uuid4()

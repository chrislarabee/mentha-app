import os

from app.core import create_app
from app.storage.db import MenthaDB, MenthaDBConfig

db = MenthaDB(
    MenthaDBConfig(
        user=os.environ["DB_USER"],
        pwd=os.environ["DB_PWD"],
        host=os.environ["DB_URL"],
    )
)

app = create_app(db)

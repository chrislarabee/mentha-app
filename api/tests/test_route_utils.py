from datetime import datetime
from uuid import UUID
from app.domain.category import Category, PrimaryCategory, Subcategory
from app.domain.core import FilterModel
from app.domain.user import SYSTEM_USER
from app.routes import utils


def test_assemble_primary_categories():
    cat1 = Category(
        id=UUID("ca037de4-4594-46e4-b9d1-8f77b548eb9c"),
        name="Foo",
        owner=SYSTEM_USER.id,
    )
    cat2 = Category(
        id=UUID("3b946f97-1abd-4a89-b183-b5264b993ebc"),
        name="Bar",
        parentCategory=cat1.id,
        owner=SYSTEM_USER.id,
    )
    cat3 = Category(
        id=UUID("0ea7e8d2-af5d-40bb-9436-4398600352ec"),
        name="Spam",
        parentCategory=cat1.id,
        owner=SYSTEM_USER.id,
    )
    cat4 = Category(
        id=UUID("6ff54195-c428-4450-b3e7-b98e123dd984"),
        name="Parrot",
        owner=SYSTEM_USER.id,
    )
    cat5 = Category(
        id=UUID("65f6e23f-1895-49fd-a32f-75faaf510d2e"),
        name="Norwegian Blue",
        parentCategory=cat4.id,
        owner=SYSTEM_USER.id,
    )
    assert utils.assemble_primary_categories([cat1, cat2, cat3, cat4, cat5]) == [
        PrimaryCategory(
            id=cat1.id,
            name=cat1.name,
            owner=cat1.owner,
            subcategories=[
                Subcategory(
                    id=cat2.id,
                    name=cat2.name,
                    parentCategory=cat1.id,
                    owner=cat2.owner,
                ),
                Subcategory(
                    id=cat3.id,
                    name=cat3.name,
                    parentCategory=cat1.id,
                    owner=cat3.owner,
                ),
            ],
        ),
        PrimaryCategory(
            id=cat4.id,
            name=cat4.name,
            owner=cat4.owner,
            subcategories=[
                Subcategory(
                    id=cat5.id,
                    name=cat5.name,
                    parentCategory=cat4.id,
                    owner=cat5.owner,
                )
            ],
        ),
    ]


def test_preprocess_filters():
    raw = [
        FilterModel(field="foo", op="=", term="prueba"),
        FilterModel(field="bar", op="=", term="123"),
        FilterModel(field="spam", op="=", term="1.23"),
        FilterModel(field="eggs", op="<", term="2023-12-09"),
        FilterModel(field="eggz", op=">", term="2023/12/01"),
    ]
    assert utils.preprocess_filters(raw) == {
        "foo": FilterModel(field="foo", op="=", term="prueba"),
        "bar": FilterModel(field="bar", op="=", term=123),
        "spam": FilterModel(field="spam", op="=", term=1.23),
        "eggs": FilterModel(field="eggs", op="<", term=datetime(2023, 12, 9).date()),
        "eggz": FilterModel(field="eggz", op=">", term=datetime(2023, 12, 1).date()),
    }

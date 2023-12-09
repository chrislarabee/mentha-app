from datetime import datetime
import re
from uuid import UUID

from app.domain.category import Category, PrimaryCategory, Subcategory
from app.domain.core import FilterModel


def assemble_primary_categories(raw: list[Category]) -> list[PrimaryCategory]:
    primaries = list[Category]()
    subcategories = dict[UUID, list[Subcategory]]()

    for cat in raw:
        parent_uuid = cat.parentCategory
        if parent_uuid:
            if parent_uuid not in subcategories:
                subcategories[parent_uuid] = []
            subcategories[parent_uuid].append(
                Subcategory(
                    id=cat.id,
                    name=cat.name,
                    parentCategory=parent_uuid,
                    owner=cat.owner,
                )
            )
        else:
            primaries.append(cat)

    return [
        PrimaryCategory(
            id=cat.id,
            name=cat.name,
            owner=cat.owner,
            subcategories=subcategories.get(cat.id, []),
        )
        for cat in primaries
    ]


def preprocess_filters(filters: list[FilterModel]) -> dict[str, FilterModel]:
    result = dict[str, FilterModel]()
    for f in filters:
        term = f.term
        if isinstance(term, str):
            datematch = re.match(r"(\d{4})[-/](\d{2})[-/](\d{2})", term)
            isfloat = False
            try:
                float(term)
            except ValueError:
                pass
            else:
                isfloat = True
            if isfloat:
                f.term = float(term)
            elif term.isnumeric():
                f.term = int(term)
            elif datematch:
                yyyy, mm, dd = datematch.groups()
                f.term = datetime.strptime(f"{yyyy}-{mm}-{dd}", "%Y-%m-%d").date()
        result[f.field] = f
    return result

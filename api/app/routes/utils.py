from uuid import UUID
from app.domain.category import Category, PrimaryCategory, Subcategory


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

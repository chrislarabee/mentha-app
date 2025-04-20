import json
import pytest
from fastapi.testclient import TestClient
from uuid import UUID

from app.domain.category import Category


@pytest.mark.integration
def test_category_crud(mentha_client: TestClient, owner: UUID):
    resp = mentha_client.post(
        "/categories/",
        json={"name": "Test", "owner": str(owner), "parentCategory": None},
    )
    assert resp.status_code == 200
    uuid = UUID(json.loads(resp.content))
    resp = mentha_client.get(f"/categories/{uuid}")
    assert resp.status_code == 200
    model = Category.model_validate_json(resp.content)
    assert model.name == "Test"
    assert model.owner == owner

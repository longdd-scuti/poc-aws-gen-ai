from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_healthz_endpoint():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_readyz_endpoint():
    response = client.get("/readyz")
    # In local testing without strict native mode requirement, should be 200 ready
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "checks" in data


def test_routing_validation_failure():
    # Sending invalid empty body
    response = client.post("/v1/chat/routing/stream", json={"messages": []})
    assert response.status_code == 422


def test_rag_validation_failure():
    # Sending invalid body
    response = client.post("/v1/chat/rag/stream", json={"messages": []})
    assert response.status_code == 422

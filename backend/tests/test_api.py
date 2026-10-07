import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import Base, engine


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield


def test_health_check():
    with TestClient(app) as client:
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


def test_dashboard_summary():
    with TestClient(app) as client:
        response = client.get("/api/v1/dashboard/summary")
        assert response.status_code == 200
        data = response.json()
        assert "total_orders" in data
        assert "total_revenue" in data
        assert "delayed_orders" in data


def test_orders_pagination():
    with TestClient(app) as client:
        response = client.get("/api/v1/orders?page=1&page_size=5")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data


def test_products_list():
    with TestClient(app) as client:
        response = client.get("/api/v1/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["items"], list)

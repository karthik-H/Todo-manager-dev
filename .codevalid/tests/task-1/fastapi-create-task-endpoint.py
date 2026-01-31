import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend import database
from backend.models import Task, TaskCreate
from datetime import date
import uuid

client = TestClient(app)

def _clear_db():
    # Remove all tasks before each test
    tasks = database.get_tasks()
    for t in tasks:
        database.delete_task(t.id)

@pytest.fixture(autouse=True)
def run_around_tests():
    _clear_db()
    yield
    _clear_db()

def test_create_task_with_valid_data():
    payload = {
        "title": "Buy groceries",
        "description": "Milk, eggs, and bread",
        "due_date": "2024-07-01",
        "priority": "Medium"
    }
    response = client.post("/tasks", json=payload)
    assert response.status_code == 201 or response.status_code == 200
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["description"] == payload["description"]
    assert data["due_date"] == payload["due_date"]
    assert data["priority"] == payload["priority"]
    assert "id" in data

def test_create_task_with_missing_required_field():
    payload = {
        "description": "Finish math homework",
        "due_date": "2024-07-02",
        "priority": "Medium"
    }
    response = client.post("/tasks", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert any(
        err["loc"][-1] == "title" and err["msg"].startswith("field required")
        for err in data["detail"]
    )

def test_create_task_with_non_integer_priority():
    payload = {
        "title": "Doctor appointment",
        "description": "Annual checkup",
        "due_date": "2024-07-05",
        "priority": "high"  # Should be one of Priority Enum, not integer
    }
    response = client.post("/tasks", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert any(
        err["loc"][-1] == "priority"
        for err in data["detail"]
    )

def test_create_task_with_empty_title():
    payload = {
        "title": "",
        "description": "Clean the kitchen",
        "due_date": "2024-07-03",
        "priority": "Medium"
    }
    response = client.post("/tasks", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert any(
        err["loc"][-1] == "title"
        for err in data["detail"]
    )

def test_create_task_with_extra_fields():
    payload = {
        "title": "Pack luggage",
        "description": "For vacation",
        "due_date": "2024-07-10",
        "priority": "Medium",
        "unexpected_field": "unexpected_value"
    }
    response = client.post("/tasks", json=payload)
    assert response.status_code == 201 or response.status_code == 200
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["description"] == payload["description"]
    assert data["due_date"] == payload["due_date"]
    assert data["priority"] == payload["priority"]
    assert "id" in data
    assert "unexpected_field" not in data

def test_create_task_with_minimum_title_length():
    payload = {
        "title": "A",
        "description": "Short task",
        "due_date": "2024-07-04",
        "priority": "Medium"
    }
    response = client.post("/tasks", json=payload)
    assert response.status_code == 201 or response.status_code == 200
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["description"] == payload["description"]
    assert data["due_date"] == payload["due_date"]
    assert data["priority"] == payload["priority"]
    assert "id" in data

def test_create_task_with_maximum_title_length():
    max_title = "T" * 255
    payload = {
        "title": max_title,
        "description": "Boundary testing for title length",
        "due_date": "2024-07-06",
        "priority": "Medium"
    }
    response = client.post("/tasks", json=payload)
    assert response.status_code == 201 or response.status_code == 200
    data = response.json()
    assert data["title"] == max_title
    assert data["description"] == payload["description"]
    assert data["due_date"] == payload["due_date"]
    assert data["priority"] == payload["priority"]
    assert "id" in data

def test_create_task_with_invalid_due_date_format():
    payload = {
        "title": "Pay bills",
        "description": "Electric and water",
        "due_date": "07-01-2024",  # Invalid format
        "priority": "Medium"
    }
    response = client.post("/tasks", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert any(
        err["loc"][-1] == "due_date"
        for err in data["detail"]
    )

def test_create_task_with_null_description():
    payload = {
        "title": "Call mom",
        "description": None,
        "due_date": "2024-07-07",
        "priority": "Medium"
    }
    response = client.post("/tasks", json=payload)
    assert response.status_code == 201 or response.status_code == 200
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["description"] is None
    assert data["due_date"] == payload["due_date"]
    assert data["priority"] == payload["priority"]
    assert "id" in data

def test_create_task_without_content_type_header():
    payload = {
        "title": "Attend meeting",
        "description": "With the team",
        "due_date": "2024-07-08",
        "priority": "Medium"
    }
    # Send as data, not json, so no content-type
    response = client.post("/tasks", data=str(payload))
    assert response.status_code == 415 or response.status_code == 422 or response.status_code == 400

def test_create_task_with_priority_out_of_range():
    payload = {
        "title": "Feed cat",
        "description": "Morning routine",
        "due_date": "2024-07-09",
        "priority": -1
    }
    response = client.post("/tasks", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert any(
        err["loc"][-1] == "priority"
        for err in data["detail"]
    )
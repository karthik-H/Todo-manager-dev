import os
import json
import uuid
import pytest
from unittest import mock
from backend import database
from backend.models import Task, TaskCreate, Priority, Category

DB_FILE = database.DB_FILE

@pytest.fixture(autouse=True)
def cleanup_db_file():
    # Remove DB file before and after each test
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)
    yield
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)

def read_db():
    if not os.path.exists(DB_FILE):
        return []
    with open(DB_FILE, "r") as f:
        return json.load(f)

def test_add_task_with_minimal_valid_fields():
    # Given
    task_create = TaskCreate(title="Test Task")
    # When
    new_task = database.add_task(task_create)
    # Then
    assert new_task.title == "Test Task"
    assert isinstance(uuid.UUID(new_task.id), uuid.UUID)
    db = read_db()
    assert len(db) == 1
    assert db[0]["title"] == "Test Task"
    assert db[0]["id"] == new_task.id

def test_add_task_with_all_fields_provided():
    # Given
    task_create = TaskCreate(
        title="Full Task",
        description="All fields",
        priority=Priority.high,
        category=Category.work,
        due_date="2026-12-31",
        completed=True
    )
    # When
    new_task = database.add_task(task_create)
    # Then
    assert new_task.title == "Full Task"
    assert new_task.description == "All fields"
    assert new_task.priority == Priority.high
    assert new_task.category == Category.work
    assert str(new_task.due_date) == "2026-12-31"
    assert new_task.completed is True
    db = read_db()
    assert len(db) == 1
    assert db[0]["title"] == "Full Task"
    assert db[0]["description"] == "All fields"
    assert db[0]["priority"] == Priority.high
    assert db[0]["category"] == Category.work
    assert db[0]["due_date"] == "2026-12-31"
    assert db[0]["completed"] is True

def test_add_task_with_unique_id_generation():
    # Given
    existing_tasks = [
        Task(id="1", title="A"),
        Task(id="2", title="B"),
        Task(id="3", title="C"),
    ]
    database.save_tasks(existing_tasks)
    task_create = TaskCreate(title="New Task")
    # When
    new_task = database.add_task(task_create)
    # Then
    assert new_task.id not in ["1", "2", "3"]
    db = read_db()
    assert len(db) == 4
    ids = [t["id"] for t in db]
    assert new_task.id in ids

def test_add_task_when_database_file_is_empty():
    # Given
    with open(DB_FILE, "w") as f:
        f.write("[]")
    task_create = TaskCreate(title="Empty DB Task")
    # When
    new_task = database.add_task(task_create)
    # Then
    assert new_task.title == "Empty DB Task"
    db = read_db()
    assert len(db) == 1
    assert db[0]["title"] == "Empty DB Task"

def test_add_task_when_database_file_does_not_exist():
    # Given
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)
    task_create = TaskCreate(title="No DB Task")
    # When
    new_task = database.add_task(task_create)
    # Then
    assert new_task.title == "No DB Task"
    assert os.path.exists(DB_FILE)
    db = read_db()
    assert len(db) == 1
    assert db[0]["title"] == "No DB Task"

def test_add_task_with_missing_required_field():
    # Given
    # title is required, so omit it
    with pytest.raises(TypeError):
        TaskCreate()

def test_add_task_with_invalid_field_type():
    # Given
    # title should be str, pass int
    with pytest.raises(Exception):
        TaskCreate(title=123)

def test_add_task_with_duplicate_title():
    # Given
    task1 = TaskCreate(title="Duplicate")
    database.add_task(task1)
    task2 = TaskCreate(title="Duplicate")
    # When
    new_task = database.add_task(task2)
    # Then
    db = read_db()
    assert len(db) == 2
    assert db[0]["title"] == "Duplicate"
    assert db[1]["title"] == "Duplicate"
    assert db[0]["id"] != db[1]["id"]

def test_add_task_with_extremely_large_field_values():
    # Given
    long_str = "x" * 10000
    task_create = TaskCreate(title=long_str, description=long_str)
    # When
    new_task = database.add_task(task_create)
    # Then
    assert new_task.title == long_str
    assert new_task.description == long_str
    db = read_db()
    assert db[0]["title"] == long_str
    assert db[0]["description"] == long_str

def test_add_task_with_special_or_unicode_characters():
    # Given
    special_title = "🚀 Привет 世界"
    special_desc = "Emoji: 😃, Cyrillic: тест, Chinese: 测试"
    task_create = TaskCreate(title=special_title, description=special_desc)
    # When
    new_task = database.add_task(task_create)
    # Then
    assert new_task.title == special_title
    assert new_task.description == special_desc
    db = read_db()
    assert db[0]["title"] == special_title
    assert db[0]["description"] == special_desc

def test_add_task_with_corrupted_database_file():
    # Given
    with open(DB_FILE, "w") as f:
        f.write("not a json")
    task_create = TaskCreate(title="Corrupt DB Task")
    # When
    new_task = database.add_task(task_create)
    # Then
    assert new_task.title == "Corrupt DB Task"
    db = read_db()
    assert len(db) == 1
    assert db[0]["title"] == "Corrupt DB Task"

def test_add_task_when_database_write_fails(monkeypatch):
    # Given
    task_create = TaskCreate(title="Write Fail Task")
    def fail_write(*args, **kwargs):
        raise IOError("Disk full or permission denied")
    monkeypatch.setattr(database, "save_tasks", fail_write)
    # When/Then
    with pytest.raises(IOError):
        database.add_task(task_create)

def test_add_task_with_null_input():
    # Given
    # None input
    with pytest.raises(Exception):
        database.add_task(None)
    # Empty dict input
    with pytest.raises(TypeError):
        database.add_task(TaskCreate())

def test_add_task_with_concurrent_writes():
    # Given
    import threading
    results = []
    def add():
        tc = TaskCreate(title="Concurrent")
        results.append(database.add_task(tc))
    threads = [threading.Thread(target=add) for _ in range(2)]
    # When
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    # Then
    db = read_db()
    assert len(db) == 2
    ids = [t["id"] for t in db]
    assert ids[0] != ids[1]
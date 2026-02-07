from pydantic import BaseModel
from typing import Optional
from datetime import date
from enum import Enum

class Priority(str, Enum):
    low = "Low"
    medium = "Medium"
    high = "High"

class Category(str, Enum):
    work = "Work"
    personal = "Personal"
    study = "Study"

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Priority = Priority.medium
    category: Optional[Category] = None
    due_date: Optional[date] = None
    completed: bool = False

class TaskCreate(TaskBase):
    title: str  # Required, non-empty
    # Enforce non-empty string for title
    @classmethod
    def __get_validators__(cls):
        yield from super().__get_validators__()
        def not_empty_title(v):
            if not isinstance(v, str) or not v.strip():
                raise ValueError("title must be a non-empty string")
            return v
        yield not_empty_title

class Task(TaskBase):
    id: str

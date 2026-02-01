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

from pydantic import BaseModel, field_validator

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Priority = Priority.medium
    category: Optional[Category] = None
    due_date: Optional[date] = None
    completed: bool = False

    @field_validator("title")
    @classmethod
    def title_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Title must not be empty")
        return v

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: str

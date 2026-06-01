from pydantic import BaseModel
from typing import List, Generic, TypeVar, Optional

T = TypeVar('T')


class Language(BaseModel):
    value: str
    label: str


class SearchResult(BaseModel, Generic[T]):
    items: List[T]
    total: int
    query: str

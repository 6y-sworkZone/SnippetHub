from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class CollectionBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    parent_id: Optional[int] = None


class CollectionCreate(CollectionBase):
    pass


class CollectionUpdate(CollectionBase):
    name: Optional[str] = None


class Collection(CollectionBase):
    id: int
    level: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CollectionTree(Collection):
    children: List["CollectionTree"] = Field(default_factory=list)
    snippet_count: int = 0


CollectionTree.model_rebuild()


class MoveSnippet(BaseModel):
    snippet_id: int
    target_collection_id: Optional[int] = None

from pydantic import BaseModel, Field, field_validator, field_serializer
from typing import List, Optional, Any
from datetime import datetime


class SnippetBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    code: str = Field(..., min_length=1)
    language: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None
    collection_id: Optional[int] = None
    is_template: bool = False
    template_variables: Optional[List[str]] = None
    tags: Any = Field(default_factory=list)

    @field_validator('tags', mode='before')
    @classmethod
    def validate_tags(cls, v: Any) -> Any:
        return v

    @field_serializer('tags')
    @classmethod
    def serialize_tags(cls, v: Any) -> List[str]:
        if isinstance(v, list):
            result = []
            for item in v:
                if hasattr(item, 'name'):
                    result.append(item.name)
                elif isinstance(item, str):
                    result.append(item)
            return result
        return []

    @field_validator('template_variables', mode='before')
    @classmethod
    def convert_template_vars(cls, v: Any) -> Optional[List[str]]:
        if v is None:
            return []
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except:
                return []
        if isinstance(v, list):
            return v
        return []

    @field_serializer('template_variables')
    @classmethod
    def serialize_template_vars(cls, v: Any) -> List[str]:
        if v is None:
            return []
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except:
                return []
        if isinstance(v, list):
            return v
        return []


class SnippetCreate(SnippetBase):
    pass


class SnippetUpdate(SnippetBase):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    code: Optional[str] = None
    language: Optional[str] = None


class Snippet(SnippetBase):
    id: int
    copy_count: int = 0
    last_copied_at: Optional[datetime] = None
    last_used_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SnippetSearchResult(Snippet):
    relevance_score: float = 0.0
    matched_fields: List[str] = Field(default_factory=list)


class SnippetFromTemplate(BaseModel):
    template_id: int
    title: str
    variables: dict


class CopyRecord(BaseModel):
    success: bool
    new_count: int

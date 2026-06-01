from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ShareBase(BaseModel):
    snippet_id: int
    expires_at: Optional[datetime] = None


class ShareCreate(ShareBase):
    pass


class ShareInfo(BaseModel):
    expires_at: Optional[datetime] = None


class Share(BaseModel):
    id: int
    snippet_id: int
    token: str
    expires_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SharedSnippet(BaseModel):
    title: str
    code: str
    language: str
    description: Optional[str] = None
    tags: list
    created_at: datetime
    share: ShareInfo

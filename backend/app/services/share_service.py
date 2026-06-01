from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
import secrets
from app.models import Share, Snippet
from app.schemas import ShareCreate, SharedSnippet


class ShareService:
    def __init__(self, db: Session):
        self.db = db

    def _generate_token(self) -> str:
        return secrets.token_urlsafe(16)

    def create(self, share_data: ShareCreate) -> Share:
        snippet = self.db.query(Snippet).filter(Snippet.id == share_data.snippet_id).first()
        if not snippet:
            raise ValueError("Snippet not found")

        token = self._generate_token()
        share = Share(
            snippet_id=share_data.snippet_id,
            token=token,
            expires_at=share_data.expires_at
        )
        self.db.add(share)
        self.db.commit()
        self.db.refresh(share)
        return share

    def get_by_token(self, token: str) -> Optional[SharedSnippet]:
        share = self.db.query(Share).filter(Share.token == token).first()
        if not share:
            return None

        if share.expires_at and share.expires_at < datetime.utcnow():
            self.db.delete(share)
            self.db.commit()
            return None

        snippet = share.snippet
        if not snippet:
            return None

        return SharedSnippet(
            title=snippet.title,
            code=snippet.code,
            language=snippet.language,
            description=snippet.description,
            tags=[tag.name for tag in snippet.tags],
            created_at=snippet.created_at,
            share={
                "expires_at": share.expires_at
            }
        )

    def delete(self, token: str) -> bool:
        share = self.db.query(Share).filter(Share.token == token).first()
        if not share:
            return False
        self.db.delete(share)
        self.db.commit()
        return True

    def get_by_snippet_id(self, snippet_id: int) -> Optional[Share]:
        return self.db.query(Share).filter(Share.snippet_id == snippet_id).first()

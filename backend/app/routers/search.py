from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas import SnippetSearchResult, SearchResult
from app.services import SearchService

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("", response_model=SearchResult[SnippetSearchResult])
def search_snippets(
    q: str = Query(..., min_length=1),
    language: Optional[str] = None,
    tags: Optional[List[str]] = Query(None),
    limit: int = 50,
    db: Session = Depends(get_db)
):
    service = SearchService(db)
    results, total = service.search(q, language, tags, limit)
    return {
        "items": results,
        "total": total,
        "query": q
    }

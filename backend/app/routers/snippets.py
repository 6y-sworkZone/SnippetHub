from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas import Snippet, SnippetCreate, SnippetUpdate, SnippetFromTemplate, CopyRecord
from app.services import SnippetService, TemplateService

router = APIRouter(prefix="/api/snippets", tags=["snippets"])


@router.get("", response_model=dict)
def get_snippets(
    skip: int = 0,
    limit: int = 100,
    collection_id: Optional[int] = None,
    is_template: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    service = SnippetService(db)
    snippets, total = service.get_all(skip, limit, collection_id, is_template)
    return {
        "items": snippets,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/templates", response_model=dict)
def get_templates(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    service = TemplateService(db)
    templates, total = service.get_templates(skip, limit)
    return {
        "items": templates,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/hot", response_model=List[Snippet])
def get_hot_snippets(limit: int = 10, db: Session = Depends(get_db)):
    service = SnippetService(db)
    return service.get_hot(limit)


@router.get("/recent", response_model=List[Snippet])
def get_recent_snippets(limit: int = 10, db: Session = Depends(get_db)):
    service = SnippetService(db)
    return service.get_recent(limit)


@router.get("/{snippet_id}", response_model=Snippet)
def get_snippet(snippet_id: int, db: Session = Depends(get_db)):
    service = SnippetService(db)
    snippet = service.get_by_id(snippet_id)
    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found")
    service.record_use(snippet_id)
    return snippet


@router.post("", response_model=Snippet, status_code=201)
def create_snippet(snippet_data: SnippetCreate, db: Session = Depends(get_db)):
    service = SnippetService(db)
    return service.create(snippet_data)


@router.post("/from-template", response_model=Snippet, status_code=201)
def create_from_template(data: SnippetFromTemplate, db: Session = Depends(get_db)):
    service = TemplateService(db)
    snippet = service.create_from_template(data)
    if not snippet:
        raise HTTPException(status_code=404, detail="Template not found")
    return snippet


@router.put("/{snippet_id}", response_model=Snippet)
def update_snippet(snippet_id: int, snippet_data: SnippetUpdate, db: Session = Depends(get_db)):
    service = SnippetService(db)
    snippet = service.update(snippet_id, snippet_data)
    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found")
    return snippet


@router.delete("/{snippet_id}", status_code=204)
def delete_snippet(snippet_id: int, db: Session = Depends(get_db)):
    service = SnippetService(db)
    success = service.delete(snippet_id)
    if not success:
        raise HTTPException(status_code=404, detail="Snippet not found")
    return None


@router.post("/{snippet_id}/copy", response_model=CopyRecord)
def record_copy(snippet_id: int, db: Session = Depends(get_db)):
    service = SnippetService(db)
    success, new_count = service.record_copy(snippet_id)
    if not success:
        raise HTTPException(status_code=404, detail="Snippet not found")
    return {"success": True, "new_count": new_count}


@router.put("/{snippet_id}/move")
def move_snippet(
    snippet_id: int,
    target_collection_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    service = SnippetService(db)
    success = service.move_to_collection(snippet_id, target_collection_id)
    if not success:
        raise HTTPException(status_code=404, detail="Snippet not found")
    return {"success": True}

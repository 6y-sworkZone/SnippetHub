from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import Share, ShareCreate, SharedSnippet
from app.services import ShareService

router = APIRouter(prefix="/api/shares", tags=["shares"])


@router.post("", response_model=Share, status_code=201)
def create_share(share_data: ShareCreate, db: Session = Depends(get_db)):
    service = ShareService(db)
    try:
        return service.create(share_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{token}", response_model=SharedSnippet)
def get_shared_snippet(token: str, db: Session = Depends(get_db)):
    service = ShareService(db)
    shared = service.get_by_token(token)
    if not shared:
        raise HTTPException(status_code=404, detail="Share not found or expired")
    return shared


@router.delete("/{token}", status_code=204)
def delete_share(token: str, db: Session = Depends(get_db)):
    service = ShareService(db)
    success = service.delete(token)
    if not success:
        raise HTTPException(status_code=404, detail="Share not found")
    return None

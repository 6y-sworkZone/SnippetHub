from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas import Language
from app.services import SnippetService

router = APIRouter(prefix="/api", tags=["meta"])


@router.get("/languages", response_model=List[Language])
def get_languages(db: Session = Depends(get_db)):
    service = SnippetService(db)
    return service.get_all_languages()


@router.get("/tags", response_model=List[str])
def get_tags(db: Session = Depends(get_db)):
    service = SnippetService(db)
    return service.get_all_tags()

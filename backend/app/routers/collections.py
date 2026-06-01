from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas import Collection, CollectionCreate, CollectionUpdate, CollectionTree
from app.services import CollectionService

router = APIRouter(prefix="/api/collections", tags=["collections"])


@router.get("", response_model=List[CollectionTree])
def get_collections(db: Session = Depends(get_db)):
    service = CollectionService(db)
    return service.get_tree()


@router.get("/flat", response_model=List[Collection])
def get_collections_flat(db: Session = Depends(get_db)):
    service = CollectionService(db)
    return service.get_all_flat()


@router.get("/{collection_id}", response_model=Collection)
def get_collection(collection_id: int, db: Session = Depends(get_db)):
    service = CollectionService(db)
    collection = service.get_by_id(collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    return collection


@router.post("", response_model=Collection, status_code=201)
def create_collection(collection_data: CollectionCreate, db: Session = Depends(get_db)):
    service = CollectionService(db)
    try:
        return service.create(collection_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{collection_id}", response_model=Collection)
def update_collection(collection_id: int, collection_data: CollectionUpdate, db: Session = Depends(get_db)):
    service = CollectionService(db)
    try:
        collection = service.update(collection_id, collection_data)
        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found")
        return collection
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{collection_id}", status_code=204)
def delete_collection(collection_id: int, db: Session = Depends(get_db)):
    service = CollectionService(db)
    success = service.delete(collection_id)
    if not success:
        raise HTTPException(status_code=404, detail="Collection not found")
    return None

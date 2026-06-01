from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from app.models import Collection, Snippet
from app.schemas import CollectionCreate, CollectionUpdate


class CollectionService:
    def __init__(self, db: Session):
        self.db = db

    def _count_snippets_recursive(self, collection: Collection) -> int:
        count = len(collection.snippets)
        for child in collection.children:
            count += self._count_snippets_recursive(child)
        return count

    def _build_tree(self, collections: List[Collection], parent_id: Optional[int] = None) -> List[dict]:
        tree = []
        for col in collections:
            if col.parent_id == parent_id:
                children = self._build_tree(collections, col.id)
                tree.append({
                    "id": col.id,
                    "name": col.name,
                    "parent_id": col.parent_id,
                    "level": col.level,
                    "created_at": col.created_at,
                    "updated_at": col.updated_at,
                    "children": children,
                    "snippet_count": self._count_snippets_recursive(col)
                })
        return tree

    def get_tree(self) -> List[dict]:
        collections = self.db.query(Collection).all()
        return self._build_tree(collections)

    def get_all_flat(self) -> List[dict]:
        collections = self.db.query(Collection).order_by(desc(Collection.created_at)).all()
        return [{
            "id": c.id,
            "name": c.name,
            "parent_id": c.parent_id,
            "level": c.level,
            "created_at": c.created_at,
            "updated_at": c.updated_at
        } for c in collections]

    def get_by_id(self, collection_id: int) -> Optional[dict]:
        collection = self.db.query(Collection).filter(Collection.id == collection_id).first()
        if not collection:
            return None
        return {
            "id": collection.id,
            "name": collection.name,
            "parent_id": collection.parent_id,
            "level": collection.level,
            "created_at": collection.created_at,
            "updated_at": collection.updated_at
        }

    def create(self, collection_data: CollectionCreate) -> Collection:
        level = 1
        if collection_data.parent_id:
            parent = self.get_by_id(collection_data.parent_id)
            if parent:
                level = parent.level + 1
                if level > 3:
                    raise ValueError("Maximum collection nesting level (3) exceeded")

        collection = Collection(
            name=collection_data.name,
            parent_id=collection_data.parent_id,
            level=level
        )
        self.db.add(collection)
        self.db.commit()
        self.db.refresh(collection)
        return {
            "id": collection.id,
            "name": collection.name,
            "parent_id": collection.parent_id,
            "level": collection.level,
            "created_at": collection.created_at,
            "updated_at": collection.updated_at
        }

    def update(self, collection_id: int, collection_data: CollectionUpdate) -> Optional[dict]:
        collection = self.db.query(Collection).filter(Collection.id == collection_id).first()
        if not collection:
            return None
        if collection_data.name is not None:
            collection.name = collection_data.name
        if collection_data.parent_id is not None:
            if collection_data.parent_id == 0:
                collection.parent_id = None
                collection.level = 1
            else:
                new_parent = self.db.query(Collection).filter(Collection.id == collection_data.parent_id).first()
                if new_parent:
                    new_level = new_parent.level + 1
                    if new_level > 3:
                        raise ValueError("Maximum collection nesting level (3) exceeded")
                    collection.parent_id = collection_data.parent_id
                    collection.level = new_level
        self.db.commit()
        self.db.refresh(collection)
        return {
            "id": collection.id,
            "name": collection.name,
            "parent_id": collection.parent_id,
            "level": collection.level,
            "created_at": collection.created_at,
            "updated_at": collection.updated_at
        }

    def delete(self, collection_id: int) -> bool:
        collection = self.get_by_id(collection_id)
        if not collection:
            return False
        self.db.delete(collection)
        self.db.commit()
        return True

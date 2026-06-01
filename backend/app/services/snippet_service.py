from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from typing import List, Optional, Tuple
import json
from datetime import datetime
from app.models import Snippet, Tag
from app.schemas import SnippetCreate, SnippetUpdate


class SnippetService:
    def __init__(self, db: Session):
        self.db = db

    def _get_or_create_tags(self, tag_names: List[str]) -> List[Tag]:
        tags = []
        for name in tag_names:
            tag = self.db.query(Tag).filter(Tag.name == name).first()
            if not tag:
                tag = Tag(name=name)
                self.db.add(tag)
                self.db.flush()
            tags.append(tag)
        return tags

    def _parse_template_variables(self, variables: Optional[List[str]]) -> Optional[str]:
        return json.dumps(variables) if variables else None

    def _serialize_template_variables(self, variables_str: Optional[str]) -> List[str]:
        return json.loads(variables_str) if variables_str else []

    def _to_dict(self, snippet: Snippet) -> dict:
        return {
            "id": snippet.id,
            "title": snippet.title,
            "code": snippet.code,
            "language": snippet.language,
            "description": snippet.description,
            "collection_id": snippet.collection_id,
            "is_template": snippet.is_template,
            "template_variables": self._serialize_template_variables(snippet.template_variables),
            "tags": [tag.name for tag in snippet.tags],
            "copy_count": snippet.copy_count,
            "last_copied_at": snippet.last_copied_at,
            "last_used_at": snippet.last_used_at,
            "created_at": snippet.created_at,
            "updated_at": snippet.updated_at,
        }

    def get_all(self, skip: int = 0, limit: int = 100, collection_id: Optional[int] = None, is_template: Optional[bool] = None) -> Tuple[List[dict], int]:
        query = self.db.query(Snippet)
        if collection_id is not None:
            query = query.filter(Snippet.collection_id == collection_id)
        if is_template is not None:
            query = query.filter(Snippet.is_template == is_template)
        total = query.count()
        snippets = query.order_by(desc(Snippet.updated_at)).offset(skip).limit(limit).all()
        return [self._to_dict(s) for s in snippets], total

    def get_by_id(self, snippet_id: int) -> Optional[dict]:
        snippet = self.db.query(Snippet).filter(Snippet.id == snippet_id).first()
        if snippet:
            return self._to_dict(snippet)
        return None

    def create(self, snippet_data: SnippetCreate) -> dict:
        snippet = Snippet(
            title=snippet_data.title,
            code=snippet_data.code,
            language=snippet_data.language,
            description=snippet_data.description,
            collection_id=snippet_data.collection_id,
            is_template=snippet_data.is_template,
            template_variables=self._parse_template_variables(snippet_data.template_variables),
        )
        if snippet_data.tags:
            snippet.tags = self._get_or_create_tags(snippet_data.tags)
        self.db.add(snippet)
        self.db.commit()
        self.db.refresh(snippet)
        return self._to_dict(snippet)

    def update(self, snippet_id: int, snippet_data: SnippetUpdate) -> Optional[dict]:
        snippet = self.db.query(Snippet).filter(Snippet.id == snippet_id).first()
        if not snippet:
            return None
        if snippet_data.title is not None:
            snippet.title = snippet_data.title
        if snippet_data.code is not None:
            snippet.code = snippet_data.code
        if snippet_data.language is not None:
            snippet.language = snippet_data.language
        if snippet_data.description is not None:
            snippet.description = snippet_data.description
        if snippet_data.collection_id is not None:
            snippet.collection_id = snippet_data.collection_id
        if snippet_data.is_template is not None:
            snippet.is_template = snippet_data.is_template
        if snippet_data.template_variables is not None:
            snippet.template_variables = self._parse_template_variables(snippet_data.template_variables)
        if snippet_data.tags is not None:
            snippet.tags = self._get_or_create_tags(snippet_data.tags)
        self.db.commit()
        self.db.refresh(snippet)
        return self._to_dict(snippet)

    def delete(self, snippet_id: int) -> bool:
        snippet = self.db.query(Snippet).filter(Snippet.id == snippet_id).first()
        if not snippet:
            return False
        self.db.delete(snippet)
        self.db.commit()
        return True

    def record_copy(self, snippet_id: int) -> Tuple[bool, int]:
        snippet = self.db.query(Snippet).filter(Snippet.id == snippet_id).first()
        if not snippet:
            return False, 0
        snippet.copy_count += 1
        snippet.last_copied_at = datetime.utcnow()
        self.db.commit()
        return True, snippet.copy_count

    def record_use(self, snippet_id: int) -> bool:
        snippet = self.db.query(Snippet).filter(Snippet.id == snippet_id).first()
        if not snippet:
            return False
        snippet.last_used_at = datetime.utcnow()
        self.db.commit()
        return True

    def get_hot(self, limit: int = 10) -> List[dict]:
        snippets = self.db.query(Snippet).order_by(desc(Snippet.copy_count)).limit(limit).all()
        return [self._to_dict(s) for s in snippets]

    def get_recent(self, limit: int = 10) -> List[dict]:
        snippets = self.db.query(Snippet).filter(
            Snippet.last_used_at.isnot(None)
        ).order_by(desc(Snippet.last_used_at)).limit(limit).all()
        return [self._to_dict(s) for s in snippets]

    def move_to_collection(self, snippet_id: int, collection_id: Optional[int]) -> bool:
        snippet = self.db.query(Snippet).filter(Snippet.id == snippet_id).first()
        if not snippet:
            return False
        snippet.collection_id = collection_id
        self.db.commit()
        return True

    def get_all_languages(self) -> List[dict]:
        languages = [
            {"value": "javascript", "label": "JavaScript"},
            {"value": "typescript", "label": "TypeScript"},
            {"value": "jsx", "label": "JSX"},
            {"value": "tsx", "label": "TSX"},
            {"value": "python", "label": "Python"},
            {"value": "go", "label": "Go"},
            {"value": "rust", "label": "Rust"},
            {"value": "java", "label": "Java"},
            {"value": "csharp", "label": "C#"},
            {"value": "cpp", "label": "C++"},
            {"value": "sql", "label": "SQL"},
            {"value": "shell", "label": "Shell"},
            {"value": "bash", "label": "Bash"},
            {"value": "html", "label": "HTML"},
            {"value": "css", "label": "CSS"},
            {"value": "json", "label": "JSON"},
            {"value": "yaml", "label": "YAML"},
            {"value": "markdown", "label": "Markdown"},
            {"value": "php", "label": "PHP"},
            {"value": "ruby", "label": "Ruby"},
            {"value": "swift", "label": "Swift"},
            {"value": "kotlin", "label": "Kotlin"},
        ]
        return languages

    def get_all_tags(self) -> List[str]:
        tags = self.db.query(Tag.name).all()
        return [tag[0] for tag in tags]

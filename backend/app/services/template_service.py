from sqlalchemy.orm import Session
from typing import Optional, List, Tuple
import re
import json
from app.models import Snippet, Tag
from app.schemas import SnippetCreate, SnippetFromTemplate


class TemplateService:
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

    def extract_variables(self, code: str) -> List[str]:
        pattern = r'\{\{([^{}]+)\}\}'
        matches = re.findall(pattern, code)
        return list(set(matches))

    def replace_variables(self, code: str, variables: dict) -> str:
        result = code
        for key, value in variables.items():
            pattern = r'\{\{\s*' + re.escape(key) + r'\s*\}\}'
            result = re.sub(pattern, str(value), result)
        return result

    def _to_dict(self, snippet: Snippet) -> dict:
        return {
            "id": snippet.id,
            "title": snippet.title,
            "code": snippet.code,
            "language": snippet.language,
            "description": snippet.description,
            "collection_id": snippet.collection_id,
            "is_template": snippet.is_template,
            "template_variables": json.loads(snippet.template_variables) if snippet.template_variables else [],
            "tags": [tag.name for tag in snippet.tags],
            "copy_count": snippet.copy_count,
            "last_copied_at": snippet.last_copied_at,
            "last_used_at": snippet.last_used_at,
            "created_at": snippet.created_at,
            "updated_at": snippet.updated_at,
        }

    def create_from_template(self, data: SnippetFromTemplate) -> Optional[dict]:
        template = self.db.query(Snippet).filter(Snippet.id == data.template_id).first()
        if not template or not template.is_template:
            return None

        template_vars = json.loads(template.template_variables) if template.template_variables else []
        for var in template_vars:
            if var not in data.variables:
                data.variables[var] = f"{{{{{var}}}}}"

        new_code = self.replace_variables(template.code, data.variables)

        snippet = Snippet(
            title=data.title,
            code=new_code,
            language=template.language,
            description=template.description,
            collection_id=template.collection_id,
            is_template=False,
            template_variables=None,
        )

        if template.tags:
            snippet.tags = self._get_or_create_tags([tag.name for tag in template.tags])

        self.db.add(snippet)
        self.db.commit()
        self.db.refresh(snippet)
        return self._to_dict(snippet)

    def get_templates(self, skip: int = 0, limit: int = 100) -> Tuple[List[dict], int]:
        query = self.db.query(Snippet).filter(Snippet.is_template == True)
        total = query.count()
        templates = query.order_by(Snippet.updated_at.desc()).offset(skip).limit(limit).all()
        return [self._to_dict(t) for t in templates], total

from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func
from typing import List, Optional, Tuple
import json
from app.models import Snippet, Tag, snippet_tags
from app.schemas import SnippetSearchResult


class SearchService:
    def __init__(self, db: Session):
        self.db = db

    def _serialize_template_variables(self, variables_str: Optional[str]) -> List[str]:
        return json.loads(variables_str) if variables_str else []

    def _calculate_relevance(self, snippet: Snippet, query: str) -> Tuple[float, List[str]]:
        score = 0.0
        matched_fields = []
        query_lower = query.lower()

        if query_lower in snippet.title.lower():
            score += 3.0
            matched_fields.append("title")
            if snippet.title.lower().startswith(query_lower):
                score += 1.0

        if query_lower in (snippet.description or "").lower():
            score += 1.5
            matched_fields.append("description")

        if query_lower in snippet.code.lower():
            score += 2.0
            matched_fields.append("code")
            code_occurrences = snippet.code.lower().count(query_lower)
            score += min(code_occurrences * 0.2, 1.0)

        for tag in snippet.tags:
            if query_lower in tag.name.lower():
                score += 2.5
                matched_fields.append("tags")
                break

        return score, matched_fields

    def search(self, query: str, language: Optional[str] = None, tags: Optional[List[str]] = None, limit: int = 50) -> Tuple[List[SnippetSearchResult], int]:
        if not query.strip():
            return [], 0

        query_lower = query.lower()

        db_query = self.db.query(Snippet).filter(
            or_(
                func.lower(Snippet.title).contains(query_lower),
                func.lower(Snippet.code).contains(query_lower),
                func.lower(Snippet.description).contains(query_lower),
                Snippet.tags.any(func.lower(Tag.name).contains(query_lower))
            )
        )

        if language:
            db_query = db_query.filter(Snippet.language == language)

        if tags:
            for tag in tags:
                db_query = db_query.filter(Snippet.tags.any(Tag.name == tag))

        snippets = db_query.all()

        results = []
        for snippet in snippets:
            score, matched_fields = self._calculate_relevance(snippet, query)
            template_vars = self._serialize_template_variables(snippet.template_variables)
            tag_names = [tag.name for tag in snippet.tags]
            result = SnippetSearchResult(
                id=snippet.id,
                title=snippet.title,
                code=snippet.code,
                language=snippet.language,
                description=snippet.description,
                collection_id=snippet.collection_id,
                is_template=snippet.is_template,
                template_variables=template_vars,
                tags=tag_names,
                copy_count=snippet.copy_count,
                last_copied_at=snippet.last_copied_at,
                last_used_at=snippet.last_used_at,
                created_at=snippet.created_at,
                updated_at=snippet.updated_at,
                relevance_score=score,
                matched_fields=matched_fields
            )
            results.append(result)

        results.sort(key=lambda x: x.relevance_score, reverse=True)
        results = results[:limit]

        return results, len(results)

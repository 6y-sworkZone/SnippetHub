from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Snippet(Base):
    __tablename__ = "snippets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    code = Column(Text, nullable=False)
    language = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=True)
    collection_id = Column(Integer, ForeignKey("collections.id", ondelete="SET NULL"), nullable=True, index=True)
    is_template = Column(Boolean, default=False, index=True)
    template_variables = Column(Text, nullable=True)
    copy_count = Column(Integer, default=0)
    last_copied_at = Column(DateTime, nullable=True)
    last_used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    collection = relationship("Collection", back_populates="snippets")
    tags = relationship("Tag", secondary="snippet_tags", back_populates="snippets")
    shares = relationship("Share", back_populates="snippet", cascade="all, delete-orphan")

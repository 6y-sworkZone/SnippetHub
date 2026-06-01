from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Collection(Base):
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    parent_id = Column(Integer, ForeignKey("collections.id", ondelete="CASCADE"), nullable=True)
    level = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    parent = relationship("Collection", remote_side=[id], back_populates="children")
    children = relationship("Collection", back_populates="parent", cascade="all, delete-orphan")
    snippets = relationship("Snippet", back_populates="collection")

    __table_args__ = (CheckConstraint("level <= 3", name="check_max_level"),)

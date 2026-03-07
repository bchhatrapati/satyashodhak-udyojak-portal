from sqlalchemy import Column, Integer, Boolean, CheckConstraint

from app.database.base import Base


class IdTracker(Base):
    __tablename__ = "id_tracker"

    __table_args__ = (
        CheckConstraint("id = 1", name="only_one_row"),
        {"schema": "public"},
    )

    id = Column(Integer, primary_key=True)
    last_sequence_number = Column(Integer, nullable=False, default=10001)
    is_reverse_phase = Column(Boolean, nullable=False, default=True)

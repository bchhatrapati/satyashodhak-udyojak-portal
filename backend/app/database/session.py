import os
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

load_dotenv()

# -------------------------------------------------------------------------
# 1. Database URL
# -------------------------------------------------------------------------

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is missing in .env")


# -------------------------------------------------------------------------
# 2. Engine Configuration (Production Hardened)
# -------------------------------------------------------------------------

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,         # Detect stale connections
    pool_size=5,                # Base open connections
    max_overflow=10,            # Extra burst capacity
    pool_timeout=30,            # Wait 30s before giving up
    echo=False,                 # Never log SQL in production
    future=True,                # SQLAlchemy 2.x style
    isolation_level="READ COMMITTED",  # Explicit for clarity
)


# -------------------------------------------------------------------------
# 3. Session Factory
# -------------------------------------------------------------------------

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,  # Prevent object expiration after commit
)


# -------------------------------------------------------------------------
# 4. Dependency for FastAPI
# -------------------------------------------------------------------------

def get_db() -> Generator[Session, None, None]:
    """
    Provides a transactional database session.
    Closes automatically after request lifecycle.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
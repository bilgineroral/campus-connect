from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import dotenv
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
dotenv.load_dotenv(BASE_DIR / ".env")

DB_URL = os.getenv("DB_URL")

# Base class for all tables (sqlalchemy stuff)
Base = declarative_base()   

# Singleton class for database access
class DatabaseManager:
    _instance = None
    create_session = None
    session: Session = None
    def __new__(cls):
        if not cls._instance:
            cls._instance = super(DatabaseManager, cls).__new__(cls)
            cls._instance.engine = create_engine(DB_URL)
            # cls._instance.Base = declarative_base()
            # Base.metadata.create_all(bind=cls._instance.engine)
            cls._instance.create_session = sessionmaker(autocommit=False, autoflush=False, bind=cls._instance.engine)
            cls.session = None
            
        return cls._instance
    
    def get_session(self) -> Session:
        if not self.session or not self.session.is_active:
            self.session = self.create_session()
        return self.session
    
    def close_session(self):
        if self.session.is_active:
            self.session.close()
    
    def create_tables (self):
        Base.metadata.create_all(bind=self.engine)
from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.orm import relationship
from database.DatabaseManager import DatabaseManager, Base

class BlockedUserDB(Base):
    __tablename__ = 'blocked_users'
    blocker_id = Column(Integer, ForeignKey('users.user_id'), primary_key=True)
    blocked_id = Column(Integer, ForeignKey('users.user_id'), primary_key=True)

    # blocker = relationship('UserDB', foreign_keys=[blocker_id], back_populates='blocked_users', lazy='subquery')
    # blocked = relationship('UserDB', foreign_keys=[blocked_id], back_populates='blocked_by_users', lazy='subquery')

    @classmethod
    def block_user(cls, blocker_id: int, blocked_id: int):
        new_block = cls(blocker_id=blocker_id, blocked_id=blocked_id)
        db_manager = DatabaseManager()
        session = db_manager.get_session()
        session.add(new_block)
        session.commit()
        return new_block
    
    @classmethod
    def unblock_user(cls, blocker_id: int, blocked_id: int):
        db_manager = DatabaseManager()
        session = db_manager.get_session()
        session.query(cls).filter(cls.blocker_id == blocker_id, cls.blocked_id == blocked_id).delete()
        session.commit()

    def get_blocker(self):
        return self.blocker
    
    def get_blocked(self):
        return self.blocked
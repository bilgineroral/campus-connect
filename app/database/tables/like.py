from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.orm import relationship
from database.DatabaseManager import DatabaseManager, Base

class LikeDB(Base):
    __tablename__ = 'likes'
    user_id = Column(Integer, ForeignKey('users.user_id'), primary_key=True)
    post_id = Column(Integer, ForeignKey('posts.post_id'), primary_key=True)

    user = relationship('UserDB', back_populates='likes')
    post = relationship('PostDB', back_populates='likes')

    @classmethod
    def like_post(cls, post_id: int, user_id: int):
        new_like = cls(post_id=post_id, user_id=user_id)
        db_manager = DatabaseManager()
        session = db_manager.get_session()
        session.add(new_like)
        session.commit()
        return new_like
    
    @classmethod
    def unlike_post(cls, post_id: int, user_id: int):
        db_manager = DatabaseManager()
        session = db_manager.get_session()
        session.query(cls).filter(cls.post_id == post_id, cls.user_id == user_id).delete()
        session.commit()

    def get_user(self):
        return self.user
    
    def get_post(self):
        return self.post
    
    def to_dict(self):
        return {
            'user_id': self.user_id,
            'post_id': self.post_id
        }
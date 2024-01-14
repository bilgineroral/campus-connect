from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship
from database.DatabaseManager import DatabaseManager, Base


class CommentDB(Base):
    __tablename__ = 'comments'

    comment_id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey('posts.post_id'))
    user_id = Column(Integer, ForeignKey('users.user_id'))
    content = Column(String, nullable=False)
    timestamp = Column(DateTime(timezone=True),
                       server_default=func.now(), nullable=False)
    
    author = relationship('UserDB', back_populates='comments', lazy='subquery')
    post = relationship('PostDB', back_populates='comments', lazy='subquery')

    @classmethod
    def fetch_comment(cls, session, comment_id: int):
        comment = session.query(cls).filter(cls.comment_id == comment_id).first()
        return comment

    @classmethod
    def create_comment(cls, session, content: str, post, user_id: int):
        new_comment = cls(content=content, post_id=post.post_id, user_id=user_id)
        post.no_comments = post.no_comments + 1
        session.add(new_comment)
        session.add(post)
        session.commit()
    
    @classmethod
    def delete_comment(cls, session, comment_id: int):
        try:
            comment: CommentDB = session.query(cls).filter(cls.comment_id == comment_id).first()
            post = comment.post
            post.no_comments = post.no_comments - 1
            session.delete(comment)
            session.add(post)
            session.commit()
        except Exception as e:
            session.rollback()
            raise e

    @classmethod
    def update_comment(cls, session, comment, content: str):
        comment.content = content
        session.add(comment)
        session.commit()

    def to_dict(self):
        return {
            "comment_id": self.comment_id,
            "post_id": self.post_id,
            "content": self.content,
            "timestamp": self.timestamp,
            "author": self.author.to_dict(),
        }


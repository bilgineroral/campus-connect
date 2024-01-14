from sqlalchemy import Column, ForeignKey, Integer, String, Sequence
from sqlalchemy.orm import relationship
from database.DatabaseManager import DatabaseManager, Base

class NotificationDB(Base):
    __tablename__ = 'notifications'
    content = Column(String, primary_key=True)
    content_id = Column(String, primary_key=True)
    notification_id = Column(Integer, Sequence('notifications_notification_id_seq'))
    to_user_id = Column(Integer, ForeignKey('users.user_id'), nullable=False)

    user = relationship('UserDB', back_populates='notifications', lazy='subquery')

    def to_dict(self):
        return {
            "content": self.content,
            "content_id": self.content_id,
            "notification_id": self.notification_id,
            "to_user_id": self.to_user_id
        }

    @classmethod
    def fetch_notification(cls, notification_id: int):
        db_manager = DatabaseManager()
        with db_manager.get_session() as session:
            notification = session.query(cls).filter(cls.notification_id == notification_id).first()
            return notification

    @classmethod
    def create_notification(cls, session, content: str, content_id: str, to_user_id: int):

        try:
            notification = session.query(cls).filter(cls.content == content, cls.content_id == content_id).first()
            new_notification = cls(content=content, content_id=content_id, to_user_id=to_user_id)
            session.add(new_notification)
            session.commit()
        except Exception as e:
            session.rollback()
            print(e)


    @classmethod
    def delete(cls, session, notification_id: int):
        try:
            notification = cls.fetch_notification(notification_id)
            session.delete(notification)
            session.commit()
        except Exception as e:
            session.rollback()
            print(e)


    
    
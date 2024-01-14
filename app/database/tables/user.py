from typing import Union
from fastapi import UploadFile
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Float, func, Boolean, Sequence
from sqlalchemy.orm import relationship, Session
from enum import Enum

from database.tables.post import PostDB
from database.tables.like import LikeDB
from database.tables.block import BlockedUserDB
from database.DatabaseManager import DatabaseManager, Base
from FileManager import FileManager

FILEPATH = "static/profile_images/"

# Users table in the database


class UserDB(Base):
    __tablename__ = 'users'

    user_id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String(25), unique=True)
    email = Column(String(50), unique=True)
    bilkent_id = Column(Integer)
    name = Column(String(50))
    hashed_password = Column(String)
    bio = Column(String(260))
    profile_image = Column(String)
    show_mail = Column(Boolean, default=False)
    verified = Column(Boolean, default=False)

    posts = relationship('PostDB', back_populates='author', lazy='subquery')
    comments = relationship(
        'CommentDB', back_populates='author', lazy='subquery')
    notifications = relationship(
        'NotificationDB', back_populates='user', lazy='subquery')
    likes = relationship('LikeDB', back_populates='user', lazy='subquery')
    bids = relationship('BidDB', back_populates='user', lazy='subquery')

    blocked_users = relationship('UserDB',
                                 secondary=BlockedUserDB.__table__,
                                 primaryjoin=user_id == BlockedUserDB.blocker_id,
                                 secondaryjoin=user_id == BlockedUserDB.blocked_id,
                                 backref='blockers',
                                 lazy='subquery')

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "nickname": self.nickname,
            "email": self.email if self.show_mail else None,
            "bilkent_id": self.bilkent_id,
            "name": self.name,
            "bio": self.bio,
            "profile_image": self.profile_image,
            "show_mail": self.show_mail,
        }

    @classmethod
    def create_user(cls, session, nickname: str, email: str, bilkent_id: int, name: str, hashed_password: str):
        
        # check if user already exists
        user = UserDB.fetch_user(session, nickname=nickname)
        if user:
            raise ValueError("User with the given credentials already exists")
        try:
            new_user = cls(nickname=nickname, email=email, bilkent_id=bilkent_id,
                           name=name, hashed_password=hashed_password)
            session.add(new_user)
            session.commit()
            return new_user
        except Exception as e:
            session.rollback()  # undo the changes on error
            raise e

    @classmethod
    def fetch_user(cls, session: Session, user_id: Union[int, None] = None,
                   nickname: Union[str, None] = None,
                   email: Union[str, None] = None) -> 'UserDB':
        if user_id is None and nickname is None and email is None:
            raise RuntimeError(
                "At least one of user_id, nickname, or email must be provided for fetching user data")
        
        query = session.query(cls)
        if user_id is not None:
            query = query.filter_by(user_id=user_id)
        elif nickname is not None:
            query = query.filter_by(nickname=nickname)
        elif email is not None:
            query = query.filter_by(email=email)
        user = query.first()
        return user

    @classmethod
    def update(cls, session, current_user, updated: dict):
        try:
            for key, value in updated.items():
                if key not in ["nickname", "name", "bio", "password", "show_mail"]:
                    raise KeyError(f"Unknown field to update user: {key}")
                if key == "nickname":
                    user = UserDB.fetch_user(session, nickname=value)
                    if user and user.user_id != current_user.user_id:
                        raise ValueError(
                            f"User with the given nickname already exists: {value}")
                if key == "password":
                    from authentication import AuthenticationManager
                    auth_manager = AuthenticationManager()
                    value = auth_manager.get_password_hash(value)
                key = "hashed_password" if key == "password" else key
                setattr(current_user, key, value)
                session.add(current_user)
                session.commit()
        except Exception as e:
            session.rollback()
            raise e

    @classmethod
    def fetch_all_users(cls, session):
        users = session.query(cls).all()
        return users

    def did_block(self, user: 'UserDB'):
        return user in self.blocked_users

    def fetch_posts(self):
        return self.posts

    async def upload_profile_photo(self, session, file: UploadFile):
        file_manager = FileManager(FILEPATH)
        try:
            file_path = await file_manager.save(file, profile_photo=True)
            self.profile_image = file_path
            session.add(self)
            session.commit()
            return {"status": "ok", "detail": "Successfully uploaded profile photo", "path": file_path}
        except ValueError as e:
            raise e
        except Exception as e:
            raise e

    def block(self, session, user):
        try:
            if self.did_block(user):
                return
            if self.user_id == user.user_id:
                raise ValueError("Cannot block yourself")
            block = BlockedUserDB(blocker_id=self.user_id,
                                  blocked_id=user.user_id)
            session.add(block)
            session.commit()
        except Exception as e:
            session.rollback()
            raise e

    def unblock(self, session, user: 'UserDB'):
        try:
            if not self.did_block(user):
                print(self.blocked_users)
                print(user)
                return
            block: BlockedUserDB = session.query(BlockedUserDB).filter(
                BlockedUserDB.blocker_id == self.user_id, BlockedUserDB.blocked_id == user.user_id
            ).first()
            session.delete(block)
            session.commit()
        except Exception as e:
            session.rollback()
            raise e

    def like(self, session, post: 'PostDB'):
        if self.user_id in [like.user_id for like in post.likes]:
            return
        print(post.likes)
        try:
            like = LikeDB(user_id=self.user_id, post_id=post.post_id)
            session.add(like)
            session.commit()
            post.no_likes = post.no_likes + 1
            session.add(post)
            session.commit()
        except Exception as e:
            session.rollback()
            raise e

    def unlike(self, session, post: 'PostDB'):
        try:
            like: LikeDB = session.query(LikeDB).filter(
                LikeDB.user_id == self.user_id, LikeDB.post_id == post.post_id
            ).first()
            if not like:
                return
            session.delete(like)
            session.commit()
            post.no_likes = post.no_likes - 1
            session.add(post)
            session.commit()
        except Exception as e:
            session.rollback()
            raise e

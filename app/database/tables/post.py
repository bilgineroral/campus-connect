from typing import Union
from datetime import datetime
from click import File
from fastapi import Form, UploadFile
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Float, func, Boolean
from sqlalchemy.orm import relationship
from enum import Enum
from FileManager import FileManager
from database.DatabaseManager import DatabaseManager, Base
import os

# Enum types for the 4 kinds of posts

FILEPATH = "static/post_images/"


class PostType(Enum):
    SECONDHANDSALES = "Secondhand Sales"
    DONATION = "Donation"
    LOSTFOUND = "LostFound"
    BORROWING = "Borrowing"


class PostDB(Base):
    __tablename__ = 'posts'

    post_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.user_id'))
    content = Column(String(380), nullable=False)
    timestamp = Column(DateTime(timezone=True),
                       server_default=func.now(), nullable=False)
    post_type = Column(String(32), nullable=False)
    post_image = Column(String, nullable=True)
    resolved = Column(Boolean, nullable=False, default=False)
    no_likes = Column(Integer, nullable=False, default=0)
    no_comments = Column(Integer, nullable=False, default=0)

    __mapper_args__ = {'polymorphic_on': post_type}
    author = relationship('UserDB', back_populates='posts', lazy='subquery')
    comments = relationship(
        'CommentDB', back_populates='post', lazy='subquery')
    likes = relationship('LikeDB', back_populates='post', lazy='subquery')

    @classmethod
    async def create_post(cls, session,
                          user_id: int,
                          type: str,
                          content: str = Form(...),
                          lf_date: str = Form(None),
                          lost_item: bool = Form(True),
                          donation_aim: int = Form(None),
                          min_donation: int = Form(None),
                          # input is in this format: 2023-11-16T12:30:45.678Z
                          auction_deadline: str = Form(None),
                          price: int = Form(None),
                          bids_enabled: bool = Form(None),
                          borrow_date: str = Form(None),
                          file: UploadFile = File(None)):

        if type not in [PostType.LOSTFOUND.value, PostType.SECONDHANDSALES.value,
                        PostType.DONATION.value, PostType.BORROWING.value]:
            raise ValueError(
                f"""Post type the must be one of {PostType.LOSTFOUND.value}, {PostType.SECONDHANDSALES.value}, {PostType.DONATION.value}, or {PostType.BORROWING.value}; received: """ + type
            )

        # type checks
        if type == PostType.LOSTFOUND.value:
            if lf_date is None:
                raise ValueError(
                    "The required field 'lf_date' is not provided")

        elif type == PostType.DONATION.value:
            if (min_donation and donation_aim) and (donation_aim <= min_donation):
                raise ValueError(
                    "The donation aim must be greater than the minimum donation")

        elif type == PostType.SECONDHANDSALES.value:
            if price is None:
                raise ValueError("The required field 'price' is not provided")
            if bids_enabled is None:
                raise ValueError(
                    "The required field 'bids_enabled' is not provided")
            if bids_enabled == False:
                auction_deadline = None

        if file:
            file_manager = FileManager(FILEPATH)
            try:
                image_path = await file_manager.save(file)
            except Exception as e:
                raise e
        else:
            image_path = None

        if type == PostType.LOSTFOUND.value:
            new_post = LostFoundPostDB(user_id=user_id, content=content,
                                       post_type=PostType.LOSTFOUND.value,
                                       lf_date=lf_date, lost_item=lost_item,
                                       post_image=image_path)
        elif type == PostType.DONATION.value:
            new_post = DonationPostDB(user_id=user_id, content=content,
                                      post_type=PostType.DONATION.value,
                                      donation_aim=donation_aim,
                                      min_donation=min_donation,
                                      post_image=image_path)
        elif type == PostType.SECONDHANDSALES.value:
            if auction_deadline is not None:
                date_object = datetime.strptime(auction_deadline, "%d/%m/%Y")
                formatted_date = date_object.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
            else:
                formatted_date = None
            new_post = SecondHandSalesPostDB(user_id=user_id, content=content,
                                             post_type=PostType.SECONDHANDSALES.value,
                                             price=price,
                                             auction_deadline=formatted_date,
                                             bids_enabled=bids_enabled,
                                             post_image=image_path)

        elif type == PostType.BORROWING.value:
            try:
                date_object = datetime.strptime(borrow_date, "%d/%m/%Y")
                formatted_date = date_object.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
            except:
                formatted_date = None
            new_post = BorrowingPostDB(user_id=user_id, content=content,
                                       post_type=PostType.BORROWING.value,
                                       borrow_date=borrow_date,
                                       post_image=image_path)

        session.add(new_post)
        session.commit()

    @classmethod
    def fetch_post(cls, session, post_id: int): 
        post = session.query(cls).filter(PostDB.post_id == post_id).first()
        return post

    @classmethod
    async def update_post(cls, session, post: 'PostDB', updated: dict, image, delete: bool = False):
        file_manager = FileManager(FILEPATH)
        if not post:
            raise ValueError("Post not found")
        if delete and post.post_image:
            _ = file_manager.delete(post.post_image)
            updated["post_image"] = None
        elif not delete and image:            
            if post.post_image: # if there is an existing image, delete it
                _ = file_manager.delete(post.post_image)
            try:
                image_path = await file_manager.save(image)
                updated["post_image"] = image_path
            except Exception as e:
                raise e
        for key, value in updated.items():
            if key not in ["content", "resolved", "donation_aim", "min_donation", "lf_date",
                            "price", "auction_deadline", "borrow_date", "post_image"]:
                raise KeyError(
                    f"Unknown field to update post: {key}")
            setattr(post, key, value)
        session.add(post)
        session.commit()

    @classmethod
    def delete(cls, post_id: int):
        db_manager = DatabaseManager()
        try:
            with db_manager.get_session() as session:
                post: PostDB = session.query(cls).filter(
                    PostDB.post_id == post_id).first()
                if not post:
                    raise ValueError("Post not found")
                comments = post.comments
                likes = post.likes
                for comment in comments:
                    session.delete(comment)
                for like in likes:
                    session.delete(like)
                img_path = post.post_image
                try:
                    os.remove(img_path)
                except:
                    pass
                session.delete(post)
                session.commit()
        except Exception as e:
            session.rollback()
            raise e

    @classmethod
    def fetch_posts_filtered(cls, session, filters: list, owner_id: Union[int, None] = None, resolved: bool = True):
        query = session.query(PostDB)

        if owner_id:
            query = query.filter(PostDB.user_id == owner_id)
        else:
            if not resolved:
                query = query.filter(PostDB.resolved == False)
            query = query.filter(PostDB.post_type.in_(filters))
        posts = query.all()
        return posts
        

    def get_comments(self):
        return self.comments


    def to_dict(self):
        return {
            "post_id": self.post_id,
            "post_type": self.post_type,
            "content": self.content,
            "resolved": self.resolved,
            "timestamp": self.timestamp,
            "post_image": self.post_image,
            "no_likes": self.no_likes,
            "no_comments": self.no_comments,
            "comments": [comment.to_dict() for comment in sorted(self.comments, key=lambda comment: comment.comment_id, reverse=True)],
            "likes": [like.to_dict() for like in self.likes],
            "author": {
                "user_id": self.author.user_id,
                "nickname": self.author.nickname,
                "name": self.author.name,
                "profile_image": self.author.profile_image
            }
        }


class LostFoundPostDB(PostDB):
    __tablename__ = 'lostfound_posts'
    __mapper_args__ = {'polymorphic_identity': PostType.LOSTFOUND.value}
    id = Column(None, ForeignKey('posts.post_id'), primary_key=True)
    lf_date = Column(DateTime(timezone=True), nullable=False)
    lost_item = Column(Boolean, nullable=False, default=True)

    def to_dict(self):
        base = super().to_dict()
        base.update({
            "lf_date": self.lf_date,
            "lost_item": self.lost_item
        })
        return base


class DonationPostDB(PostDB):
    __tablename__ = 'donation_posts'
    __mapper_args__ = {'polymorphic_identity': PostType.DONATION.value}
    id = Column(None, ForeignKey('posts.post_id'), primary_key=True)
    donation_aim = Column(Float, nullable=True)
    min_donation = Column(Float, nullable=True)

    def to_dict(self):
        base = super().to_dict()
        base.update({
            "donation_aim": self.donation_aim,
            "min_donation": self.min_donation
        })
        return base

class SecondHandSalesPostDB(PostDB):
    __tablename__ = 'secondhandsales_posts'
    __mapper_args__ = {'polymorphic_identity': PostType.SECONDHANDSALES.value}
    id = Column(None, ForeignKey('posts.post_id'), primary_key=True)
    price = Column(Float, nullable=True)
    auction_deadline = Column(DateTime(timezone=True), nullable=True)
    bids_enabled = Column(Boolean, default=False)

    bids = relationship('BidDB', back_populates='post', lazy='subquery')

    def delete(self):
        bids = self.bids
        db_manager = DatabaseManager()
        with db_manager.get_session() as session:
            for bid in bids:
                session.delete(bid)
            super().delete()

    def to_dict(self):
        base = super().to_dict()
        base.update({
            "price": self.price,
            "auction_deadline": self.auction_deadline,
            "bids_enabled": self.bids_enabled,
            "bids": [bid.to_dict() for bid in self.bids]
        })
        return base


class BorrowingPostDB(PostDB):
    __tablename__ = 'borrowing_posts'
    __mapper_args__ = {'polymorphic_identity': PostType.BORROWING.value}
    id = Column(None, ForeignKey('posts.post_id'), primary_key=True)
    borrow_date = Column(DateTime(timezone=True), nullable=True)

    def to_dict(self):
        base = super().to_dict()
        base.update({
            "borrow_date": self.borrow_date
        })
        return base

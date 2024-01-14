from typing import Union
from sqlalchemy import Column, ForeignKey, Integer, Float, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
import pytz
from database.DatabaseManager import DatabaseManager, Base
from database.tables.post import SecondHandSalesPostDB

class BidDB(Base):
    __tablename__ = 'bids'
    bid_id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey('secondhandsales_posts.id'))
    user_id = Column(Integer, ForeignKey('users.user_id'))
    bid_amount = Column(Float, unique=True, nullable=False)
    
    __table_args__ = (UniqueConstraint('post_id', 'user_id', name='uix_post_user'),)

    user = relationship('UserDB', back_populates='bids', lazy='subquery')
    post = relationship('SecondHandSalesPostDB', back_populates='bids', lazy='subquery')

    @classmethod
    def fetch_bid(cls, session, bid_id: Union[int, None] = None, post_id: Union[int, None] = None, user_id: Union[int, None] = None):
        if not (bid_id or (post_id and user_id)):
            raise AssertionError("Either bid_id or (post_id and user_id) must be provided") # for debugging
        if bid_id:
            bid = session.query(cls).filter(cls.bid_id == bid_id).first()
        else:
            bid = session.query(cls).filter(cls.post_id == post_id, cls.user_id == user_id).first()
        return bid

    @classmethod
    def create_bid(cls, session, post_id: int, user_id: int, bid_amount: float):
        bid = cls.fetch_bid(session, post_id=post_id, user_id=user_id)    
        if bid:
            return cls.update_bid(session, post_id=post_id, user_id=user_id, bid_amount=bid_amount)
        shs_post: SecondHandSalesPostDB = SecondHandSalesPostDB.fetch_post(session, post_id=post_id)
        if not shs_post:
            raise ValueError(f"Post id= {post_id} does not exist")
        if shs_post.user_id == user_id:
            raise ValueError(f"User id= {user_id} cannot bid on their own post")
        if not shs_post.bids_enabled:
            raise ValueError(f"Bids are not enabled for post id= {post_id}")
        if bid_amount < shs_post.price:
            raise ValueError(f"Bid amount {bid_amount} is less than the price {shs_post.price}")
        if shs_post.auction_deadline < datetime.now(pytz.utc):
            raise ValueError(f"Bidding time for post id= {post_id} has expired")
    
        bids = sorted(shs_post.bids, key=lambda bid: bid.bid_amount, reverse=True)
        highest_bid: BidDB = bids[0] if len(bids) > 0 else None
        if highest_bid and not highest_bid.user_id == user_id and bid_amount <= highest_bid.bid_amount:
            raise ValueError(f'The highest bid so far is {highest_bid.bid_amount}. The bid amount must be greater than this value.')
        try:
            new_bid = cls(post_id=post_id, user_id=user_id, bid_amount=bid_amount)                
            session.add(new_bid)
            session.commit()
        except Exception as e:
            session.rollback()
            raise e
        

    @classmethod
    def delete_bid(cls, session, post_id: int, user_id: int):
        bid: BidDB = cls.fetch_bid(session, post_id=post_id, user_id=user_id)
        if not bid:
            raise ValueError(f"Bid does not exist for post id= {post_id} and user id= {user_id}")
        try:
            session.delete(bid)
            session.commit()
        except Exception as e:
            session.rollback()
            raise e

    @classmethod
    def update_bid(cls, session, post_id: int, user_id: int, bid_amount: float):
        bid: BidDB = cls.fetch_bid(session, post_id=post_id, user_id=user_id)
        if not bid:
            raise ValueError(f"Bid does not exist for post id= {post_id} and user id= {user_id}")
        shs_post: SecondHandSalesPostDB = SecondHandSalesPostDB.fetch_post(session, post_id=post_id)
        if not shs_post:
            raise ValueError(f"Second hand sales post id= {post_id} does not exist")

        if not shs_post.bids_enabled:
            raise ValueError(f"Bids are not enabled for post id= {post_id}")
        if bid_amount < shs_post.price:
            raise ValueError(f"Bid amount {bid_amount} is less than the price {shs_post.price}")
        if shs_post.auction_deadline < datetime.now(pytz.utc):
            raise ValueError(f"Bidding time for post id= {post_id} has expired")
        
        bids = sorted(shs_post.bids, key=lambda bid: bid.bid_amount, reverse=True)
        highest_bid: BidDB = bids[0] if len(bids) > 0 else None

        if highest_bid and not highest_bid.user_id == user_id and bid_amount <= highest_bid.bid_amount:
            raise ValueError(f'The highest bid so far is {highest_bid.bid_amount}. The bid amount must be greater than this value.')
        if highest_bid and highest_bid.user_id == user_id:
            second_highest_bid: BidDB = bids[1] if len(bids) > 1 else None

            if second_highest_bid and bid_amount <= second_highest_bid.bid_amount:
                raise ValueError(f'The second highest bid so far is {second_highest_bid.bid_amount}. The bid amount must be greater than this value.')

        bid.bid_amount = bid_amount
        try:
            session.add(bid)
            session.commit()
        except Exception as e:
            session.rollback()
            raise e

    
    def to_dict(self):
        user_dict = {
            'user_id': self.user_id,
            'nickname': self.user.nickname,
            'name': self.user.name,
            'profile_image': self.user.profile_image
        }
        return {
            'bid_id': self.bid_id,
            'post_id': self.post_id,
            'bid_amount': self.bid_amount,
            'user': user_dict
        }

    def get_user(self):
        return self.user
    
    def get_post(self):
        return self.post
    
from typing import List, Union
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import Depends, File, Form, HTTPException, status, UploadFile, WebSocket, WebSocketDisconnect
import os
import dotenv
from pathlib import Path
from datetime import timedelta

from authentication import AuthenticationManager
from database.tables.user import UserDB
from database.tables.post import PostDB, SecondHandSalesPostDB, PostType
from database.tables.comment import CommentDB
from database.tables.notification import NotificationDB
from database.tables.bid import BidDB
from request_bodies import *

from chat.ChatManager import ChatManager
from chat.WSManager import WSManager

from EmailManager import EmailManager
# Endpoint functions for the API

BASE_DIR = Path(__file__).resolve().parent.parent
dotenv.load_dotenv(BASE_DIR / ".env")

ACCESS_TOKEN_EXPIRE_MINUTES = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")


async def resend_verification_mail(session, email):
    user = UserDB.fetch_user(session, email=email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if user.verified:
        return {"status": "ok", "detail": "User is already verified"}
    
    auth_manager = AuthenticationManager()
    verification_key = auth_manager.create_access_token(
        data={"sub": email}, expires_delta=timedelta(minutes=60))
    
    html = f"""
        <h3>Email verification</h3> 
        <p>Please verify your email by clicking the following link:</p>
        <a href="http://localhost:5173/verify?key={verification_key}">Verify Email</a>
        <br>
        <br>
        <p>Best Regards</p>
        <p>CampusConnect Team<p>
        """
    
    email_manager = EmailManager()
    await email_manager.send_email(subject="Email verification",
                                   recipient=email,
                                   mail_body=html)


async def verify_email(session, key: str):
    auth_manager = AuthenticationManager()
    print("here")
    user = await auth_manager.get_current_user(session, key)
    if not user:
        print("here2")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email verification key is not genuine",
            headers={"WWW-Authenticate": "Bearer"},
        )
    print("here3")
    user.verified = True
    session.add(user)
    session.commit()

    content = """<html>
        <body>
            <h1>Verification Successful</h1>
            <p>Your email has been successfully verified. You may close this page now.</p>
        </body>
    </html>
    """

    return HTMLResponse(content=content)


async def confirm_recovery(session, key: str):
    auth_manager = AuthenticationManager()
    user = await auth_manager.get_current_user(session, key)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password recovery key is not genuine",
            headers={"WWW-Authenticate": "Bearer"},
        )
    else:
        return {"status": "ok", "detail": "Password recovery key is genuine"}


async def send_recovery_mail(session, email):
    email_manager = EmailManager()
    try:
        user = UserDB.fetch_user(session, email=email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        auth_manager = AuthenticationManager()
        verification_key = auth_manager.create_access_token(
            data={"sub": user.email}, expires_delta=timedelta(minutes=30))
        html = f"""<h3>Recover Password</h3> 
            <p>You can recover your password by clicking the following URL:</p>
            <a href="http://localhost:5173/recover?key={verification_key}">Recover Password</a>
            <br>
            <br>
            <p>Best Regards</p>
            <p>CampusConnect Team<p>
            """
        await email_manager.send_email(subject="CampusConnect Password Recovery",
                                       recipient=user.email,
                                       mail_body=html)
        return {"status": "ok", "detail": "Successfully resent verification email"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Sending recovery mail failed due to an internal server error. Please try again later.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def login_for_access_token(session, form_data: OAuth2PasswordRequestForm = Depends()):
    auth_manager = AuthenticationManager()
    user: UserDB = auth_manager.authenticate_user(
        session, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect nickname or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please verify your email address",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=int(ACCESS_TOKEN_EXPIRE_MINUTES))

    # the access token will be unique for each login, since internally it uses the timestamps when the token was created
    access_token = auth_manager.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


async def create_user(session, req: CreateUserRequest):
    auth_manager = AuthenticationManager()
    try:
        UserDB.create_user(
            session,
            nickname=req.nickname,
            email=req.email,
            bilkent_id=req.bilkent_id,
            name=req.name,
            hashed_password=auth_manager.get_password_hash(req.password)
        )
        verification_key = auth_manager.create_access_token(
            data={"sub": req.email}, expires_delta=timedelta(minutes=60))
        html = f"""
            <h3>Thank you for registering!</h3> 
            <p>Please verify your email by clicking the following link:</p>
            <a href="http://localhost:8000/verify?key={verification_key}">Verify Email</a>
            <br>
            <br>
            <p>Best Regards</p>
            <p>CampusConnect Team<p>
            """

        email_manager = EmailManager()
        await email_manager.send_email(subject="Thank you for registering to CampusConnect!",
                                       recipient=req.email,
                                       mail_body=html)

        return {"status": "ok", "detail": "Successfully created user"}
    except ValueError as e:
        raise e

def get_current_user_data(current_user: UserDB):
    user_dict = current_user.__dict__  # dictionarize the UserDB object
    user_dict.pop("hashed_password")
    return user_dict

def get_user_data(session,
                  current_user: UserDB,
                  nickname: Union[str, None] = None,
                  id: Union[int, None] = None,
                  email: Union[str, None] = None):
    if not nickname and not id and not email:
        raise RuntimeError(
            "At least one of nickname, id, or email must be provided for fetching user data")
    user = UserDB.fetch_user(
        session, user_id=id, nickname=nickname, email=email)

    if not user:
        raise RuntimeError("User not found")
    resp = user.to_dict()  # dictionarize the UserDB object

    blocked = current_user.did_block(user)
    blocked_by = user.did_block(current_user)
    if blocked_by or blocked:
        resp.pop("email")
        resp.pop("bilkent_id")
        resp.pop("bio")
        resp.pop("show_mail")
        resp.pop("profile_image")
        if blocked_by:
            resp["blocked_by"] = True
        elif blocked:
            resp["blocked"] = True
    else:
        if resp["user_id"] != current_user.user_id and not resp["show_mail"]:
            resp.pop("email")

    return resp


def update_profile(session, updated: dict, current_user: UserDB):
    UserDB.update(session, current_user, updated)
    return {"status": "ok", "detail": "Successfully updated user"}


async def upload_profile_photo(session, current_user: UserDB, file: UploadFile = File(...)):
    try:
        result = await current_user.upload_profile_photo(session, file)
        return result
    except ValueError as e:
        raise e


async def create_new_post(session,
                          current_user: UserDB,
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

    await PostDB.create_post(session, current_user.user_id, type, content, lf_date, lost_item, donation_aim,
                             min_donation, auction_deadline, price, bids_enabled,
                             borrow_date, file)
    return {"status": "ok", "detail": "Successfully created post"}


def delete_post(session, post_id: int, current_user: UserDB):
    post: PostDB = PostDB.fetch_post(session, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if post.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this post",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        PostDB.delete(post_id)
        return {"status": "ok", "detail": "Successfully deleted post"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Deleting a post failed due to an internal server error. Please try again later.",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def update_post(session,
                      post_id: int,
                      user_id: int,
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
                      resolved: bool = Form(None),
                      delete_image: bool = Form(False),
                      file: UploadFile = File(None)
                      ):
    post: PostDB = PostDB.fetch_post(session, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if post.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to update this post",
            headers={"WWW-Authenticate": "Bearer"},
        )
    updated = {
        "content": content,
        "resolved": resolved
    }
    if post.post_type == PostType.LOSTFOUND.value:
        if lf_date:
            updated["lf_date"] = lf_date
    elif post.post_type == PostType.DONATION.value:
        if donation_aim:
            updated["donation_aim"] = donation_aim
        if min_donation:
            updated["min_donation"] = min_donation
    elif post.post_type == PostType.SECONDHANDSALES.value:
        if auction_deadline:
            updated["auction_deadline"] = auction_deadline
        if price:
            updated["price"] = price
    elif post.post_type == PostType.BORROWING.value:
        if borrow_date:
            updated["borrow_date"] = borrow_date

    try:
        await PostDB.update_post(session, post, updated, file, delete=delete_image)
        return {"status": "ok", "detail": "Successfully updated post"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except KeyError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Updating post data failed due to an internal server error. Please try again later.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def create_comment(session, post_id: int, content: str, current_user: UserDB):
    post: PostDB = PostDB.fetch_post(session, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        post_user_id = post.user_id
        CommentDB.create_comment(session, content, post, current_user.user_id)
        if post_user_id != current_user.user_id:
            NotificationDB.create_notification(session,
                                               content=f"{current_user.nickname} commented on your post: " + content,
                                               content_id="p"+str(post_id),
                                               to_user_id=post_user_id)
        return {"status": "ok", "detail": "Successfully created comment"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            # detail="Creating a comment failed due to an internal server error. Please try again later.",
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_comments_on_post(session, post_id, current_user: UserDB):
    post: PostDB = PostDB.fetch_post(session, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    comments: List[CommentDB] = post.comments
    try:
        res = []
        for comment in comments:
            comment_author: UserDB = comment.author
            if not (comment_author.did_block(current_user) or current_user.did_block(comment_author)):
                dicted = comment.to_dict()
                dicted['is_owner'] = comment_author.user_id == current_user.user_id
                res.append(dicted)
        return sorted(res, key=lambda comment: comment["comment_id"], reverse=True)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Fetching comments failed due to an internal server error. Please try again later.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def update_comment(session, comment_id: int, content: str, current_user: UserDB):
    comment: CommentDB = CommentDB.fetch_comment(session, comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if comment.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to update this comment",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        CommentDB.update_comment(session, comment, content)
        return {"status": "ok", "detail": "Successfully updated comment"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Updating comment failed due to an internal server error. Please try again later.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def delete_comment(session, comment_id: int, current_user: UserDB):
    comment: CommentDB = CommentDB.fetch_comment(session, comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if comment.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this comment",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        CommentDB.delete_comment(session, comment_id)
        return {"status": "ok", "detail": "Successfully deleted comment"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Deleting comment failed due to an internal server error. Please try again later.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def make_bid(session, post_id: int, bid_amount: float, user: UserDB):
    try:
        BidDB.create_bid(session, post_id, user.user_id, bid_amount)
        return {"status": "ok", "detail": "Successfully made a bid"}
    except AssertionError as e:
        print("Assertion error")
        raise e
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Making a bid failed due to an internal server error. Please try again later.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def update_bid(session, post_id, bid_amount, current_user: UserDB):
    try:
        BidDB.update_bid(session, post_id, current_user.user_id, bid_amount)
        return {"status": "ok", "detail": "Successfully updated bid"}
    except AssertionError as e:
        print("Assertion error")
        raise e
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Updating a bid failed due to an internal server error. Please try again later.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_bids_on_post(session, post_id: int, current_user_id: int):
    try:
        post: SecondHandSalesPostDB = SecondHandSalesPostDB.fetch_post(
            session, post_id)
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        bids = sorted(post.bids, key=lambda bid: bid.bid_amount, reverse=True)
        res = []
        for bid in bids:
            dicted = bid.to_dict()
            dicted["owned"] = bid.user_id == current_user_id
            res.append(dicted)
        return res
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Fetching bids failed due to an internal server error. Please try again later.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def delete_bid(session, post_id: int, current_user: UserDB):
    try:
        BidDB.delete_bid(session, post_id, current_user.user_id)
        return {"status": "ok", "detail": "Successfully deleted bid"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        """raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Deleting a bid failed due to an internal server error. Please try again later.",
            headers={"WWW-Authenticate": "Bearer"},
        )"""
        raise


def block_user(session, user_id: int, current_user: UserDB):
    try:
        blocked_user: UserDB = UserDB.fetch_user(session, user_id=user_id)
        if not blocked_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        current_user.block(session, blocked_user)
        return {"status": "ok", "detail": "Successfully blocked user"}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Blocking user failed due to an internal server error. Please try again later.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def unblock_user(session, user_id: int, current_user: UserDB):
    try:
        blocked_user: UserDB = UserDB.fetch_user(session, user_id=user_id)
        current_user.unblock(session, blocked_user)
        return {"status": "ok", "detail": "Successfully unblocked user"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unblocking user failed due to an internal server error. Please try again later.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def search_blocked_user(search_key: str, current_user: UserDB):
    try:
        res = []
        for user in current_user.blocked_users:
            if search_key.lower() in user.nickname.lower():
                res.append(user.to_dict())
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Searching blocked users failed due to an internal server error. Please try again later.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_all_blocked_user_ids(current_user: UserDB):
    try:
        res = []
        for user in current_user.blocked_users:
            res.append(user.user_id)
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Fetching blocked users failed due to an internal server error. Please try again later.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def like_post(session, post_id: int, current_user: UserDB):
    try:
        post: PostDB = PostDB.fetch_post(session, post_id)
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        post_user_id = post.user_id
        post_content = post.content
        current_user.like(session, post)
        if post_user_id != current_user.user_id:
            NotificationDB.create_notification(session,
                                               content=f'{current_user.nickname} liked your post: "{post_content}"',
                                               content_id="p"+str(post_id),
                                               to_user_id=post_user_id)
        return {"status": "ok", "detail": "Successfully liked post"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Liking post failed due to an internal server error. Please try again later.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def unlike_post(session, post_id: int, current_user: UserDB):
    try:
        post: PostDB = PostDB.fetch_post(session, post_id)
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        current_user.unlike(session, post)
        return {"status": "ok", "detail": "Successfully unliked post"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unliking post failed due to an internal server error. Please try again later.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_all_likes_on_post(post_id: int, current_user: UserDB):
    post: PostDB = PostDB.fetch_post(post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return post.likes


def search_users_by_nickname(session, current_user: UserDB, key: Union[str, None] = None):
    response = []
    users = UserDB.fetch_all_users(session)
    if not key:
        for user in users:
            res = {
                "user_id": user.user_id,
                "name": user.name,
                "nickname": user.nickname,
                "profile_image": None if user.did_block(current_user) or current_user.did_block(user) else user.profile_image,
            }
            response.append(res)
        return response

    for user in users:
        if key.lower() in user.nickname.lower():
            res = {
                "user_id": user.user_id,
                "name": user.name,
                "nickname": user.nickname,
                "profile_image": None if user.did_block(current_user) or current_user.did_block(user) else user.profile_image,
            }
            response.append(res)
    return response


def get_blocked_users(current_user):
    users = current_user.blocked_users
    res = []
    for user in users:
        res.append(user.to_dict())
    return res


def get_notifications(current_user: UserDB):
    try:
        return current_user.notifications
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Fetching notifications failed due to an internal server error. Please try again later.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def remove_notification(session, notification_id: int, current_user: UserDB):
    try:
        NotificationDB.delete(session, notification_id)
        return {"status": "ok", "detail": "Successfully removed notification"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Removing notification failed due to an internal server error. Please try again later.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def remove_all_notifications(session, current_user: UserDB):
    try:
        for notification in current_user.notifications:
            NotificationDB.delete(session, notification.notification_id)
        return {"status": "ok", "detail": "Successfully removed all notifications"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Removing notifications failed due to an internal server error. Please try again later.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_chat_session(chat_id):
    chat_manager = ChatManager()
    return chat_manager.get_chat_session(chat_id=chat_id)


def get_all_chat_sessions():
    chat_manager = ChatManager()
    return chat_manager.get_all_chat_sessions()


async def connect(websocket: WebSocket, current_user: UserDB):
    uid = current_user.user_id
    ws_manager = WSManager()
    ws: WebSocket = await ws_manager.connect(uid, websocket)
    try:
        while True:
            data = await ws.receive_json()
            await ws_manager.handle_message(data)

    except WebSocketDisconnect:
        print(f"WebSocket connection closed for user: {current_user.user_id}")
        del ws_manager.connections[current_user.user_id]
    except Exception as e:
        print("WebSockets Error: " + str(e))


def get_ws_connections():
    ws_manager = WSManager()
    return (uid for uid in ws_manager.connections.keys())


def get_posts_filtered(session, filters: dict, current_user: UserDB, owner_id: Union[int, None] = None, resolved: bool = True):
    for filter in filters.keys():
        if filter not in [PostType.LOSTFOUND.value, PostType.SECONDHANDSALES.value,
                          PostType.DONATION.value, PostType.BORROWING.value]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Filter {filter} is not valid",
                headers={"WWW-Authenticate": "Bearer"},
            )
    filters_list = []
    for filter, value in filters.items():
        if value:
            filters_list.append(filter)

    posts = PostDB.fetch_posts_filtered(
        session, filters_list, owner_id, resolved=resolved)
    posts_dict = []
    for post in sorted(posts, key=lambda post: post.post_id, reverse=True):
        if (post.author.did_block(current_user) or current_user.did_block(post.author)):
            continue
        for comment in list(post.comments):
            if (comment.author.did_block(current_user) or current_user.did_block(comment.author)):
                post.comments.remove(comment)
        posts_dict.append(post.to_dict())
    return posts_dict

from typing import List
from fastapi import Body, Depends, FastAPI, Form, File, UploadFile, WebSocket, status, Cookie
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from database.DatabaseManager import DatabaseManager
from database.tables.post import PostType

from authentication import *
from request_bodies import *
from response_bodies import *
import system as sys

FILEPATH = "static/profile_images/"
app = FastAPI()

app.mount("/static", StaticFiles(directory="./static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# create all tables
db_manager = DatabaseManager()
db_manager.create_tables()

auth_manager = AuthenticationManager()

@app.get("/is-verified")
async def is_verified(nickname: str):
    db_manager = DatabaseManager()
    try:
        user = UserDB.fetch_user(db_manager.get_session(), nickname=nickname)
        return user.verified
    finally:
        db_manager.close_session()


@app.post("/register", status_code=status.HTTP_201_CREATED, tags=["Auth"])
async def create_user(req: CreateUserRequest):
    try:
        db_manager = DatabaseManager()
        resp = await sys.create_user(db_manager.get_session(), req)
        return resp
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Creating a user failed due to an internal server error. Please try again later.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    finally:
        db_manager.close_session()


@app.post("/login", tags=["Auth"])
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        db_manager = DatabaseManager()
        return sys.login_for_access_token(db_manager.get_session(), form_data)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error occurred while logging in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    finally:
        db_manager.close_session()


@app.get("/confirm-recovery", tags=["Auth"])
async def confirm_recovery(key: str):
    db_manager = DatabaseManager()
    try:
        resp = await sys.confirm_recovery(db_manager.get_session(), key)
        return resp
    finally:
        db_manager.close_session()


@app.post("/send-recovery", tags=["Auth"])
async def send_recovery_mail(req: EmailRequest):
    try:
        db_manager = DatabaseManager()
        await sys.send_recovery_mail(db_manager.get_session(), req.email)
        return
    except HTTPException as e:
        raise e
    except Exception as e:
        """raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error occurred while resetting password.",
            headers={"WWW-Authenticate": "Bearer"},
        )"""
        raise e
    finally:
        db_manager.close_session()


@app.post("/recover", tags=["Auth"])
async def recover_password(key: str):
    payload = jwt.decode(key, SECRET_KEY, algorithms=[ALGORITHM])
    email = payload.get("sub")
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"status": "ok", "detail": "Successfully recovered password"}


@app.get("/verify", tags=["Auth"])
async def verify_email(key: str):
    db_manager = DatabaseManager()
    try:
        resp = await sys.verify_email(db_manager.get_session(), key)
        return resp
    finally:
        db_manager.close_session()


@app.post("/resend-verification", tags=["Auth"])
async def resend_verification_mail(email: str):
    db_manager = DatabaseManager()
    try:
        resp = await sys.resend_verification_mail(db_manager.get_session(), email)
        return resp
    finally:
        db_manager.close_session()


@app.get("/users/me", tags=["Users"])
async def get_current_user_data(token: str = Depends(auth_manager.oauth2_scheme)):
    db_manager = DatabaseManager()
    try:
        current_user = await auth_manager.get_current_user(db_manager.get_session(), token)
        return sys.get_current_user_data(current_user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error occurred while fetching user data.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    finally:
        db_manager.close_session()


@app.get("/users", tags=["Users"])
async def get_user_data(nickname: str = None, id: int = None,
                        email: str = None, token: str = Depends(auth_manager.oauth2_scheme)):
    if not nickname and not id and not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST)
    db_manager = DatabaseManager()
    try:
        current_user = await auth_manager.get_current_user(db_manager.get_session(), token)
        data = sys.get_user_data(
            db_manager.get_session(), current_user, nickname, id, email)
        return data
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error occurred while fetching user data.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    finally:
        db_manager.close_session()


@app.put("/users/me/edit-profile", tags=["Users"])
async def update_profile(updated: dict, token: str = Depends(auth_manager.oauth2_scheme)):
    try:
        db_manager = DatabaseManager()
        current_user = await auth_manager.get_current_user(db_manager.get_session(), token)
        return sys.update_profile(db_manager.get_session(), updated, current_user)
    except KeyError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"}
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error occurred while updating user profile.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    finally:
        db_manager.close_session()


@app.post("/users/me/upload-profile-photo", tags=["Users"])
async def upload_profile_photo(file: UploadFile = File(...), token: str = Depends(auth_manager.oauth2_scheme)):
    try:
        db_manager = DatabaseManager()
        current_user = await auth_manager.get_current_user(db_manager.get_session(), token)
        result = await sys.upload_profile_photo(db_manager.get_session(), current_user, file)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error occurred while uploading profile photo.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    finally:
        db_manager.close_session()


@app.get("/users/search", tags=["Users"])
async def search_users_by_nickname(key: Union[str, None] = None,
                                   token: str = Depends(auth_manager.oauth2_scheme)):
    try:
        db_manager = DatabaseManager()

        current_user = await auth_manager.get_current_user(db_manager.get_session(), token)
        return sys.search_users_by_nickname(db_manager.get_session(), current_user, key)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error occurred while searching users.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    finally:
        db_manager.close_session()


# Fetch all posts from the DB.
@app.post("/home", tags=["Posts"])
async def get_all_posts_filtered(req: PostsRequest, token: str = Depends(auth_manager.oauth2_scheme)):
    try:
        db_manager = DatabaseManager()
        current_user = await auth_manager.get_current_user(db_manager.get_session(), token)
        posts = sys.get_posts_filtered(
            db_manager.get_session(), req.filters, current_user, resolved=req.resolved)
        return posts
    except HTTPException as e:
        raise e
    except Exception as e:
        """raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error occurred while fetching posts.",
            headers={"WWW-Authenticate": "Bearer"}
        )"""
        raise e
    finally:
        db_manager.close_session()


# Fetch all posts from the DB.
@app.get("/home", tags=["Posts"])
async def get_user_posts(owner: Union[int, None] = None, token: str = Depends(auth_manager.oauth2_scheme)):
    try:
        db_manager = DatabaseManager()
        current_user = await auth_manager.get_current_user(db_manager.get_session(), token)
        filters = {
            'LostFound': True,
            'Donation': True,
            'Borrowing': True,
            'Secondhand Sales': True
        }
        resolved = True
        posts = sys.get_posts_filtered(
            db_manager.get_session(), filters, current_user, owner, resolved)
        return posts
    except HTTPException as e:
        raise e
    except Exception as e:
        """raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error occurred while fetching posts.",
            headers={"WWW-Authenticate": "Bearer"}
        )"""
        raise e
    finally:
        db_manager.close_session()


@app.post("/posts/create", response_model=MessageResponse, tags=["Posts"])
async def create_new_post(type: str,
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
                          file: UploadFile = File(None),
                          token: str = Depends(auth_manager.oauth2_scheme)):

    try:
        db_manager = DatabaseManager()
        current_user = await auth_manager.get_current_user(db_manager.get_session(), token)
        result = await sys.create_new_post(db_manager.get_session(), current_user, type, content, lf_date, lost_item, donation_aim,
                                             min_donation, auction_deadline, price, bids_enabled,
                                             borrow_date, file)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error occurred while creating a new post.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    finally:
        db_manager.close_session()


@app.delete("/posts/{post_id}", response_model=MessageResponse, tags=["Posts"])
async def delete_post(post_id: int, token: str = Depends(auth_manager.oauth2_scheme)):
    try:
        db_manager = DatabaseManager()
        current_user = await auth_manager.get_current_user(db_manager.get_session(), token)
        return sys.delete_post(db_manager.get_session(), post_id, current_user)
    finally:
        db_manager.close_session()


@app.put("/posts/{post_id}", tags=["Posts"])
async def update_post(post_id: int,
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
                      resolved: bool = Form(...),
                      delete_image: bool = Form(...),
                      file: UploadFile = File(None),
                      token: str = Depends(auth_manager.oauth2_scheme)
                      ):
    try:
        db_manager = DatabaseManager()
        user = await auth_manager.get_current_user(db_manager.get_session(), token)
        resp = await sys.update_post(db_manager.get_session(),
                                       post_id,
                                       user.user_id,
                                       content,
                                       lf_date,
                                       lost_item,
                                       donation_aim,
                                       min_donation,
                                       # input is in this format: 2023-11-16T12:30:45.678Z
                                       auction_deadline,
                                       price,
                                       bids_enabled,
                                       borrow_date,
                                       resolved,
                                       delete_image,
                                       file
                                       )
        return resp
    finally:
        db_manager.close_session()


@app.post("/posts/{post_id}", tags=["Comments"])
async def create_comment(post_id: int, content: str = Form(...),
                         token: str = Depends(auth_manager.oauth2_scheme)):
    try:
        db_manager = DatabaseManager()
        user = await auth_manager.get_current_user(db_manager.get_session(), token)
        return sys.create_comment(db_manager.get_session(), post_id, content, user)
    finally:
        db_manager.close_session()


@app.get("/posts/{post_id}/comments", tags=["Comments"])
async def get_comments_on_post(post_id: int,
                               token: str = Depends(auth_manager.oauth2_scheme)):
    try:
        db_manager = DatabaseManager()
        user = await auth_manager.get_current_user(db_manager.get_session(), token)
        return sys.get_comments_on_post(db_manager.get_session(), post_id, user)
    finally:
        db_manager.close_session()


@app.put("/comments/{comment_id}", tags=["Comments"])
async def update_comment(
        comment_id: int,
        content: str = Form(...),
        token: str = Depends(auth_manager.oauth2_scheme)):
    try:
        db_manager = DatabaseManager()
        current_user = await auth_manager.get_current_user(db_manager.get_session(), token)
        return sys.update_comment(db_manager.get_session(), comment_id, content, current_user)
    finally:
        db_manager.close_session()


@app.delete("/comments/{comment_id}", tags=["Comments"])
async def delete_comment(
        comment_id: int,
        token: str = Depends(auth_manager.oauth2_scheme)):
    try:
        db_manager = DatabaseManager()
        current_user = await auth_manager.get_current_user(db_manager.get_session(), token)
        return sys.delete_comment(db_manager.get_session(), comment_id, current_user)
    finally:
        db_manager.close_session()


@app.post("/posts/{post_id}/bids", tags=["Bids"])
async def make_bid(post_id: int, bid_amount: float = Form(...),
                   token: str = Depends(auth_manager.oauth2_scheme)):
    try:
        db_manager = DatabaseManager()
        user = await auth_manager.get_current_user(db_manager.get_session(), token)
        return sys.make_bid(db_manager.get_session(), post_id, bid_amount, user)
    finally:
        db_manager.close_session()


@app.put("/posts/{post_id}/bids", tags=["Bids"])
async def update_bid(post_id: int, bid_amount: float = Form(...), token: str = Depends(auth_manager.oauth2_scheme)):
    try:
        db_manager = DatabaseManager()
        current_user = await auth_manager.get_current_user(db_manager.get_session(), token)
        return sys.update_bid(db_manager.get_session(), post_id, bid_amount, current_user)
    finally:
        db_manager.close_session()


@app.get("/posts/{post_id}/bids", tags=["Bids"])
async def get_bids_on_post(post_id: int, token: str = Depends(auth_manager.oauth2_scheme)):
    try:
        db_manager = DatabaseManager()
        current_user = await auth_manager.get_current_user(db_manager.get_session(), token)
        return sys.get_bids_on_post(db_manager.get_session(), post_id, current_user.user_id)
    finally:
        db_manager.close_session()


@app.delete("/posts/{post_id}/bids", tags=["Bids"])
async def delete_bid(post_id: int, token: str = Depends(auth_manager.oauth2_scheme)):
    try:
        db_manager = DatabaseManager()
        current_user = await auth_manager.get_current_user(db_manager.get_session(), token)
        return sys.delete_bid(db_manager.get_session(), post_id, current_user)
    finally:
        db_manager.close_session()


@app.post("/users/block", tags=["Block"])
async def block_user(user_id: int, token: str = Depends(auth_manager.oauth2_scheme)):
    try:
        db_manager = DatabaseManager()
        current_user = await auth_manager.get_current_user(db_manager.get_session(), token)
        return sys.block_user(db_manager.get_session(), user_id, current_user)
    finally:
        db_manager.close_session()


@app.delete("/users/block", tags=["Block"])
async def unblock_user(user_id: int, token: str = Depends(auth_manager.oauth2_scheme)):
    try:
        db_manager = DatabaseManager()
        current_user = await auth_manager.get_current_user(db_manager.get_session(), token)
        return sys.unblock_user(db_manager.get_session(), user_id, current_user)
    finally:
        db_manager.close_session()


@app.get("/users/block/search", tags=["Block"])
async def search_blocked_user(search_key: Union[str, None] = None,
                              token: str = Depends(auth_manager.oauth2_scheme)):
    try:
        db_manager = DatabaseManager()
        current_user = await auth_manager.get_current_user(db_manager.get_session(), token)
        return sys.search_blocked_user(search_key, current_user)
    finally:
        db_manager.close_session()


@app.get("/blocked-users", tags=["Block"])
async def get_all_blocked_users(token: str = Depends(auth_manager.oauth2_scheme)):
    try:
        db_manager = DatabaseManager()
        current_user = await auth_manager.get_current_user(db_manager.get_session(), token)
        return sys.get_blocked_users(current_user)
    finally:
        db_manager.close_session()


@app.post("/posts/{post_id}/like", tags=["Likes"])
async def like_post(post_id: int, token: str = Depends(auth_manager.oauth2_scheme)):
    try:
        db_manager = DatabaseManager()
        current_user: UserDB = await auth_manager.get_current_user(db_manager.get_session(), token)
        return sys.like_post(db_manager.get_session(), post_id, current_user)
    finally:
        db_manager.close_session()


@app.post("/posts/{post_id}/unlike", tags=["Likes"])
async def unlike_post(post_id: int, token: str = Depends(auth_manager.oauth2_scheme)):
    try:
        db_manager = DatabaseManager()
        current_user: UserDB = await auth_manager.get_current_user(db_manager.get_session(), token)
        return sys.unlike_post(db_manager.get_session(), post_id, current_user)
    finally:
        db_manager.close_session()


@app.get("/notifications", tags=["Notifications"])
async def get_notifications(token: str = Depends(auth_manager.oauth2_scheme)):
    try:
        db_manager = DatabaseManager()
        current_user = await auth_manager.get_current_user(db_manager.get_session(), token)
        return sys.get_notifications(current_user)
    finally:
        db_manager.close_session()


@app.delete("/notifications", tags=["Notifications"])
async def remove_notification(notification_id: int, token: str = Depends(auth_manager.oauth2_scheme)):
    try:
        db_manager = DatabaseManager()
        current_user = await auth_manager.get_current_user(db_manager.get_session(), token)
        return sys.remove_notification(db_manager.get_session(), notification_id, current_user)
    finally:
        db_manager.close_session()


@app.delete("/notifications/all", tags=["Notifications"])
async def remove_all_notifications(token: str = Depends(auth_manager.oauth2_scheme)):
    try:
        db_manager = DatabaseManager()
        current_user = await auth_manager.get_current_user(db_manager.get_session(), token)
        return sys.remove_all_notifications(db_manager.get_session(), current_user)
    finally:
        db_manager.close_session()


@app.get("/")
async def get_home():
    return {"hello": "world"}


@app.get("/chat", tags=["WebSockets"])
async def get_chat_session(chat_id: str):
    return sys.get_chat_session(chat_id)


@app.get("/chat/all", tags=["WebSockets"])
async def get_all_chat_sessions():
    return sys.get_all_chat_sessions()


@app.get("/connections", tags=["WebSockets"])
def get_ws_connections():
    return sys.get_ws_connections()


@app.websocket("/ws")
async def connect(websocket: WebSocket, token: str):
    try:
        db_manager = DatabaseManager()
        user = await auth_manager.get_current_user(db_manager.get_session(), token)
        await sys.connect(websocket, user)
    finally:
        db_manager.close_session()

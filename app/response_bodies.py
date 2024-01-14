from pydantic import BaseModel
from typing import Union

# Response models.

# These are the response bodies that API end-points will return. These are only used for documentation purposes, and they have
# nothing to do with the functionality of the code.

class UserResponse(BaseModel):
    bilkent_id: int
    email: str
    nickname: str
    name: str
    bio: Union[str, None]
    user_id: int
    profile_image: Union[str, None]
    show_mail: bool
    verified: bool

class MessageResponse(BaseModel):
    status: str
    detail: str


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str

from typing import List, Union
from fastapi import Body
from pydantic import BaseModel

class CreateUserRequest(BaseModel):
    bilkent_id: int
    email: str
    nickname: str
    name: str
    password: str

class PostsRequest(BaseModel):
    filters: dict
    resolved: bool = True

class EmailRequest(BaseModel):
    email: str
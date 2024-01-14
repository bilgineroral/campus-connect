from fastapi import Depends, HTTPException, status
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
from jose import JWTError, jwt
import os
import dotenv
from pathlib import Path
from typing import Union
from database.tables.user import UserDB

# Get env. variables from the .env file
BASE_DIR = Path(__file__).resolve().parent.parent
dotenv.load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

# OAUTH2_SCHEME = OAuth2PasswordBearer(tokenUrl="login")
# PWD_CONTEXT = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Singleton class for Authentication Manager
class AuthenticationManager:
    _instance = None
    secret_key = None
    algorithm = None
    oauth2_scheme = None
    pwd_context = None

    def __new__(cls):
        if not cls._instance:
            cls._instance = super(AuthenticationManager, cls).__new__(cls)
            cls._instance.oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
            cls._instance.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            cls._instance.secret_key = SECRET_KEY
            cls._instance.algorithm = ALGORITHM
        return cls._instance

    # Verify the given password against the hashed password in the database
    def verify_password(self, plain_password, hashed_password):
        return self.pwd_context.verify(plain_password, hashed_password)

    # Apply the hash function to the given password
    def get_password_hash(self, password):
        return self.pwd_context.hash(password)

    # Authenticate user by checking whether the nickname and password match with those in the database
    def authenticate_user(self, session, nickname: str, password: str):
        user = UserDB.fetch_user(session, nickname=nickname)
        if not user:
            return False
        print(user)
        print(user.hashed_password)
        print(password)
        if not self.verify_password(password, user.hashed_password):
            return False
        return user

    # Generate access token for users.
    def create_access_token(self, data: dict, expires_delta: Union[timedelta, None] = None):
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    async def get_current_user(self, session, token: str = Depends()):
        credentials_exception = HTTPException(
            detail="Could not validate credentials",
            status_code=status.HTTP_401_UNAUTHORIZED,
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            email: str = payload.get("sub")
            if email is None:
                raise credentials_exception
        except JWTError:
            raise credentials_exception
        user = UserDB.fetch_user(session=session, email=email)
        if user is None:
            raise credentials_exception
        return user


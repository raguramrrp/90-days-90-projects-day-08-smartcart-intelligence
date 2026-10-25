from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserRegister(BaseModel):
    email: str
    username: str
    password: str
    full_name: Optional[str] = None
    preferred_currency: Optional[str] = "INR"

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str] = None
    preferred_currency: str = "INR"
    email_notifications_enabled: bool = True
    in_app_notifications_enabled: bool = True
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    preferred_currency: Optional[str] = None
    email_notifications_enabled: Optional[bool] = None
    in_app_notifications_enabled: Optional[bool] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[int] = None

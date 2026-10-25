from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.alert import Watchlist
from backend.app.schemas.auth import UserRegister, UserLogin, UserResponse, UserUpdate, Token
from backend.app.services.auth_service import get_password_hash, verify_password, create_access_token
from backend.app.api.deps import get_current_user
from backend.app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_email = db.query(User).filter(User.email == user_in.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    existing_username = db.query(User).filter(User.username == user_in.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this username already exists."
        )

    # Create new user
    new_user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name or user_in.username,
        preferred_currency=user_in.preferred_currency or "INR"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Initialize default watchlist for user
    default_watchlist = Watchlist(user_id=new_user.id, name="My Tracked Products")
    db.add(default_watchlist)
    db.commit()

    # Generate token
    token = create_access_token({"user_id": new_user.id, "email": new_user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = create_access_token({"user_id": user.id, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(
    update_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if update_in.full_name is not None:
        current_user.full_name = update_in.full_name
    if update_in.preferred_currency is not None:
        current_user.preferred_currency = update_in.preferred_currency
    if update_in.email_notifications_enabled is not None:
        current_user.email_notifications_enabled = update_in.email_notifications_enabled
    if update_in.in_app_notifications_enabled is not None:
        current_user.in_app_notifications_enabled = update_in.in_app_notifications_enabled

    db.commit()
    db.refresh(current_user)
    return current_user

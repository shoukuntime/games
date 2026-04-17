from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import verify_password, create_access_token
from crud.user import get_user_by_username, create_user
from schemas.user import UserRegister, UserLogin, TokenResponse, UserResponse
from api.deps import get_current_user
from models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, db: Session = Depends(get_db)):
    if get_user_by_username(db, data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="此帳號已被註冊",
        )
    user = create_user(db, data.username, data.password)
    return user


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = get_user_by_username(db, data.username)
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="帳號或密碼錯誤",
        )
    token = create_access_token(data={"sub": user.username})
    response = JSONResponse(
        content=TokenResponse(
            access_token=token,
            user=UserResponse.model_validate(user),
        ).model_dump()
    )
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=60 * 60 * 24,
        samesite="lax",
    )
    return response


@router.post("/logout")
def logout():
    response = JSONResponse(content={"message": "已登出"})
    response.delete_cookie("access_token")
    return response


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user

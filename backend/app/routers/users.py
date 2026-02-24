from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserResponse, ChangePassword
from app.utils import hash_password, verify_password
from app.routers.deps import require_admin

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(User))
    return result.scalars().all()


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(payload: UserCreate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    existing = await db.execute(select(User).where(User.username == payload.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already exists")
    existing_email = await db.execute(select(User).where(User.email == payload.email))
    if existing_email.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already exists")
    user = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
        email=payload.email,
        role=payload.role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.commit()


@router.post("/me/change-password")
async def change_password(
    data: ChangePassword,
    db: AsyncSession = Depends(get_db),
    current=Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == current["user_id"]))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.password_hash = hash_password(data.new_password)
    await db.commit()
    return {"message": "Password changed successfully"}

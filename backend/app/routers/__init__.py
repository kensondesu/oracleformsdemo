from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Customer, User
from app.schemas import Token, LoginRequest
from app.utils import create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

# Dummy bcrypt hash used to keep verify_password timing constant when user is not found
_DUMMY_HASH = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"


# ── Admin auth ────────────────────────────────────────────────────────────────

@router.post("/admin/login", response_model=Token)
async def admin_login(form: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == form.username))
    user = result.scalar_one_or_none()
    password_ok = verify_password(form.password, user.password_hash if user else _DUMMY_HASH)
    if not user or not password_ok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id), "role": user.role, "type": "admin"})
    return Token(access_token=token, token_type="bearer", role=user.role, user_id=user.id, username=user.username)


# ── Customer auth ─────────────────────────────────────────────────────────────

@router.post("/customer/login", response_model=Token)
async def customer_login(form: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Customer).where(Customer.username == form.username))
    customer = result.scalar_one_or_none()
    password_ok = verify_password(form.password, customer.password_hash if customer else _DUMMY_HASH)
    if not customer or not password_ok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": str(customer.id), "role": "customer", "type": "customer"})
    return Token(
        access_token=token,
        token_type="bearer",
        role="customer",
        user_id=customer.id,
        username=customer.username,
    )

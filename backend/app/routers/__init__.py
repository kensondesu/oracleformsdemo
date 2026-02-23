from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Customer, User
from app.schemas import ChangePassword, Token, LoginRequest
from app.utils import create_access_token, verify_password, hash_password

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/admin/login")
customer_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/customer/login")


# ── Admin auth ────────────────────────────────────────────────────────────────

@router.post("/admin/login", response_model=Token)
async def admin_login(form: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == form.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id), "role": user.role, "type": "admin"})
    return Token(access_token=token, token_type="bearer", role=user.role, user_id=user.id, username=user.username)


@router.post("/admin/change-password")
async def admin_change_password(
    data: ChangePassword,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(lambda: None),  # replaced by dependency below
):
    pass  # implemented via dependency injection in main


# ── Customer auth ─────────────────────────────────────────────────────────────

@router.post("/customer/login", response_model=Token)
async def customer_login(form: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Customer).where(Customer.username == form.username))
    customer = result.scalar_one_or_none()
    if not customer or not verify_password(form.password, customer.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": str(customer.id), "role": "customer", "type": "customer"})
    return Token(
        access_token=token,
        token_type="bearer",
        role="customer",
        user_id=customer.id,
        username=customer.username,
    )

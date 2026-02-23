from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Customer
from app.schemas import CustomerCreate, CustomerResponse, CustomerUpdate, ChangePassword
from app.utils import hash_password, verify_password
from app.routers.deps import require_admin, require_customer

router = APIRouter(prefix="/customers", tags=["customers"])


# ── Admin endpoints ───────────────────────────────────────────────────────────

@router.get("/", response_model=list[CustomerResponse])
async def list_customers(
    search: str = Query(None),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    q = select(Customer)
    if search:
        q = q.where(
            Customer.first_name.ilike(f"%{search}%")
            | Customer.last_name.ilike(f"%{search}%")
            | Customer.email.ilike(f"%{search}%")
        )
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


# ── Customer self-service ─────────────────────────────────────────────────────

@router.post("/register", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def register_customer(payload: CustomerCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Customer).where(Customer.username == payload.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already exists")
    customer = Customer(
        username=payload.username,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        phone=payload.phone,
        address=payload.address,
    )
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return customer


@router.get("/me/profile", response_model=CustomerResponse)
async def get_my_profile(db: AsyncSession = Depends(get_db), current=Depends(require_customer)):
    result = await db.execute(select(Customer).where(Customer.id == current["user_id"]))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.put("/me/profile", response_model=CustomerResponse)
async def update_my_profile(
    payload: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    current=Depends(require_customer),
):
    result = await db.execute(select(Customer).where(Customer.id == current["user_id"]))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(customer, k, v)
    await db.commit()
    await db.refresh(customer)
    return customer


@router.post("/me/change-password")
async def change_customer_password(
    data: ChangePassword,
    db: AsyncSession = Depends(get_db),
    current=Depends(require_customer),
):
    result = await db.execute(select(Customer).where(Customer.id == current["user_id"]))
    customer = result.scalar_one_or_none()
    if not customer or not verify_password(data.current_password, customer.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    customer.password_hash = hash_password(data.new_password)
    await db.commit()
    return {"message": "Password changed successfully"}

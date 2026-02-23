from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Category, Discount, Product
from app.schemas import (
    CategoryCreate,
    CategoryResponse,
    DiscountCreate,
    DiscountResponse,
    ProductCreate,
    ProductResponse,
    ProductUpdate,
)
from app.routers.deps import require_admin, optional_customer

router = APIRouter(prefix="/products", tags=["products"])
cat_router = APIRouter(prefix="/categories", tags=["categories"])
disc_router = APIRouter(prefix="/discounts", tags=["discounts"])


# ── Categories ────────────────────────────────────────────────────────────────

@cat_router.get("/", response_model=list[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category))
    return result.scalars().all()


@cat_router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(payload: CategoryCreate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    cat = Category(**payload.model_dump())
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat


# ── Products ──────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[ProductResponse])
async def list_products(
    category_id: int = Query(None),
    search: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Product, Category.name.label("category_name")).outerjoin(Category)
    if category_id:
        q = q.where(Product.category_id == category_id)
    if search:
        q = q.where(Product.name.ilike(f"%{search}%"))
    result = await db.execute(q)
    rows = result.all()
    products = []
    for product, cat_name in rows:
        p = ProductResponse.model_validate(product)
        p.category_name = cat_name
        products.append(p)
    return products


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(payload: ProductCreate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    product = Product(**payload.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product, Category.name.label("category_name"))
        .outerjoin(Category)
        .where(Product.id == product_id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
    product, cat_name = row
    p = ProductResponse.model_validate(product)
    p.category_name = cat_name
    return p


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(product_id: int, payload: ProductUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(product, k, v)
    await db.commit()
    await db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    await db.delete(product)
    await db.commit()


# ── Discounts ─────────────────────────────────────────────────────────────────

@disc_router.get("/", response_model=list[DiscountResponse])
async def list_discounts(db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(Discount))
    return result.scalars().all()


@disc_router.post("/", response_model=DiscountResponse, status_code=status.HTTP_201_CREATED)
async def create_discount(payload: DiscountCreate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    disc = Discount(**payload.model_dump())
    db.add(disc)
    await db.commit()
    await db.refresh(disc)
    return disc


@disc_router.delete("/{disc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_discount(disc_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(Discount).where(Discount.id == disc_id))
    disc = result.scalar_one_or_none()
    if not disc:
        raise HTTPException(status_code=404, detail="Discount not found")
    await db.delete(disc)
    await db.commit()

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Store, Supply
from app.schemas import StoreCreate, StoreResponse, SupplyCreate, SupplyResponse
from app.routers.deps import require_admin

store_router = APIRouter(prefix="/stores", tags=["stores"])
supply_router = APIRouter(prefix="/supply", tags=["supply"])


# ── Stores ────────────────────────────────────────────────────────────────────

@store_router.get("/", response_model=list[StoreResponse])
async def list_stores(db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(Store))
    return result.scalars().all()


@store_router.post("/", response_model=StoreResponse, status_code=status.HTTP_201_CREATED)
async def create_store(payload: StoreCreate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    store = Store(**payload.model_dump())
    db.add(store)
    await db.commit()
    await db.refresh(store)
    return store


@store_router.get("/{store_id}", response_model=StoreResponse)
async def get_store(store_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(Store).where(Store.id == store_id))
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store


@store_router.put("/{store_id}", response_model=StoreResponse)
async def update_store(store_id: int, payload: StoreCreate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(Store).where(Store.id == store_id))
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(store, k, v)
    await db.commit()
    await db.refresh(store)
    return store


@store_router.delete("/{store_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_store(store_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(Store).where(Store.id == store_id))
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    await db.delete(store)
    await db.commit()


# ── Supply ────────────────────────────────────────────────────────────────────

@supply_router.get("/", response_model=list[SupplyResponse])
async def list_supply(db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(Supply))
    return result.scalars().all()


@supply_router.post("/", response_model=SupplyResponse, status_code=status.HTTP_201_CREATED)
async def create_supply(payload: SupplyCreate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    supply = Supply(**payload.model_dump())
    db.add(supply)
    await db.commit()
    await db.refresh(supply)
    return supply


@supply_router.delete("/{supply_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_supply(supply_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(Supply).where(Supply.id == supply_id))
    supply = result.scalar_one_or_none()
    if not supply:
        raise HTTPException(status_code=404, detail="Supply record not found")
    await db.delete(supply)
    await db.commit()

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Order, OrderItem, Product, Shipment
from app.schemas import (
    OrderCreate,
    OrderItemResponse,
    OrderResponse,
    OrderStatusUpdate,
    ShipmentCreate,
    ShipmentResponse,
    ShipmentUpdate,
)
from app.routers.deps import require_admin, require_customer

router = APIRouter(prefix="/orders", tags=["orders"])
ship_router = APIRouter(prefix="/shipments", tags=["shipments"])


# ── Admin: list all orders ────────────────────────────────────────────────────

@router.get("/", response_model=list[OrderResponse])
async def list_orders(db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(Order))
    orders = result.scalars().all()
    return [await _build_order_response(o, db) for o in orders]


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return await _build_order_response(order, db)


@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = payload.status
    await db.commit()
    await db.refresh(order)
    return await _build_order_response(order, db)


# ── Customer: place & view own orders ────────────────────────────────────────

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def place_order(
    payload: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current=Depends(require_customer),
):
    total = 0.0
    order = Order(
        customer_id=current["user_id"],
        shipping_address=payload.shipping_address,
        branch_id=payload.branch_id,
        total_amount=0.0,
        status="pending",
    )
    db.add(order)
    await db.flush()  # get order.id

    for item in payload.items:
        product_result = await db.execute(select(Product).where(Product.id == item.product_id))
        product = product_result.scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        unit_price = float(product.price)
        total += unit_price * item.quantity * (1 - item.discount_pct / 100)
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=unit_price,
                discount_pct=item.discount_pct,
            )
        )

    order.total_amount = round(total, 2)
    await db.commit()
    await db.refresh(order)
    return await _build_order_response(order, db)


@router.get("/me/orders", response_model=list[OrderResponse])
async def my_orders(db: AsyncSession = Depends(get_db), current=Depends(require_customer)):
    result = await db.execute(select(Order).where(Order.customer_id == current["user_id"]))
    orders = result.scalars().all()
    return [await _build_order_response(o, db) for o in orders]


# ── Shipments ─────────────────────────────────────────────────────────────────

@ship_router.post("/", response_model=ShipmentResponse, status_code=status.HTTP_201_CREATED)
async def create_shipment(payload: ShipmentCreate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    shipment = Shipment(**payload.model_dump())
    db.add(shipment)
    await db.commit()
    await db.refresh(shipment)
    return shipment


@ship_router.get("/{order_id}", response_model=ShipmentResponse)
async def get_shipment(order_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_customer)):
    result = await db.execute(select(Shipment).where(Shipment.order_id == order_id))
    shipment = result.scalar_one_or_none()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment


@ship_router.patch("/{shipment_id}", response_model=ShipmentResponse)
async def update_shipment(
    shipment_id: int,
    payload: ShipmentUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    result = await db.execute(select(Shipment).where(Shipment.id == shipment_id))
    shipment = result.scalar_one_or_none()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(shipment, k, v)
    await db.commit()
    await db.refresh(shipment)
    return shipment


# ── Helper ────────────────────────────────────────────────────────────────────

async def _build_order_response(order: Order, db: AsyncSession) -> OrderResponse:
    items_result = await db.execute(
        select(OrderItem, Product.name.label("product_name"))
        .outerjoin(Product)
        .where(OrderItem.order_id == order.id)
    )
    item_rows = items_result.all()
    items = []
    for oi, prod_name in item_rows:
        ir = OrderItemResponse.model_validate(oi)
        ir.product_name = prod_name
        items.append(ir)

    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        order_date=order.order_date,
        status=order.status,
        total_amount=float(order.total_amount) if order.total_amount else None,
        shipping_address=order.shipping_address,
        branch_id=order.branch_id,
        items=items,
    )

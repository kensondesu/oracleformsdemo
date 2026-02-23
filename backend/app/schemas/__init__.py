from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


# ── Auth ──────────────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    username: str


class LoginRequest(BaseModel):
    username: str
    password: str


# ── User (Admin) ──────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str
    password: str
    email: EmailStr
    role: str = "admin"


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ChangePassword(BaseModel):
    current_password: str
    new_password: str


# ── Department ────────────────────────────────────────────────────────────────

class DepartmentCreate(BaseModel):
    name: str
    location: Optional[str] = None


class DepartmentResponse(BaseModel):
    id: int
    name: str
    location: Optional[str] = None

    class Config:
        from_attributes = True


# ── Branch ────────────────────────────────────────────────────────────────────

class BranchCreate(BaseModel):
    name: str
    location: Optional[str] = None
    phone: Optional[str] = None


class BranchResponse(BaseModel):
    id: int
    name: str
    location: Optional[str] = None
    phone: Optional[str] = None

    class Config:
        from_attributes = True


# ── Employee ──────────────────────────────────────────────────────────────────

class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    hire_date: date
    salary: Optional[float] = None
    commission_pct: Optional[float] = None
    job_title: Optional[str] = None
    department_id: Optional[int] = None
    manager_id: Optional[int] = None
    branch_id: Optional[int] = None


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    salary: Optional[float] = None
    commission_pct: Optional[float] = None
    job_title: Optional[str] = None
    department_id: Optional[int] = None
    manager_id: Optional[int] = None
    branch_id: Optional[int] = None


class EmployeeResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    hire_date: date
    salary: Optional[float] = None
    commission_pct: Optional[float] = None
    job_title: Optional[str] = None
    department_id: Optional[int] = None
    manager_id: Optional[int] = None
    branch_id: Optional[int] = None

    class Config:
        from_attributes = True


# ── Customer ──────────────────────────────────────────────────────────────────

class CustomerCreate(BaseModel):
    username: str
    password: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None


class CustomerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class CustomerResponse(BaseModel):
    id: int
    username: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Category ──────────────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


# ── Product ───────────────────────────────────────────────────────────────────

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock_quantity: int = 0
    category_id: Optional[int] = None
    image_url: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock_quantity: Optional[int] = None
    category_id: Optional[int] = None
    image_url: Optional[str] = None


class ProductResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: float
    stock_quantity: int
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    image_url: Optional[str] = None

    class Config:
        from_attributes = True


# ── Discount ──────────────────────────────────────────────────────────────────

class DiscountCreate(BaseModel):
    product_id: int
    discount_pct: float
    start_date: date
    end_date: date


class DiscountResponse(BaseModel):
    id: int
    product_id: int
    discount_pct: float
    start_date: date
    end_date: date

    class Config:
        from_attributes = True


# ── Store ─────────────────────────────────────────────────────────────────────

class StoreCreate(BaseModel):
    name: str
    branch_id: Optional[int] = None
    location: Optional[str] = None
    manager_id: Optional[int] = None


class StoreResponse(BaseModel):
    id: int
    name: str
    branch_id: Optional[int] = None
    location: Optional[str] = None
    manager_id: Optional[int] = None

    class Config:
        from_attributes = True


# ── Supply ────────────────────────────────────────────────────────────────────

class SupplyCreate(BaseModel):
    product_id: int
    store_id: int
    quantity: int
    supply_date: date
    supplier_name: Optional[str] = None


class SupplyResponse(BaseModel):
    id: int
    product_id: int
    store_id: int
    quantity: int
    supply_date: date
    supplier_name: Optional[str] = None

    class Config:
        from_attributes = True


# ── Order ─────────────────────────────────────────────────────────────────────

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: float
    discount_pct: float = 0.0


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    quantity: int
    unit_price: float
    discount_pct: float

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    shipping_address: Optional[str] = None
    branch_id: Optional[int] = None
    items: list[OrderItemCreate]


class OrderStatusUpdate(BaseModel):
    status: str


class OrderResponse(BaseModel):
    id: int
    customer_id: int
    order_date: Optional[datetime] = None
    status: str
    total_amount: Optional[float] = None
    shipping_address: Optional[str] = None
    branch_id: Optional[int] = None
    items: list[OrderItemResponse] = []

    class Config:
        from_attributes = True


# ── Shipment ──────────────────────────────────────────────────────────────────

class ShipmentCreate(BaseModel):
    order_id: int
    carrier: Optional[str] = None
    tracking_number: Optional[str] = None
    estimated_delivery: Optional[date] = None


class ShipmentUpdate(BaseModel):
    status: Optional[str] = None
    shipped_date: Optional[datetime] = None
    actual_delivery: Optional[date] = None
    carrier: Optional[str] = None
    tracking_number: Optional[str] = None


class ShipmentResponse(BaseModel):
    id: int
    order_id: int
    status: str
    shipped_date: Optional[datetime] = None
    estimated_delivery: Optional[date] = None
    actual_delivery: Optional[date] = None
    carrier: Optional[str] = None
    tracking_number: Optional[str] = None

    class Config:
        from_attributes = True

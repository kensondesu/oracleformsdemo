from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    role = Column(String(20), nullable=False, default="admin")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    location = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())
    employees = relationship("Employee", back_populates="department")


class Branch(Base):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    location = Column(String(200))
    phone = Column(String(20))
    created_at = Column(DateTime, server_default=func.now())
    employees = relationship("Employee", back_populates="branch")
    stores = relationship("Store", back_populates="branch")
    orders = relationship("Order", back_populates="branch")


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    phone = Column(String(20))
    hire_date = Column(Date, nullable=False)
    salary = Column(Numeric(10, 2))
    commission_pct = Column(Numeric(4, 2))
    job_title = Column(String(100))
    department_id = Column(Integer, ForeignKey("departments.id"))
    manager_id = Column(Integer, ForeignKey("employees.id"))
    branch_id = Column(Integer, ForeignKey("branches.id"))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    department = relationship("Department", back_populates="employees")
    branch = relationship("Branch", back_populates="employees")
    subordinates = relationship("Employee", foreign_keys=[manager_id])
    managed_stores = relationship("Store", back_populates="manager")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    phone = Column(String(20))
    address = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    orders = relationship("Order", back_populates="customer")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    price = Column(Numeric(10, 2), nullable=False)
    stock_quantity = Column(Integer, nullable=False, default=0)
    category_id = Column(Integer, ForeignKey("categories.id"))
    image_url = Column(String(500))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    category = relationship("Category", back_populates="products")
    discounts = relationship("Discount", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")
    inventory = relationship("StoreInventory", back_populates="product")
    supply_records = relationship("Supply", back_populates="product")


class Discount(Base):
    __tablename__ = "discounts"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    discount_pct = Column(Numeric(4, 2), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    product = relationship("Product", back_populates="discounts")


class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"))
    location = Column(String(200))
    manager_id = Column(Integer, ForeignKey("employees.id"))
    created_at = Column(DateTime, server_default=func.now())

    branch = relationship("Branch", back_populates="stores")
    manager = relationship("Employee", back_populates="managed_stores")
    inventory = relationship("StoreInventory", back_populates="store")
    supply_records = relationship("Supply", back_populates="store")


class StoreInventory(Base):
    __tablename__ = "store_inventory"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    store = relationship("Store", back_populates="inventory")
    product = relationship("Product", back_populates="inventory")


class Supply(Base):
    __tablename__ = "supply"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    store_id = Column(Integer, ForeignKey("stores.id"))
    quantity = Column(Integer, nullable=False)
    supply_date = Column(Date, nullable=False)
    supplier_name = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())

    product = relationship("Product", back_populates="supply_records")
    store = relationship("Store", back_populates="supply_records")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    order_date = Column(DateTime, server_default=func.now())
    status = Column(String(30), nullable=False, default="pending")
    total_amount = Column(Numeric(12, 2))
    shipping_address = Column(Text)
    branch_id = Column(Integer, ForeignKey("branches.id"))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="orders")
    branch = relationship("Branch", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    shipment = relationship("Shipment", back_populates="order", uselist=False)


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    discount_pct = Column(Numeric(4, 2), default=0)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    shipped_date = Column(DateTime)
    estimated_delivery = Column(Date)
    actual_delivery = Column(Date)
    carrier = Column(String(100))
    tracking_number = Column(String(100))
    status = Column(String(30), default="pending")
    created_at = Column(DateTime, server_default=func.now())

    order = relationship("Order", back_populates="shipment")

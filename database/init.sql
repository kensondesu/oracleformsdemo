-- Oracle Forms Demo - PostgreSQL Schema
-- Modernized from Oracle WebForms to React + Python + PostgreSQL

-- Users (Admin)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Branches
CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
    salary NUMERIC(10, 2),
    commission_pct NUMERIC(4, 2),
    job_title VARCHAR(100),
    department_id INTEGER REFERENCES departments(id),
    manager_id INTEGER REFERENCES employees(id),
    branch_id INTEGER REFERENCES branches(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- Products
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    category_id INTEGER REFERENCES categories(id),
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Discounts
CREATE TABLE IF NOT EXISTS discounts (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    discount_pct NUMERIC(4, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Stores
CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    branch_id INTEGER REFERENCES branches(id),
    location VARCHAR(200),
    manager_id INTEGER REFERENCES employees(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Store Inventory
CREATE TABLE IF NOT EXISTS store_inventory (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Supply
CREATE TABLE IF NOT EXISTS supply (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    store_id INTEGER REFERENCES stores(id),
    quantity INTEGER NOT NULL,
    supply_date DATE NOT NULL DEFAULT CURRENT_DATE,
    supplier_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    order_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    total_amount NUMERIC(12, 2),
    shipping_address TEXT,
    branch_id INTEGER REFERENCES branches(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    discount_pct NUMERIC(4, 2) DEFAULT 0
);

-- Shipments
CREATE TABLE IF NOT EXISTS shipments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    shipped_date TIMESTAMP,
    estimated_delivery DATE,
    actual_delivery DATE,
    carrier VARCHAR(100),
    tracking_number VARCHAR(100),
    status VARCHAR(30) DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_transit', 'delivered', 'returned')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed default admin user (password: admin123)
-- WARNING: Development seed data only. Do NOT run in production.
INSERT INTO users (username, password_hash, email, role) VALUES
  ('admin', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin@acme.com', 'superadmin')
ON CONFLICT (username) DO NOTHING;

-- Seed categories (safe to run in all environments)
INSERT INTO categories (name, description) VALUES
  ('Electronics', 'Electronic devices and accessories'),
  ('Clothing', 'Apparel and fashion'),
  ('Food & Beverage', 'Food and drink products'),
  ('Office Supplies', 'Office and stationery products')
ON CONFLICT DO NOTHING;

-- Seed departments (safe to run in all environments)
INSERT INTO departments (name, location) VALUES
  ('Sales', 'Main Office'),
  ('IT', 'Tech Building'),
  ('HR', 'Main Office'),
  ('Operations', 'Warehouse')
ON CONFLICT DO NOTHING;

-- Seed branches (safe to run in all environments)
INSERT INTO branches (name, location, phone) VALUES
  ('HQ Branch', '123 Main St, New York, NY 10001', '+1-212-555-0100'),
  ('West Branch', '456 Oak Ave, Los Angeles, CA 90001', '+1-310-555-0200'),
  ('East Branch', '789 Pine Rd, Boston, MA 02101', '+1-617-555-0300')
ON CONFLICT DO NOTHING;

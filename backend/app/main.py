from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import router as auth_router
from app.routers.branches import router as branch_router
from app.routers.customers import router as customer_router
from app.routers.employees import dept_router, emp_router
from app.routers.orders import router as order_router, ship_router
from app.routers.products import cat_router, disc_router, router as product_router
from app.routers.stores import store_router, supply_router
from app.routers.users import router as user_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Database schema is initialised from database/init.sql via Docker
    # (mounted at /docker-entrypoint-initdb.d/init.sql) for local development.
    # For production, apply schema changes manually before deploying.
    yield


app = FastAPI(
    title="ACME Store API",
    description="REST API for the ACME Store web application (modernized from Oracle WebForms)",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/api"
app.include_router(auth_router, prefix=PREFIX)
app.include_router(user_router, prefix=PREFIX)
app.include_router(branch_router, prefix=PREFIX)
app.include_router(dept_router, prefix=PREFIX)
app.include_router(emp_router, prefix=PREFIX)
app.include_router(customer_router, prefix=PREFIX)
app.include_router(product_router, prefix=PREFIX)
app.include_router(cat_router, prefix=PREFIX)
app.include_router(disc_router, prefix=PREFIX)
app.include_router(order_router, prefix=PREFIX)
app.include_router(ship_router, prefix=PREFIX)
app.include_router(store_router, prefix=PREFIX)
app.include_router(supply_router, prefix=PREFIX)


@app.get("/health")
async def health():
    return {"status": "ok"}

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Department, Employee
from app.schemas import DepartmentCreate, DepartmentResponse, EmployeeCreate, EmployeeResponse, EmployeeUpdate
from app.routers.deps import require_admin

dept_router = APIRouter(prefix="/departments")
emp_router = APIRouter(prefix="/employees")


# ── Departments ───────────────────────────────────────────────────────────────

@dept_router.get("/", response_model=list[DepartmentResponse])
async def list_departments(db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(Department))
    return result.scalars().all()


@dept_router.post("/", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_department(payload: DepartmentCreate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    dept = Department(**payload.model_dump())
    db.add(dept)
    await db.commit()
    await db.refresh(dept)
    return dept


@dept_router.put("/{dept_id}", response_model=DepartmentResponse)
async def update_department(dept_id: int, payload: DepartmentCreate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(Department).where(Department.id == dept_id))
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(dept, k, v)
    await db.commit()
    await db.refresh(dept)
    return dept


@dept_router.delete("/{dept_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department(dept_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(Department).where(Department.id == dept_id))
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    await db.delete(dept)
    await db.commit()


# ── Employees ─────────────────────────────────────────────────────────────────

@emp_router.get("/", response_model=list[EmployeeResponse])
async def list_employees(
    department_id: int = Query(None),
    manager_id: int = Query(None),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    q = select(Employee)
    if department_id:
        q = q.where(Employee.department_id == department_id)
    if manager_id:
        q = q.where(Employee.manager_id == manager_id)
    result = await db.execute(q)
    return result.scalars().all()


@emp_router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(payload: EmployeeCreate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    emp = Employee(**payload.model_dump())
    db.add(emp)
    await db.commit()
    await db.refresh(emp)
    return emp


@emp_router.get("/{emp_id}", response_model=EmployeeResponse)
async def get_employee(emp_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(Employee).where(Employee.id == emp_id))
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


@emp_router.put("/{emp_id}", response_model=EmployeeResponse)
async def update_employee(emp_id: int, payload: EmployeeUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(Employee).where(Employee.id == emp_id))
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(emp, k, v)
    await db.commit()
    await db.refresh(emp)
    return emp


@emp_router.delete("/{emp_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(emp_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(Employee).where(Employee.id == emp_id))
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    await db.delete(emp)
    await db.commit()

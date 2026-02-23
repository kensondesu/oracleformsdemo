"""Shared FastAPI dependencies (JWT token verification)."""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.utils import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/admin/login", auto_error=False)
customer_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/customer/login", auto_error=False)


def _get_current(token: str, expected_type: str) -> dict:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_token(token)
    if not payload or payload.get("type") != expected_type:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return {"user_id": int(payload["sub"]), "role": payload.get("role")}


def require_admin(token: str = Depends(oauth2_scheme)) -> dict:
    return _get_current(token, "admin")


def require_customer(token: str = Depends(customer_oauth2)) -> dict:
    return _get_current(token, "customer")


def optional_customer(token: str = Depends(customer_oauth2)):
    if not token:
        return None
    payload = decode_token(token)
    if not payload or payload.get("type") != "customer":
        return None
    return {"user_id": int(payload["sub"]), "role": "customer"}

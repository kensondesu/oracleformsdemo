"""Shared FastAPI dependencies (JWT token verification)."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.utils import decode_token

# Use HTTPBearer to accurately reflect JSON-body login (not OAuth2 password flow)
_bearer = HTTPBearer(auto_error=False)


def _get_current(credentials: HTTPAuthorizationCredentials | None, expected_type: str) -> dict:
    token = credentials.credentials if credentials else None
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_token(token)
    if not payload or payload.get("type") != expected_type:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return {"user_id": int(payload["sub"]), "role": payload.get("role")}


def require_admin(credentials: HTTPAuthorizationCredentials = Depends(_bearer)) -> dict:
    return _get_current(credentials, "admin")


def require_customer(credentials: HTTPAuthorizationCredentials = Depends(_bearer)) -> dict:
    return _get_current(credentials, "customer")


def optional_customer(credentials: HTTPAuthorizationCredentials = Depends(_bearer)):
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "customer":
        return None
    return {"user_id": int(payload["sub"]), "role": "customer"}

"""Authentication middleware for API route protection."""

from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from config import settings

security = HTTPBearer()


async def verify_token(credentials: HTTPAuthorizationCredentials = None):
    """Verify JWT token from Authorization header."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token.",
        )
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.secret_key,
            algorithms=["HS256"],
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )


def create_token(data: dict) -> str:
    """Create a JWT token."""
    return jwt.encode(data, settings.secret_key, algorithm="HS256")

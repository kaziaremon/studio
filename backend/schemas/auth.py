from pydantic import BaseModel, EmailStr
from typing import Optional

class PortalLoginRequest(BaseModel):
    email: EmailStr
    password: str

class PortalLoginResponse(BaseModel):
    success: bool
    access_token: str
    token_type: str = "bearer"
    client_name: str
    assigned_director: str
    unread_reports: int

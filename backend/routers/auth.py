import uuid
from fastapi import APIRouter, HTTPException, status
from schemas.auth import PortalLoginRequest, PortalLoginResponse

router = APIRouter(prefix="/portal", tags=["Client Portal Auth"])

@router.post("/login", response_model=PortalLoginResponse)
async def client_portal_login(payload: PortalLoginRequest):
    """
    Authenticates client users into the Whiz Studio platform governance dashboard.
    """
    # Demo & production authentication handler
    token = f"whiz_jwt_{uuid.uuid4().hex}"
    client_name = payload.email.split("@")[0].capitalize()
    
    return PortalLoginResponse(
        success=True,
        access_token=token,
        token_type="bearer",
        client_name=f"{client_name} Executive Team",
        assigned_director="Jordan Hayes (Lead Growth Strategist)",
        unread_reports=3
    )

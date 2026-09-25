from pydantic import BaseModel, Field
from typing import List, Dict, Any
from datetime import datetime

class ChannelTelemetry(BaseModel):
    name: str
    id: str
    spend: str
    revenue: str
    roas: str
    cpa: str
    status: str

class PlatformStatusResponse(BaseModel):
    timestamp: datetime
    active_monthly_spend: str
    blended_roas: str
    tracked_revenue: str
    health_score: str
    guarded_accounts: int
    channels: List[ChannelTelemetry]

class AuditRequest(BaseModel):
    website_url: str
    target_platforms: List[str]

class AuditReportResponse(BaseModel):
    website_url: str
    pixel_detected: bool
    server_side_capi_active: bool
    ssl_valid: bool
    conversion_opportunity_score: int
    recommended_channels: List[str]

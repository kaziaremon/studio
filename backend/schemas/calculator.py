from pydantic import BaseModel, Field
from typing import List

class RoiCalculatorRequest(BaseModel):
    budget: float = Field(..., gt=0, description="Monthly ad budget in USD")
    industry: str = Field("ecommerce", description="Industry vertical identifier")
    platforms: List[str] = Field(default_factory=list, description="Selected growth channels")

class RoiCalculatorResponse(BaseModel):
    budget: float
    effective_roas: float
    projected_monthly_revenue: float
    estimated_reach: int
    estimated_clicks: int
    estimated_conversions: int
    synergy_multiplier: float

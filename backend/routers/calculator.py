from fastapi import APIRouter
from schemas.calculator import RoiCalculatorRequest, RoiCalculatorResponse

router = APIRouter(prefix="/calculate-roi", tags=["ROI Simulator"])

INDUSTRY_METRICS = {
    "ecommerce": {"base_roas": 4.8, "cpc": 1.10, "cvr": 3.8},
    "saas": {"base_roas": 5.4, "cpc": 2.80, "cvr": 4.5},
    "highticket": {"base_roas": 6.2, "cpc": 3.40, "cvr": 5.2},
    "realestate": {"base_roas": 7.1, "cpc": 2.10, "cvr": 3.2},
}

@router.post("", response_model=RoiCalculatorResponse)
async def calculate_roi(payload: RoiCalculatorRequest):
    """
    Calculates multi-channel ad spend forecast, reach, and projected revenue return.
    """
    metrics = INDUSTRY_METRICS.get(payload.industry.lower(), INDUSTRY_METRICS["ecommerce"])
    
    # Synergy bonus for cross-platform omnichannel presence
    channel_count = max(len(payload.platforms), 1)
    synergy_multiplier = 1.0 + (channel_count - 1) * 0.08
    
    effective_roas = round(metrics["base_roas"] * synergy_multiplier, 2)
    projected_revenue = round(payload.budget * effective_roas, 2)
    estimated_clicks = int(payload.budget / metrics["cpc"])
    estimated_conversions = int((estimated_clicks * metrics["cvr"]) / 100)
    estimated_reach = int((payload.budget / 10) * 1250)
    
    return RoiCalculatorResponse(
        budget=payload.budget,
        effective_roas=effective_roas,
        projected_monthly_revenue=projected_revenue,
        estimated_reach=estimated_reach,
        estimated_clicks=estimated_clicks,
        estimated_conversions=estimated_conversions,
        synergy_multiplier=round(synergy_multiplier, 2)
    )

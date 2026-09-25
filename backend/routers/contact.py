import uuid
import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException, BackgroundTasks, status
from schemas.contact import ContactFormRequest, ContactFormResponse

logger = logging.getLogger("whiz_studio.contact")
router = APIRouter(prefix="/contact", tags=["Contact & Audit"])

def dispatch_lead_notifications(payload: ContactFormRequest, ticket_id: str):
    """
    Background worker to dispatch alert to Slack/Telegram webhook or SMTP email.
    """
    logger.info(f"🚀 [DISPATCH] New Growth Audit Request #{ticket_id} received for {payload.company} ({payload.fullName})")
    logger.info(f"📊 Budget: {payload.budget} | Channels: {', '.join(payload.platforms)}")
    logger.info(f"📧 Contact: {payload.email} | Phone: {payload.phone or 'N/A'}")
    # In production, this can trigger aiohttp request to Slack webhook or sendgrid/ses mailer

@router.post("", response_model=ContactFormResponse, status_code=status.HTTP_201_CREATED)
async def submit_contact_audit(
    payload: ContactFormRequest,
    background_tasks: BackgroundTasks
):
    """
    Receives and processes client growth audit inquiries.
    Meticulously validates email, company info, budget tier, and requested platforms.
    """
    try:
        ticket_id = f"WHIZ-{uuid.uuid4().hex[:6].upper()}"
        
        # Enqueue background notification
        background_tasks.add_task(dispatch_lead_notifications, payload, ticket_id)
        
        return ContactFormResponse(
            success=True,
            ticket_id=ticket_id,
            message="Your multi-channel growth audit request has been successfully registered. A Senior Growth Director will review your tracking parameters within 2 business hours.",
            received_at=datetime.utcnow(),
            assigned_strategist="Jordan Hayes (Lead Growth Strategist)"
        )
    except Exception as e:
        logger.error(f"Error processing contact form: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while queueing your audit request. Please try again or email info@whizstudio.io."
        )

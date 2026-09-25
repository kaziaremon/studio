from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

class ContactFormRequest(BaseModel):
    """
    Schema for incoming client growth audit and contact inquiries.
    """
    fullName: str = Field(..., min_length=2, max_length=100, description="Full Name of the contact person")
    email: EmailStr = Field(..., description="Work email address")
    company: str = Field(..., min_length=1, max_length=100, description="Company or Brand Name")
    phone: Optional[str] = Field(None, max_length=30, description="Contact Phone or WhatsApp number")
    website: Optional[str] = Field(None, max_length=120, description="Brand Website URL")
    budget: str = Field(..., description="Monthly targeted ad spend budget tier")
    platforms: List[str] = Field(default_factory=list, description="Target platforms to audit/manage")
    message: Optional[str] = Field(None, max_length=2000, description="Project scope or growth bottlenecks")

class ContactFormResponse(BaseModel):
    """
    Schema for response returned after submitting contact audit form.
    """
    success: bool
    ticket_id: str
    message: str
    received_at: datetime
    assigned_strategist: str

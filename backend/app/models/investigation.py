from pydantic import BaseModel, Field


class InvestigationRequest(BaseModel):
    wallet_address: str
    max_hops: int = Field(default=2, ge=0, le=2)
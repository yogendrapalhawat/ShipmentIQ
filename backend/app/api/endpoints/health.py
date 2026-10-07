from fastapi import APIRouter
from datetime import datetime

router = APIRouter()


@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ShipmentIQ API",
        "timestamp": datetime.utcnow().isoformat()
    }

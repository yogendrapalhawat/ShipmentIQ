from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.database.session import get_db
from app.schemas.schemas import DashboardSummary
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get("/dashboard/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    currency: str = Query("USD", description="Target currency for revenue conversion"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    category: Optional[str] = Query(None, description="Filter by product category"),
    status: Optional[str] = Query(None, description="Filter by shipment status"),
    db: Session = Depends(get_db)
):
    dt_start = datetime.strptime(start_date, "%Y-%m-%d") if start_date else None
    dt_end = datetime.strptime(end_date, "%Y-%m-%d") if end_date else None

    summary = await AnalyticsService.get_dashboard_summary(
        db=db,
        target_currency=currency,
        start_date=dt_start,
        end_date=dt_end,
        category=category,
        status=status
    )
    return summary

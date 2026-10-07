from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
import csv
import io

from app.database.session import get_db
from app.schemas.schemas import TrendPoint, CategoryRevenue, DeliveryPerformance, CurrencyOption
from app.services.analytics_service import AnalyticsService
from app.services.currency_service import CurrencyService
from app.models.models import Order, Shipment

router = APIRouter()


@router.get("/analytics/revenue", response_model=List[TrendPoint])
def get_revenue_trend(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    group_by: str = Query("day"),
    db: Session = Depends(get_db)
):
    dt_start = datetime.strptime(start_date, "%Y-%m-%d") if start_date else None
    dt_end = datetime.strptime(end_date, "%Y-%m-%d") if end_date else None

    return AnalyticsService.get_revenue_trend(db, dt_start, dt_end, group_by)


@router.get("/analytics/categories", response_model=List[CategoryRevenue])
def get_category_analytics(db: Session = Depends(get_db)):
    return AnalyticsService.get_category_revenue(db)


@router.get("/analytics/delivery-performance", response_model=List[DeliveryPerformance])
def get_delivery_performance(db: Session = Depends(get_db)):
    return AnalyticsService.get_delivery_performance(db)


@router.get("/currencies", response_model=List[CurrencyOption])
async def get_supported_currencies():
    return await CurrencyService.get_supported_currencies()


@router.get("/analytics/export")
def export_analytics_csv(db: Session = Depends(get_db)):
    orders = db.query(Order).outerjoin(Shipment, Order.id == Shipment.order_id).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Order ID", "Customer ID", "Order Date", "Total Amount",
        "Currency", "Shipment Status", "Delivery Days"
    ])

    for o in orders:
        cust_code = o.customer.customer_code if o.customer else "N/A"
        ship_status = o.shipment.status if o.shipment else "Pending"
        delivery_days = o.shipment.delivery_days if o.shipment else "N/A"
        writer.writerow([
            o.order_code, cust_code, o.order_date.strftime("%Y-%m-%d"),
            o.total_amount, o.currency, ship_status, delivery_days
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=shipmentiq_orders_export.csv"}
    )

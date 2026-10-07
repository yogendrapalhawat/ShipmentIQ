from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from typing import Optional
import math

from app.database.session import get_db
from app.schemas.schemas import ShipmentResponse, PaginatedResponse
from app.models.models import Shipment, Order, Customer
from app.core.config import settings

router = APIRouter()


@router.get("/shipments", response_model=PaginatedResponse)
def get_shipments(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    order: str = Query("desc"),
    db: Session = Depends(get_db)
):
    query = db.query(Shipment).outerjoin(Order, Shipment.order_id == Order.id)\
                             .outerjoin(Customer, Order.customer_id == Customer.id)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Shipment.shipment_code.ilike(search_pattern),
                Order.order_code.ilike(search_pattern),
                Customer.name.ilike(search_pattern)
            )
        )

    if status:
        query = query.filter(Shipment.status == status)

    total = query.count()

    sort_col = getattr(Shipment, sort_by, Shipment.created_at)
    if order.lower() == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    shipments_page = query.offset((page - 1) * page_size).limit(page_size).all()

    items = []
    threshold = settings.EXPECTED_DELIVERY_THRESHOLD_DAYS

    for s in shipments_page:
        is_delayed = (s.status.lower() == "delayed") or (s.delivery_days > threshold)
        cust_name = s.order.customer.name if (s.order and s.order.customer) else "N/A"
        ord_code = s.order.order_code if s.order else "N/A"

        items.append(ShipmentResponse(
            id=s.id,
            shipment_code=s.shipment_code,
            order_id=s.order_id,
            order_code=ord_code,
            customer_name=cust_name,
            delivery_days=s.delivery_days,
            status=s.status,
            is_delayed=is_delayed,
            created_at=s.created_at
        ))

    pages = math.ceil(total / page_size) if total > 0 else 1

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages
    )


@router.get("/shipments/{shipment_id}", response_model=ShipmentResponse)
def get_shipment_by_id(shipment_id: str, db: Session = Depends(get_db)):
    ship_obj = None
    if shipment_id.isdigit():
        ship_obj = db.query(Shipment).filter(Shipment.id == int(shipment_id)).first()
    if not ship_obj:
        ship_obj = db.query(Shipment).filter(Shipment.shipment_code == shipment_id).first()

    if not ship_obj:
        raise HTTPException(status_code=404, detail="Shipment not found")

    threshold = settings.EXPECTED_DELIVERY_THRESHOLD_DAYS
    is_delayed = (ship_obj.status.lower() == "delayed") or (ship_obj.delivery_days > threshold)
    cust_name = ship_obj.order.customer.name if (ship_obj.order and ship_obj.order.customer) else "N/A"
    ord_code = ship_obj.order.order_code if ship_obj.order else "N/A"

    return ShipmentResponse(
        id=ship_obj.id,
        shipment_code=ship_obj.shipment_code,
        order_id=ship_obj.order_id,
        order_code=ord_code,
        customer_name=cust_name,
        delivery_days=ship_obj.delivery_days,
        status=ship_obj.status,
        is_delayed=is_delayed,
        created_at=ship_obj.created_at
    )

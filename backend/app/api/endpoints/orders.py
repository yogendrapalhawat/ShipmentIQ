from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from typing import Optional, List
from datetime import datetime
import math

from app.database.session import get_db
from app.schemas.schemas import OrderResponse, PaginatedResponse, OrderItemResponse
from app.models.models import Order, OrderItem, Customer, Product, Shipment
from app.core.config import settings

router = APIRouter()


@router.get("/orders", response_model=PaginatedResponse)
def get_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    sort_by: str = Query("order_date"),
    order: str = Query("desc"),
    db: Session = Depends(get_db)
):
    query = db.query(Order).outerjoin(Customer, Order.customer_id == Customer.id)\
                           .outerjoin(Shipment, Order.id == Shipment.order_id)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Order.order_code.ilike(search_pattern),
                Customer.name.ilike(search_pattern),
                Customer.customer_code.ilike(search_pattern)
            )
        )

    if status:
        query = query.filter(Shipment.status == status)

    if category:
        query = query.join(OrderItem, Order.id == OrderItem.order_id)\
                     .join(Product, OrderItem.product_id == Product.id)\
                     .filter(Product.category == category)

    if start_date:
        query = query.filter(Order.order_date >= datetime.strptime(start_date, "%Y-%m-%d"))
    if end_date:
        query = query.filter(Order.order_date <= datetime.strptime(end_date, "%Y-%m-%d"))

    total = query.distinct().count()

    # Sorting
    sort_col = getattr(Order, sort_by, Order.order_date)
    if order.lower() == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    orders_page = query.distinct().offset((page - 1) * page_size).limit(page_size).all()

    items = []
    threshold = settings.EXPECTED_DELIVERY_THRESHOLD_DAYS

    for o in orders_page:
        ship_status = o.shipment.status if o.shipment else "Pending"
        delivery_days = o.shipment.delivery_days if o.shipment else None
        is_delayed = (ship_status.lower() == "delayed") or (delivery_days is not None and delivery_days > threshold)

        item_responses = [
            OrderItemResponse(
                id=itm.id,
                product_id=itm.product_id,
                product_code=itm.product.product_code if itm.product else "N/A",
                product_name=itm.product.name if itm.product else "Unknown",
                quantity=itm.quantity,
                unit_price=itm.unit_price,
                total_price=itm.total_price
            )
            for itm in o.items
        ]

        items.append(OrderResponse(
            id=o.id,
            order_code=o.order_code,
            customer_id=o.customer_id,
            customer_name=o.customer.name if o.customer else "N/A",
            order_date=o.order_date,
            total_amount=o.total_amount,
            currency=o.currency,
            item_count=len(o.items),
            shipment_status=ship_status,
            delivery_days=delivery_days,
            is_delayed=is_delayed,
            items=item_responses,
            created_at=o.created_at
        ))

    pages = math.ceil(total / page_size) if total > 0 else 1

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages
    )


@router.get("/orders/{order_id}", response_model=OrderResponse)
def get_order_by_id(order_id: str, db: Session = Depends(get_db)):
    # Match integer DB ID or string order_code
    order_obj = None
    if order_id.isdigit():
        order_obj = db.query(Order).filter(Order.id == int(order_id)).first()
    if not order_obj:
        order_obj = db.query(Order).filter(Order.order_code == order_id).first()

    if not order_obj:
        raise HTTPException(status_code=404, detail="Order not found")

    threshold = settings.EXPECTED_DELIVERY_THRESHOLD_DAYS
    ship_status = order_obj.shipment.status if order_obj.shipment else "Pending"
    delivery_days = order_obj.shipment.delivery_days if order_obj.shipment else None
    is_delayed = (ship_status.lower() == "delayed") or (delivery_days is not None and delivery_days > threshold)

    item_responses = [
        OrderItemResponse(
            id=itm.id,
            product_id=itm.product_id,
            product_code=itm.product.product_code if itm.product else "N/A",
            product_name=itm.product.name if itm.product else "Unknown",
            quantity=itm.quantity,
            unit_price=itm.unit_price,
            total_price=itm.total_price
        )
        for itm in order_obj.items
    ]

    return OrderResponse(
        id=order_obj.id,
        order_code=order_obj.order_code,
        customer_id=order_obj.customer_id,
        customer_name=order_obj.customer.name if order_obj.customer else "N/A",
        order_date=order_obj.order_date,
        total_amount=order_obj.total_amount,
        currency=order_obj.currency,
        item_count=len(order_obj.items),
        shipment_status=ship_status,
        delivery_days=delivery_days,
        is_delayed=is_delayed,
        items=item_responses,
        created_at=order_obj.created_at
    )

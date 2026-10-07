from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, distinct
from typing import Optional
import math

from app.database.session import get_db
from app.schemas.schemas import ProductResponse, PaginatedResponse
from app.models.models import Product, OrderItem, Order

router = APIRouter()


@router.get("/products", response_model=PaginatedResponse)
def get_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Product)

    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Product.product_code.ilike(pattern),
                Product.name.ilike(pattern)
            )
        )

    if category:
        query = query.filter(Product.category == category)

    total = query.count()
    products_page = query.offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for p in products_page:
        # Aggregate order count & total revenue
        stats = db.query(
            func.count(distinct(OrderItem.order_id)),
            func.sum(OrderItem.total_price)
        ).filter(OrderItem.product_id == p.id).first()

        order_cnt = stats[0] or 0
        total_rev = float(stats[1] or 0.0)

        items.append(ProductResponse(
            id=p.id,
            product_code=p.product_code,
            name=p.name,
            category=p.category,
            price=p.price,
            order_count=order_cnt,
            total_revenue=round(total_rev, 2),
            created_at=p.created_at
        ))

    pages = math.ceil(total / page_size) if total > 0 else 1

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages
    )

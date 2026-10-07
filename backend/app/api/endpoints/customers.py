from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
import math

from app.database.session import get_db
from app.schemas.schemas import CustomerResponse, PaginatedResponse
from app.models.models import Customer

router = APIRouter()


@router.get("/customers", response_model=PaginatedResponse)
def get_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Customer)

    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Customer.customer_code.ilike(pattern),
                Customer.name.ilike(pattern)
            )
        )

    total = query.count()
    customers_page = query.offset((page - 1) * page_size).limit(page_size).all()

    items = [CustomerResponse.model_validate(c) for c in customers_page]
    pages = math.ceil(total / page_size) if total > 0 else 1

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages
    )

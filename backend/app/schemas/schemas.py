from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict


# Customer Schemas
class CustomerBase(BaseModel):
    customer_code: str
    name: str
    email: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Product Schemas
class ProductBase(BaseModel):
    product_code: str
    name: str
    category: str
    price: float


class ProductCreate(ProductBase):
    pass


class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    order_count: Optional[int] = 0
    total_revenue: Optional[float] = 0.0

    model_config = ConfigDict(from_attributes=True)


# Order Item Schemas
class OrderItemBase(BaseModel):
    product_id: Optional[int] = None
    product_code: Optional[str] = None
    product_name: Optional[str] = None
    quantity: int
    unit_price: float
    total_price: float


class OrderItemResponse(OrderItemBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# Order Schemas
class OrderBase(BaseModel):
    order_code: str
    order_date: datetime
    total_amount: float
    currency: str = "USD"


class OrderResponse(OrderBase):
    id: int
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    item_count: int = 0
    shipment_status: str = "Pending"
    delivery_days: Optional[int] = None
    is_delayed: bool = False
    items: List[OrderItemResponse] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Shipment Schemas
class ShipmentBase(BaseModel):
    shipment_code: str
    order_id: Optional[int] = None
    order_code: Optional[str] = None
    customer_name: Optional[str] = None
    delivery_days: int
    status: str


class ShipmentResponse(ShipmentBase):
    id: int
    is_delayed: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Dashboard Summary & Analytics Schemas
class DashboardSummary(BaseModel):
    total_orders: int
    total_revenue: float
    converted_revenue: float
    currency: str
    exchange_rate: float
    delayed_orders: int
    delivered_orders: int
    in_transit_orders: int
    pending_orders: int
    avg_order_value: float
    avg_delivery_days: float
    dataset_last_updated: Optional[datetime] = None


class TrendPoint(BaseModel):
    date: str
    revenue: float
    orders: int


class CategoryRevenue(BaseModel):
    category: str
    revenue: float
    order_count: int
    percentage: float


class DeliveryPerformance(BaseModel):
    status: str
    count: int
    percentage: float


class CurrencyOption(BaseModel):
    code: str
    name: str
    symbol: Optional[str] = ""
    rate_to_usd: float


class IngestPreviewResponse(BaseModel):
    filename: str
    file_type: str
    valid_records_count: int
    rejected_records_count: int
    warnings: List[str]
    sample_records: List[Dict[str, Any]]
    deduplication_summary: str


class IngestCommitResponse(BaseModel):
    job_id: int
    filename: str
    status: str
    imported_count: int
    rejected_count: int
    warnings: List[str]
    message: str


class ImportJobResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    status: str
    imported_count: int
    rejected_count: int
    warnings: Optional[List[str]] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    pages: int

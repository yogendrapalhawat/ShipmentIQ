from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from sqlalchemy import func, distinct, or_
from sqlalchemy.orm import Session
from app.models.models import Order, OrderItem, Product, Customer, Shipment, ImportJob
from app.core.config import settings
from app.services.currency_service import CurrencyService


class AnalyticsService:
    @staticmethod
    async def get_dashboard_summary(
        db: Session,
        target_currency: str = "USD",
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        category: Optional[str] = None,
        status: Optional[str] = None
    ) -> Dict[str, Any]:

        query = db.query(Order).outerjoin(Shipment, Order.id == Shipment.order_id)

        if start_date:
            query = query.filter(Order.order_date >= start_date)
        if end_date:
            query = query.filter(Order.order_date <= end_date)
        if status:
            query = query.filter(Shipment.status == status)

        if category:
            query = query.join(OrderItem, Order.id == OrderItem.order_id)\
                         .join(Product, OrderItem.product_id == Product.id)\
                         .filter(Product.category == category)

        orders = query.distinct().all()

        total_orders = len(orders)
        total_revenue = sum(o.total_amount for o in orders)

        # Currency conversion
        conversion = await CurrencyService.convert_amount(total_revenue, "USD", target_currency)
        converted_revenue = conversion["converted_amount"]
        exchange_rate = conversion["exchange_rate"]

        avg_order_value = round(total_revenue / total_orders, 2) if total_orders > 0 else 0.0

        # Shipment metrics
        delivered_count = 0
        delayed_count = 0
        in_transit_count = 0
        pending_count = 0
        total_delivery_days = 0
        shipments_with_days = 0

        threshold = settings.EXPECTED_DELIVERY_THRESHOLD_DAYS

        for o in orders:
            ship = o.shipment
            if ship:
                st = ship.status.lower()
                if st == "delivered":
                    delivered_count += 1
                elif st == "delayed":
                    delayed_count += 1
                elif st == "in transit":
                    in_transit_count += 1
                else:
                    pending_count += 1

                # Check delayed condition
                if st != "delayed" and ship.delivery_days > threshold:
                    delayed_count += 1

                if ship.delivery_days > 0:
                    total_delivery_days += ship.delivery_days
                    shipments_with_days += 1
            else:
                pending_count += 1

        avg_delivery_days = round(total_delivery_days / shipments_with_days, 1) if shipments_with_days > 0 else 0.0

        last_job = db.query(ImportJob).order_by(ImportJob.created_at.desc()).first()
        dataset_last_updated = last_job.created_at if last_job else datetime.utcnow()

        return {
            "total_orders": total_orders,
            "total_revenue": round(total_revenue, 2),
            "converted_revenue": round(converted_revenue, 2),
            "currency": target_currency,
            "exchange_rate": exchange_rate,
            "delayed_orders": delayed_count,
            "delivered_orders": delivered_count,
            "in_transit_orders": in_transit_count,
            "pending_orders": pending_count,
            "avg_order_value": avg_order_value,
            "avg_delivery_days": avg_delivery_days,
            "dataset_last_updated": dataset_last_updated
        }

    @staticmethod
    def get_revenue_trend(
        db: Session,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        group_by: str = "day"
    ) -> List[Dict[str, Any]]:

        query = db.query(Order)
        if start_date:
            query = query.filter(Order.order_date >= start_date)
        if end_date:
            query = query.filter(Order.order_date <= end_date)

        orders = query.order_by(Order.order_date.asc()).all()

        trend_dict: Dict[str, Dict[str, Any]] = {}

        for o in orders:
            dt_str = o.order_date.strftime("%Y-%m-%d")
            if dt_str not in trend_dict:
                trend_dict[dt_str] = {"date": dt_str, "revenue": 0.0, "orders": 0}
            trend_dict[dt_str]["revenue"] += o.total_amount
            trend_dict[dt_str]["orders"] += 1

        results = []
        for key in sorted(trend_dict.keys()):
            results.append({
                "date": key,
                "revenue": round(trend_dict[key]["revenue"], 2),
                "orders": trend_dict[key]["orders"]
            })

        return results

    @staticmethod
    def get_category_revenue(db: Session) -> List[Dict[str, Any]]:
        results = db.query(
            Product.category,
            func.sum(OrderItem.total_price).label("revenue"),
            func.count(distinct(Order.id)).label("order_count")
        ).join(OrderItem, Product.id == OrderItem.product_id)\
         .join(Order, OrderItem.order_id == Order.id)\
         .group_by(Product.category).all()

        total_cat_revenue = sum(r[1] or 0.0 for r in results)

        categories = []
        for row in results:
            cat_name = row[0] or "Uncategorized"
            rev = row[1] or 0.0
            cnt = row[2] or 0
            pct = round((rev / total_cat_revenue * 100), 1) if total_cat_revenue > 0 else 0.0

            categories.append({
                "category": cat_name,
                "revenue": round(rev, 2),
                "order_count": cnt,
                "percentage": pct
            })

        return sorted(categories, key=lambda x: x["revenue"], reverse=True)

    @staticmethod
    def get_delivery_performance(db: Session) -> List[Dict[str, Any]]:
        threshold = settings.EXPECTED_DELIVERY_THRESHOLD_DAYS
        shipments = db.query(Shipment).all()

        total = len(shipments)
        if total == 0:
            return []

        counts = {"Delivered": 0, "Delayed": 0, "In Transit": 0, "Pending": 0}

        for s in shipments:
            st = s.status
            if st == "Delivered":
                if s.delivery_days > threshold:
                    counts["Delayed"] += 1
                else:
                    counts["Delivered"] += 1
            elif st == "Delayed":
                counts["Delayed"] += 1
            elif st == "In Transit":
                counts["In Transit"] += 1
            else:
                counts["Pending"] += 1

        res = []
        for status_name, cnt in counts.items():
            res.append({
                "status": status_name,
                "count": cnt,
                "percentage": round((cnt / total * 100), 1) if total > 0 else 0.0
            })

        return res

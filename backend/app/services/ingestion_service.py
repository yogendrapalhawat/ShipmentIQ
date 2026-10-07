import json
import xml.etree.ElementTree as ET
import pandas as pd
import io
from datetime import datetime
from typing import Dict, List, Tuple, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import Order, OrderItem, Customer, Product, Shipment, ImportJob


class IngestionService:
    @staticmethod
    def parse_json_data(content: bytes) -> Tuple[List[Dict[str, Any]], List[str]]:
        warnings = []
        parsed_orders = []

        try:
            data = json.loads(content.decode("utf-8"))
        except Exception as e:
            raise ValueError(f"Invalid JSON format: {str(e)}")

        orders_raw = data.get("orders") if isinstance(data, dict) and "orders" in data else data
        if not isinstance(orders_raw, list):
            orders_raw = [orders_raw]

        for idx, item in enumerate(orders_raw):
            if not isinstance(item, dict):
                warnings.append(f"Skipped item at index {idx}: Not a JSON object")
                continue

            order_id = str(item.get("order_id") or item.get("id") or f"ORD-{idx+1}").strip()
            order_date_raw = item.get("order_date") or item.get("date")
            try:
                order_date = datetime.strptime(str(order_date_raw).strip(), "%Y-%m-%d") if order_date_raw else datetime.utcnow()
            except Exception:
                order_date = datetime.utcnow()
                warnings.append(f"Order {order_id}: Invalid date format '{order_date_raw}', defaulted to current time.")

            cust_data = item.get("customer", {})
            if isinstance(cust_data, str):
                cust_code = f"CUST-{cust_data[:5].upper()}"
                cust_name = cust_data
            elif isinstance(cust_data, dict):
                cust_code = str(cust_data.get("id") or f"CUST-{idx+1}").strip()
                cust_name = str(cust_data.get("name") or "Unknown Customer").strip()
            else:
                cust_code = f"CUST-{idx+1}"
                cust_name = "Unknown Customer"

            items_raw = item.get("items") or item.get("line_items") or []
            if not isinstance(items_raw, list):
                items_raw = [items_raw]

            parsed_items = []
            calculated_total = 0.0

            for i_idx, itm in enumerate(items_raw):
                if not isinstance(itm, dict):
                    continue
                p_code = str(itm.get("product_id") or itm.get("item_id") or f"PROD-{i_idx+1}").strip()
                p_name = str(itm.get("product_name") or itm.get("name") or f"Product {p_code}").strip()
                p_cat = str(itm.get("category") or "Uncategorized").strip()

                try:
                    qty = int(itm.get("qty") or itm.get("quantity") or 1)
                    if qty <= 0:
                        qty = 1
                        warnings.append(f"Order {order_id}, Product {p_code}: Invalid quantity, set to 1.")
                except Exception:
                    qty = 1

                try:
                    price = float(itm.get("price") or itm.get("unit_price") or 0.0)
                    if price < 0:
                        price = 0.0
                        warnings.append(f"Order {order_id}, Product {p_code}: Negative price set to 0.0.")
                except Exception:
                    price = 0.0

                line_total = round(qty * price, 2)
                calculated_total += line_total

                parsed_items.append({
                    "product_code": p_code,
                    "product_name": p_name,
                    "category": p_cat,
                    "quantity": qty,
                    "unit_price": price,
                    "total_price": line_total
                })

            parsed_orders.append({
                "order_code": order_id,
                "order_date": order_date,
                "customer_code": cust_code,
                "customer_name": cust_name,
                "total_amount": round(calculated_total, 2),
                "items": parsed_items
            })

        return parsed_orders, warnings

    @staticmethod
    def parse_xml_data(content: bytes) -> Tuple[List[Dict[str, Any]], List[str]]:
        warnings = []
        parsed_shipments = []

        try:
            root = ET.fromstring(content.decode("utf-8"))
        except Exception as e:
            raise ValueError(f"Invalid XML format: {str(e)}")

        shipment_nodes = root.findall(".//shipment") if root.tag != "shipment" else [root]
        if not shipment_nodes:
            shipment_nodes = list(root)

        for idx, elem in enumerate(shipment_nodes):
            shipment_id = elem.findtext("shipment_id") or elem.findtext("id") or f"S{idx+1:03d}"
            order_id = elem.findtext("order_id") or elem.findtext("order") or ""
            delivery_days_raw = elem.findtext("delivery_days") or elem.findtext("days") or "0"
            status = elem.findtext("status") or "Pending"

            try:
                delivery_days = int(delivery_days_raw.strip())
                if delivery_days < 0:
                    delivery_days = 0
            except Exception:
                delivery_days = 0
                warnings.append(f"Shipment {shipment_id}: Invalid delivery_days '{delivery_days_raw}', defaulted to 0.")

            parsed_shipments.append({
                "shipment_code": shipment_id.strip(),
                "order_code": order_id.strip(),
                "delivery_days": delivery_days,
                "status": status.strip()
            })

        return parsed_shipments, warnings

    @staticmethod
    def parse_csv_data(content: bytes) -> Tuple[List[Dict[str, Any]], List[str]]:
        warnings = []
        parsed_products = []

        try:
            df = pd.read_csv(io.BytesIO(content))
        except Exception as e:
            raise ValueError(f"Invalid CSV format: {str(e)}")

        df.columns = [str(c).strip().lower() for c in df.columns]

        for idx, row in df.iterrows():
            p_code = str(row.get("product_id") or row.get("id") or row.get("code") or f"P{idx+1:03d}").strip()
            p_name = str(row.get("product_name") or row.get("name") or f"Product {p_code}").strip()
            category = str(row.get("category") or "Uncategorized").strip()

            try:
                price = float(row.get("price") or row.get("unit_price") or 0.0)
                if price < 0:
                    price = 0.0
            except Exception:
                price = 0.0
                warnings.append(f"Product {p_code}: Invalid price '{row.get('price')}', defaulted to 0.0")

            parsed_products.append({
                "product_code": p_code,
                "name": p_name,
                "category": category,
                "price": price
            })

        return parsed_products, warnings

    @staticmethod
    def commit_parsed_data(db: Session, file_type: str, data: List[Dict[str, Any]], filename: str) -> ImportJob:
        imported_count = 0
        rejected_count = 0
        all_warnings = []

        if file_type.lower() == "json":
            for ord_data in data:
                try:
                    # Upsert Customer
                    cust = db.query(Customer).filter_by(customer_code=ord_data["customer_code"]).first()
                    if not cust:
                        cust = Customer(
                            customer_code=ord_data["customer_code"],
                            name=ord_data["customer_name"]
                        )
                        db.add(cust)
                        db.flush()

                    # Check existing order for deduplication
                    existing_order = db.query(Order).filter_by(order_code=ord_data["order_code"]).first()
                    if existing_order:
                        # Overwrite existing order items
                        db.query(OrderItem).filter_by(order_id=existing_order.id).delete()
                        order_obj = existing_order
                        order_obj.customer_id = cust.id
                        order_obj.order_date = ord_data["order_date"]
                        order_obj.total_amount = ord_data["total_amount"]
                    else:
                        order_obj = Order(
                            order_code=ord_data["order_code"],
                            customer_id=cust.id,
                            order_date=ord_data["order_date"],
                            total_amount=ord_data["total_amount"],
                            currency="USD"
                        )
                        db.add(order_obj)
                        db.flush()

                    # Add Items
                    for item in ord_data["items"]:
                        product = db.query(Product).filter_by(product_code=item["product_code"]).first()
                        if not product:
                            product = Product(
                                product_code=item["product_code"],
                                name=item["product_name"],
                                category=item["category"],
                                price=item["unit_price"]
                            )
                            db.add(product)
                            db.flush()

                        order_item = OrderItem(
                            order_id=order_obj.id,
                            product_id=product.id,
                            quantity=item["quantity"],
                            unit_price=item["unit_price"],
                            total_price=item["total_price"]
                        )
                        db.add(order_item)

                    imported_count += 1
                except Exception as e:
                    rejected_count += 1
                    all_warnings.append(f"Failed to import order {ord_data.get('order_code')}: {str(e)}")

        elif file_type.lower() == "xml":
            for ship_data in data:
                try:
                    order_obj = None
                    if ship_data["order_code"]:
                        order_obj = db.query(Order).filter_by(order_code=ship_data["order_code"]).first()

                    existing_shipment = db.query(Shipment).filter_by(shipment_code=ship_data["shipment_code"]).first()
                    if existing_shipment:
                        existing_shipment.order_id = order_obj.id if order_obj else None
                        existing_shipment.delivery_days = ship_data["delivery_days"]
                        existing_shipment.status = ship_data["status"]
                    else:
                        shipment_obj = Shipment(
                            shipment_code=ship_data["shipment_code"],
                            order_id=order_obj.id if order_obj else None,
                            delivery_days=ship_data["delivery_days"],
                            status=ship_data["status"]
                        )
                        db.add(shipment_obj)

                    imported_count += 1
                except Exception as e:
                    rejected_count += 1
                    all_warnings.append(f"Failed to import shipment {ship_data.get('shipment_code')}: {str(e)}")

        elif file_type.lower() == "csv":
            for prod_data in data:
                try:
                    existing_prod = db.query(Product).filter_by(product_code=prod_data["product_code"]).first()
                    if existing_prod:
                        existing_prod.name = prod_data["name"]
                        existing_prod.category = prod_data["category"]
                        existing_prod.price = prod_data["price"]
                    else:
                        prod_obj = Product(
                            product_code=prod_data["product_code"],
                            name=prod_data["name"],
                            category=prod_data["category"],
                            price=prod_data["price"]
                        )
                        db.add(prod_obj)
                    imported_count += 1
                except Exception as e:
                    rejected_count += 1
                    all_warnings.append(f"Failed to import product {prod_data.get('product_code')}: {str(e)}")

        db.commit()

        import_job = ImportJob(
            filename=filename,
            file_type=file_type,
            status="Completed" if rejected_count == 0 else "Completed with Warnings",
            imported_count=imported_count,
            rejected_count=rejected_count,
            warnings=all_warnings
        )
        db.add(import_job)
        db.commit()
        db.refresh(import_job)

        return import_job

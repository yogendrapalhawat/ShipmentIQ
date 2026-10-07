import pytest
from app.services.ingestion_service import IngestionService

SAMPLE_JSON = b"""
{
  "orders": [
    {
      "order_id": "1001",
      "customer": {"id": "C001", "name": "Rahul"},
      "items": [
        {"product_id": "P101", "qty": 2, "price": 500},
        {"product_id": "P102", "qty": 1, "price": 1200}
      ],
      "order_date": "2024-01-01"
    },
    {
      "order_id": "1002",
      "customer": {"id": "C002", "name": "Anita"},
      "items": [
        {"product_id": "P103", "qty": 3, "price": 200}
      ],
      "order_date": "2024-01-02"
    }
  ]
}
"""

SAMPLE_XML = b"""<shipments>
  <shipment>
    <shipment_id>S001</shipment_id>
    <order_id>1001</order_id>
    <delivery_days>3</delivery_days>
    <status>Delivered</status>
  </shipment>
  <shipment>
    <shipment_id>S002</shipment_id>
    <order_id>1002</order_id>
    <delivery_days>7</delivery_days>
    <status>Delayed</status>
  </shipment>
</shipments>
"""

SAMPLE_CSV = b"""product_id,product_name,category,price
P101,Wireless Mouse,Electronics,500
P102,Mechanical Keyboard,Electronics,1200
P103,Coffee Mug,Home & Kitchen,200
"""


def test_json_parsing_and_sample_totals():
    parsed_orders, warnings = IngestionService.parse_json_data(SAMPLE_JSON)
    assert len(parsed_orders) == 2

    order1001 = next(o for o in parsed_orders if o["order_code"] == "1001")
    order1002 = next(o for o in parsed_orders if o["order_code"] == "1002")

    # Order 1001 total must equal 2200
    assert order1001["total_amount"] == 2200.0
    # Order 1002 total must equal 600
    assert order1002["total_amount"] == 600.0
    # Combined total must equal 2800
    combined_total = sum(o["total_amount"] for o in parsed_orders)
    assert combined_total == 2800.0


def test_xml_parsing():
    parsed_shipments, warnings = IngestionService.parse_xml_data(SAMPLE_XML)
    assert len(parsed_shipments) == 2
    assert parsed_shipments[0]["shipment_code"] == "S001"
    assert parsed_shipments[0]["status"] == "Delivered"
    assert parsed_shipments[1]["shipment_code"] == "S002"
    assert parsed_shipments[1]["status"] == "Delayed"


def test_csv_parsing():
    parsed_products, warnings = IngestionService.parse_csv_data(SAMPLE_CSV)
    assert len(parsed_products) == 3
    assert parsed_products[0]["product_code"] == "P101"
    assert parsed_products[0]["price"] == 500.0

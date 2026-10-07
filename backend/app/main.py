import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.core.config import settings
from app.database.session import Base, engine, SessionLocal
from app.api.endpoints import health, dashboard, analytics, orders, shipments, products, customers, ingest
from app.services.ingestion_service import IngestionService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("shipmentiq")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Database Tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        from app.models.models import Order
        if db.query(Order).count() == 0:
            logger.info("Database empty. Auto-ingesting sample files...")
            sample_dir = os.path.join(os.path.dirname(__file__), "..", "data", "samples")

            csv_path = os.path.join(sample_dir, "Products.csv")
            if os.path.exists(csv_path):
                with open(csv_path, "rb") as f:
                    parsed_prod, _ = IngestionService.parse_csv_data(f.read())
                    IngestionService.commit_parsed_data(db, "csv", parsed_prod, "Products.csv")

            json_path = os.path.join(sample_dir, "Orders.json")
            if os.path.exists(json_path):
                with open(json_path, "rb") as f:
                    parsed_ord, _ = IngestionService.parse_json_data(f.read())
                    IngestionService.commit_parsed_data(db, "json", parsed_ord, "Orders.json")

            xml_path = os.path.join(sample_dir, "Shipment.xml")
            if os.path.exists(xml_path):
                with open(xml_path, "rb") as f:
                    parsed_ship, _ = IngestionService.parse_xml_data(f.read())
                    IngestionService.commit_parsed_data(db, "xml", parsed_ship, "Shipment.xml")

            logger.info("Sample data successfully ingested!")
    except Exception as e:
        logger.error(f"Failed to auto-seed sample data: {e}")
    finally:
        db.close()

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=settings.API_V1_STR, tags=["Health"])
app.include_router(dashboard.router, prefix=settings.API_V1_STR, tags=["Dashboard"])
app.include_router(analytics.router, prefix=settings.API_V1_STR, tags=["Analytics"])
app.include_router(orders.router, prefix=settings.API_V1_STR, tags=["Orders"])
app.include_router(shipments.router, prefix=settings.API_V1_STR, tags=["Shipments"])
app.include_router(products.router, prefix=settings.API_V1_STR, tags=["Products"])
app.include_router(customers.router, prefix=settings.API_V1_STR, tags=["Customers"])
app.include_router(ingest.router, prefix=settings.API_V1_STR, tags=["Ingestion"])


@app.get("/")
def root():
    return {
        "message": "Welcome to ShipmentIQ API Services",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }

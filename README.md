# ShipmentIQ — Order & Delivery Analytics Platform

**ShipmentIQ** is a full-stack, enterprise-grade order and delivery logistics analytics SaaS platform built with FastAPI (Python) and React (Vite). It ingests multi-format data (JSON, XML, CSV, Excel), flattens nested schemas, normalizes IDs, executes complex analytics transformations, converts currencies in real-time via external APIs, and presents actionable logistics insights through a modern dashboard.

---

## 🌟 Key Features

- **Multi-Format Ingestion Engine**: Support for uploading and parsing `JSON` (nested order/item structures), `XML` (`Shipment.xml`), `CSV` (`Products.csv`), and `Excel` (`.xlsx`) files with safe validation, previewing, warnings, and atomic database commits.
- **Dynamic Analytics Dashboard**: Modern enterprise SaaS UI featuring interactive KPIs, revenue trends, order volumes, category-wise revenue distribution, delivery status performance, and view toggling (Revenue vs. Orders).
- **Interactive Global Filters**: Filter analytics and table records seamlessly by date range, product category, shipment status, and target currency.
- **External Currency Integration**: Live integration with REST Countries and Exchange Rate APIs with cached rates, fallback currency tables, and target currency selection.
- **Order Management & Detail Inspection**: Comprehensive table views with pagination, global search, column sorting, status badges, and itemized order detail breakdowns.
- **Shipment Tracking**: Fulfillment status breakdown (`Delivered`, `Delayed`, `In Transit`, `Pending`) with configurable delivery delay thresholds.
- **CSV Data Export**: Export filtered order datasets directly to CSV.

---

## 🛠️ Technology Stack

### Backend
- **Python 3.11+**
- **FastAPI** (REST API Framework with automatic Swagger OpenAPI docs)
- **SQLAlchemy ORM** (Database ORM with SQLite backend)
- **Pydantic v2** (Data validation & serialization)
- **Pandas & openpyxl** (CSV / Excel data manipulation)
- **xml.etree.ElementTree** (Safe XML parsing)
- **httpx** (Async HTTP client for external API requests)
- **pytest** (Automated backend test suite)

### Frontend
- **React 18** (Vite build tool)
- **React Router DOM v6** (Client-side routing)
- **Axios** (API HTTP Client)
- **Recharts** (Interactive SVG chart visualizations)
- **Lucide React** (Modern SVG iconography)
- **React Context API** (Global state management)
- **CSS Variables & Grid/Flexbox** (Clean, custom SaaS UI design system without Tailwind dependency)

---

## 📁 Project Structure

```
ShipmentIQ/
  frontend/
    src/
      api/          # Axios HTTP client configuration
      assets/       # Static media assets
      components/   # Reusable UI components (Sidebar, Topbar, StatCard, ChartCard, etc.)
      context/      # Global React Context API (AppContext)
      layouts/      # AppLayout shell
      pages/        # Dashboard, Orders, OrderDetail, Shipments, Products, Analytics, Imports, Settings
      styles/       # CSS Variables, global stylesheet, component & layout styles
      App.jsx       # Route definitions
      main.jsx      # React mounting entry point
    public/
    package.json
    vite.config.js
    .env.example
  backend/
    app/
      api/          # REST API route handlers (/ingest, /dashboard, /analytics, /orders, etc.)
      core/         # Config and environment settings
      database/     # SQLAlchemy engine, session maker, DB dependency
      models/       # SQLAlchemy ORM models (Customer, Product, Order, OrderItem, Shipment, ImportJob)
      schemas/      # Pydantic v2 request/response schemas
      services/     # Ingestion, Analytics, and Currency service logic
      main.py       # FastAPI application entry point & startup seeder
    data/
      samples/      # Orders.json, Shipment.xml, Products.csv, Hit External API.xlsx
    tests/          # Pytest backend test suite
    requirements.txt
    .env.example
  README.md
  .gitignore
```

---

## 🚀 Setup & Execution Guide

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** & **npm**

---

### 1. Backend Setup & Run

Navigate to the `backend` directory:
```powershell
cd backend
```

Create and activate a virtual environment (optional but recommended):
```powershell
python -m venv venv
.\venv\Scripts\activate
```

Install dependencies:
```powershell
python -m pip install -r requirements.txt
```

Run the backend API server:
```powershell
python -m uvicorn app.main:app --reload --port 8000
```
- **API Base URL**: `http://127.0.0.1:8000`
- **Swagger Documentation**: `http://127.0.0.1:8000/docs`
- **Health Check Endpoint**: `http://127.0.0.1:8000/api/v1/health`

---

### 2. Frontend Setup & Run

In a separate terminal window, navigate to the `frontend` directory:
```powershell
cd frontend
```

Install npm dependencies:
```powershell
npm install
```

Start the Vite dev server:
```powershell
npm run dev
```
- **Frontend Dashboard URL**: `http://localhost:3000` (or `http://localhost:5173`)

---

## 🧪 Running Backend Tests

Run the automated pytest suite from `backend`:
```powershell
python -m pytest tests/
```

### Verified Sample Calculations
The test suite explicitly verifies the calculations on the provided sample dataset:
- **Order 1001 Total**: `(2 × 500) + (1 × 1200) = 2,200`
- **Order 1002 Total**: `(3 × 200) = 600`
- **Combined Sample Total**: `2,800` (Original source currency)

---

## 📡 API Reference & Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service health status check |
| `GET` | `/api/v1/dashboard/summary` | Aggregated dashboard KPI summary |
| `GET` | `/api/v1/analytics/revenue` | Revenue and order volume trend timeline |
| `GET` | `/api/v1/analytics/categories` | Category-wise revenue performance |
| `GET` | `/api/v1/analytics/delivery-performance` | Delivered vs. Delayed vs. Pending status share |
| `GET` | `/api/v1/orders` | Paginated orders list with search & filter |
| `GET` | `/api/v1/orders/{order_id}` | Itemized order breakdown and shipment info |
| `GET` | `/api/v1/shipments` | Paginated shipments tracker |
| `GET` | `/api/v1/products` | Product catalog performance |
| `GET` | `/api/v1/customers` | Customer list |
| `POST` | `/api/v1/ingest/json` | Ingest nested JSON orders file |
| `POST` | `/api/v1/ingest/xml` | Ingest XML shipment records |
| `POST` | `/api/v1/ingest/csv` | Ingest CSV product catalog |
| `POST` | `/api/v1/ingest/preview` | File upload preview & validation check |
| `POST` | `/api/v1/ingest/commit` | Final commit of parsed records to database |
| `GET` | `/api/v1/analytics/export` | Download filtered order dataset as CSV |

---

## 📸 Screenshots

*(Run the application locally at `http://localhost:3000` to interact with the live dashboard).*

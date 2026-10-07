from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from app.database.session import get_db
from app.services.ingestion_service import IngestionService
from app.schemas.schemas import IngestPreviewResponse, IngestCommitResponse, ImportJobResponse
from app.models.models import ImportJob

router = APIRouter()


@router.post("/ingest/json")
async def ingest_json(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith(".json"):
        raise HTTPException(status_code=400, detail="File must be a JSON file")

    content = await file.read()
    parsed_data, warnings = IngestionService.parse_json_data(content)
    job = IngestionService.commit_parsed_data(db, "json", parsed_data, file.filename)

    return IngestCommitResponse(
        job_id=job.id,
        filename=file.filename,
        status=job.status,
        imported_count=job.imported_count,
        rejected_count=job.rejected_count,
        warnings=job.warnings or [],
        message=f"Successfully processed {job.imported_count} orders from JSON."
    )


@router.post("/ingest/xml")
async def ingest_xml(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith(".xml"):
        raise HTTPException(status_code=400, detail="File must be an XML file")

    content = await file.read()
    parsed_data, warnings = IngestionService.parse_xml_data(content)
    job = IngestionService.commit_parsed_data(db, "xml", parsed_data, file.filename)

    return IngestCommitResponse(
        job_id=job.id,
        filename=file.filename,
        status=job.status,
        imported_count=job.imported_count,
        rejected_count=job.rejected_count,
        warnings=job.warnings or [],
        message=f"Successfully processed {job.imported_count} shipments from XML."
    )


@router.post("/ingest/csv")
async def ingest_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV file")

    content = await file.read()
    parsed_data, warnings = IngestionService.parse_csv_data(content)
    job = IngestionService.commit_parsed_data(db, "csv", parsed_data, file.filename)

    return IngestCommitResponse(
        job_id=job.id,
        filename=file.filename,
        status=job.status,
        imported_count=job.imported_count,
        rejected_count=job.rejected_count,
        warnings=job.warnings or [],
        message=f"Successfully processed {job.imported_count} products from CSV."
    )


@router.post("/ingest/excel")
async def ingest_excel(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not (file.filename.lower().endswith(".xlsx") or file.filename.lower().endswith(".xls")):
        raise HTTPException(status_code=400, detail="File must be an Excel file")

    content = await file.read()
    # Read Excel products or orders using pandas
    try:
        import pandas as pd
        import io
        df = pd.read_excel(io.BytesIO(content))
        content_csv = df.to_csv(index=False).encode("utf-8")
        parsed_data, warnings = IngestionService.parse_csv_data(content_csv)
        job = IngestionService.commit_parsed_data(db, "csv", parsed_data, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process Excel file: {str(e)}")

    return IngestCommitResponse(
        job_id=job.id,
        filename=file.filename,
        status=job.status,
        imported_count=job.imported_count,
        rejected_count=job.rejected_count,
        warnings=job.warnings or [],
        message=f"Successfully processed {job.imported_count} records from Excel."
    )


@router.post("/ingest/preview", response_model=IngestPreviewResponse)
async def preview_ingest(file: UploadFile = File(...)):
    filename = file.filename.lower()
    content = await file.read()

    parsed_data = []
    warnings = []
    file_type = "unknown"

    if filename.endswith(".json"):
        file_type = "json"
        parsed_data, warnings = IngestionService.parse_json_data(content)
    elif filename.endswith(".xml"):
        file_type = "xml"
        parsed_data, warnings = IngestionService.parse_xml_data(content)
    elif filename.endswith(".csv"):
        file_type = "csv"
        parsed_data, warnings = IngestionService.parse_csv_data(content)
    elif filename.endswith(".xlsx") or filename.endswith(".xls"):
        file_type = "excel"
        import pandas as pd
        import io
        df = pd.read_excel(io.BytesIO(content))
        content_csv = df.to_csv(index=False).encode("utf-8")
        parsed_data, warnings = IngestionService.parse_csv_data(content_csv)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format")

    sample_records = parsed_data[:5] if len(parsed_data) >= 5 else parsed_data

    # Format datetime for JSON serialization in sample_records
    formatted_samples = []
    for rec in sample_records:
        rec_copy = dict(rec)
        if "order_date" in rec_copy and hasattr(rec_copy["order_date"], "isoformat"):
            rec_copy["order_date"] = rec_copy["order_date"].isoformat()
        formatted_samples.append(rec_copy)

    return IngestPreviewResponse(
        filename=file.filename,
        file_type=file_type,
        valid_records_count=len(parsed_data),
        rejected_records_count=0,
        warnings=warnings,
        sample_records=formatted_samples,
        deduplication_summary=f"Parsed {len(parsed_data)} records ready for import. Existing records will be updated safely."
    )


@router.post("/ingest/commit", response_model=IngestCommitResponse)
async def commit_ingest(file: UploadFile = File(...), db: Session = Depends(get_db)):
    filename = file.filename.lower()
    content = await file.read()

    if filename.endswith(".json"):
        parsed_data, _ = IngestionService.parse_json_data(content)
        job = IngestionService.commit_parsed_data(db, "json", parsed_data, file.filename)
    elif filename.endswith(".xml"):
        parsed_data, _ = IngestionService.parse_xml_data(content)
        job = IngestionService.commit_parsed_data(db, "xml", parsed_data, file.filename)
    elif filename.endswith(".csv"):
        parsed_data, _ = IngestionService.parse_csv_data(content)
        job = IngestionService.commit_parsed_data(db, "csv", parsed_data, file.filename)
    elif filename.endswith(".xlsx") or filename.endswith(".xls"):
        import pandas as pd
        import io
        df = pd.read_excel(io.BytesIO(content))
        content_csv = df.to_csv(index=False).encode("utf-8")
        parsed_data, _ = IngestionService.parse_csv_data(content_csv)
        job = IngestionService.commit_parsed_data(db, "csv", parsed_data, file.filename)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format")

    return IngestCommitResponse(
        job_id=job.id,
        filename=file.filename,
        status=job.status,
        imported_count=job.imported_count,
        rejected_count=job.rejected_count,
        warnings=job.warnings or [],
        message=f"Commit completed. {job.imported_count} records imported."
    )


@router.get("/imports", response_model=List[ImportJobResponse])
def get_import_history(db: Session = Depends(get_db)):
    jobs = db.query(ImportJob).order_by(ImportJob.created_at.desc()).limit(50).all()
    return jobs

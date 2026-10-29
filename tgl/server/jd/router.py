"""FastAPI routes for Role 1: JD Analytics."""

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from . import store
from .document_loader import SUPPORTED_EXTENSIONS, UnsupportedDocumentError, extract_text
from .llm_extractor import LlmUnavailable, llm_available, llm_label
from .models import AnalyzeTextRequest, EngineName, JdAnalysis, JdSkillListContract
from .pipeline import analyze_jd, to_contract

router = APIRouter(prefix="/api/jd", tags=["Role 1: JD Analytics"])

MAX_UPLOAD_BYTES = 10 * 1024 * 1024


def _run(text: str, source_file: str, engine: EngineName, company=None, role=None) -> JdAnalysis:
    try:
        analysis = analyze_jd(text, source_file, engine, company, role)
    except LlmUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    store.save_analysis(analysis)
    store.set_active(analysis.id)
    return analysis


@router.get("/engine")
def engine_status():
    return {
        "llm_available": llm_available(),
        "llm_model": llm_label(),
        "rules_available": True,
        "default_engine": "llm+rules" if llm_available() else "rules",
        "supported_formats": sorted(SUPPORTED_EXTENSIONS),
    }


@router.get("/samples")
def get_samples():
    return {"samples": store.list_samples()}


@router.post("/samples/{sample_id}/analyze", response_model=JdAnalysis)
def analyze_sample(sample_id: str, engine: EngineName = "auto"):
    path = store.read_sample(sample_id)
    if path is None:
        raise HTTPException(status_code=404, detail=f"Sample JD '{sample_id}' not found.")
    text = store.read_sample_text(sample_id)
    return _run(text, path.name, engine)


@router.post("/analyze", response_model=JdAnalysis)
async def analyze_upload(
    file: UploadFile = File(...),
    engine: EngineName = Form("auto"),
    company: str = Form(None),
    role: str = Form(None),
):
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File is larger than 10 MB.")
    try:
        text = extract_text(file.filename or "upload", data)
    except UnsupportedDocumentError as exc:
        raise HTTPException(status_code=415, detail=str(exc))
    except Exception as exc:  # corrupt PDF/DOCX
        raise HTTPException(status_code=422, detail=f"Could not read '{file.filename}': {exc}")
    return _run(text, file.filename or "upload", engine, company or None, role or None)


@router.post("/analyze-text", response_model=JdAnalysis)
def analyze_text(body: AnalyzeTextRequest):
    from .document_loader import normalize_text

    return _run(normalize_text(body.text), body.source_file or "pasted_jd.txt", body.engine, body.company, body.role)


@router.get("/extractions")
def get_extractions():
    return {"extractions": store.list_analyses()}


@router.get("/extractions/{analysis_id}", response_model=JdAnalysis)
def get_extraction(analysis_id: str):
    analysis = store.load_analysis(analysis_id)
    if analysis is None:
        raise HTTPException(status_code=404, detail="Extraction not found.")
    return analysis


@router.get("/extractions/{analysis_id}/contract", response_model=JdSkillListContract)
def get_extraction_contract(analysis_id: str):
    analysis = store.load_analysis(analysis_id)
    if analysis is None:
        raise HTTPException(status_code=404, detail="Extraction not found.")
    return to_contract(analysis)


@router.post("/extractions/{analysis_id}/activate")
def activate_extraction(analysis_id: str):
    if store.load_analysis(analysis_id) is None:
        raise HTTPException(status_code=404, detail="Extraction not found.")
    store.set_active(analysis_id)
    return {"active_id": analysis_id}


@router.get("/active/contract", response_model=JdSkillListContract)
def get_active_contract():
    active_id = store.get_active_id()
    analysis = store.load_analysis(active_id) if active_id else None
    if analysis is None:
        raise HTTPException(status_code=404, detail="No JD has been analysed yet.")
    return to_contract(analysis)

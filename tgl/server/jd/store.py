"""JSON persistence for JD analyses and the bundled sample JDs."""

import json
import re
from pathlib import Path
from typing import Dict, List, Optional

from .document_loader import extract_text
from .models import JdAnalysis

JD_DIR = Path(__file__).resolve().parents[2] / "data" / "jd"
SAMPLES_DIR = JD_DIR / "samples"
EXTRACTIONS_DIR = JD_DIR / "extractions"
ACTIVE_PATH = JD_DIR / "active.json"

# Official files with the same base name take precedence over our text copies.
_SAMPLE_PREFERENCE = (".pdf", ".docx", ".txt")


def save_analysis(analysis: JdAnalysis) -> JdAnalysis:
    EXTRACTIONS_DIR.mkdir(parents=True, exist_ok=True)
    (EXTRACTIONS_DIR / f"{analysis.id}.json").write_text(analysis.model_dump_json(indent=2), encoding="utf-8")
    return analysis


def load_analysis(analysis_id: str) -> Optional[JdAnalysis]:
    if not re.fullmatch(r"jd_[0-9a-f]{10}", analysis_id):
        return None
    path = EXTRACTIONS_DIR / f"{analysis_id}.json"
    if not path.exists():
        return None
    return JdAnalysis.model_validate_json(path.read_text(encoding="utf-8"))


def list_analyses() -> List[Dict]:
    if not EXTRACTIONS_DIR.exists():
        return []
    active = get_active_id()
    rows = []
    for path in EXTRACTIONS_DIR.glob("jd_*.json"):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except ValueError:
            continue
        rows.append({
            "id": data["id"],
            "company": data["company"],
            "role": data["role"],
            "source_file": data["source_file"],
            "created_at": data["created_at"],
            "engine_used": data["engine_used"],
            "skills_count": len(data.get("skills", [])),
            "is_active": data["id"] == active,
        })
    rows.sort(key=lambda r: r["created_at"], reverse=True)
    return rows


def set_active(analysis_id: str) -> None:
    JD_DIR.mkdir(parents=True, exist_ok=True)
    ACTIVE_PATH.write_text(json.dumps({"id": analysis_id}), encoding="utf-8")


def get_active_id() -> Optional[str]:
    try:
        return json.loads(ACTIVE_PATH.read_text(encoding="utf-8")).get("id")
    except (OSError, ValueError):
        return None


def _sample_files() -> Dict[str, Path]:
    chosen: Dict[str, Path] = {}
    if not SAMPLES_DIR.exists():
        return chosen
    for ext in reversed(_SAMPLE_PREFERENCE):
        for path in SAMPLES_DIR.glob(f"*{ext}"):
            chosen[path.stem] = path
    return chosen


def list_samples() -> List[Dict]:
    samples = []
    for sample_id, path in sorted(_sample_files().items()):
        text = read_sample_text(sample_id) or ""
        field = lambda label: (re.search(rf"^{label}\s*:\s*(.+)$", text, re.I | re.M) or [None, None])[1]
        samples.append({
            "id": sample_id,
            "file": path.name,
            "format": path.suffix.lstrip("."),
            "company": field("Company") or sample_id,
            "role": field("Role") or "",
            "location": field("Location") or "",
        })
    return samples


def read_sample(sample_id: str) -> Optional[Path]:
    return _sample_files().get(sample_id)


def read_sample_text(sample_id: str) -> Optional[str]:
    path = read_sample(sample_id)
    if path is None:
        return None
    return extract_text(path.name, path.read_bytes())

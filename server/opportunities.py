"""Curated and provider-synced opportunities API."""

import asyncio
import json
import logging
import os
import re
import tempfile
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Annotated, Literal, Optional

import httpx
from fastapi import APIRouter, Query
from pydantic import BaseModel, HttpUrl

router = APIRouter(prefix="/api/opportunities", tags=["opportunities"])
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CATALOG_PATH = DATA_DIR / "opportunities.json"
SYNC_PATH = DATA_DIR / "opportunities_sync.json"
KAGGLE_API_URL = "https://www.kaggle.com/api/v1/competitions/list"
REFRESH_INTERVAL_SECONDS = 6 * 60 * 60
logger = logging.getLogger(__name__)

OpportunityKind = Literal["hackathon", "competition"]
OpportunityStatus = Literal["upcoming", "open", "ended"]


class Opportunity(BaseModel):
    id: str
    kind: OpportunityKind
    title: str
    organizer: str
    description: str
    starts_on: date
    ends_on: date
    format: str
    prize: Optional[str] = None
    tags: list[str]
    provider: str
    source_url: HttpUrl
    status: OpportunityStatus


def _status_for(starts_on: date, ends_on: date, today: date) -> OpportunityStatus:
    if ends_on < today:
        return "ended"
    if starts_on > today:
        return "upcoming"
    return "open"


def _parse_api_date(value: object) -> Optional[date]:
    if not isinstance(value, str) or not value.strip():
        return None
    normalized = value.strip()
    try:
        return date.fromisoformat(normalized[:10])
    except ValueError:
        try:
            return datetime.fromisoformat(normalized.replace("Z", "+00:00")).date()
        except ValueError:
            return None


def _as_text(value: object) -> str:
    return value.strip() if isinstance(value, str) else ""


def _parse_kaggle_competitions(payload: object, today: date) -> list[dict[str, object]]:
    if isinstance(payload, dict):
        competitions = payload.get("competitions", payload.get("data"))
    else:
        competitions = payload
    if not isinstance(competitions, list):
        raise ValueError("Kaggle API response did not contain a competitions list.")

    opportunities: list[dict[str, object]] = []
    for item in competitions:
        if not isinstance(item, dict):
            continue
        title = _as_text(item.get("title"))
        ref = _as_text(item.get("ref"))
        if not title or not ref:
            continue

        slug = ref.rstrip("/").split("/")[-1]
        if not re.fullmatch(r"[A-Za-z0-9_-]+", slug):
            continue

        ends_on = _parse_api_date(item.get("deadline"))
        if ends_on is None or ends_on < today:
            continue
        starts_on = _parse_api_date(item.get("enabledDate")) or today

        raw_url = _as_text(item.get("url"))
        source_url = (
            raw_url
            if raw_url.startswith("https://")
            else f"https://www.kaggle.com/competitions/{slug}"
        )
        raw_tags = item.get("tags")
        tags = (
            [tag.strip() for tag in raw_tags if isinstance(tag, str) and tag.strip()]
            if isinstance(raw_tags, list)
            else []
        )
        category = _as_text(item.get("category"))
        if category and category not in tags:
            tags.append(category)

        opportunities.append(
            {
                "id": slug,
                "kind": "competition",
                "title": title,
                "organizer": _as_text(item.get("organizationName")) or "Kaggle",
                "description": _as_text(item.get("description"))
                or "View the competition details and requirements on Kaggle.",
                "starts_on": starts_on.isoformat(),
                "ends_on": ends_on.isoformat(),
                "format": "Online",
                "prize": _as_text(item.get("reward")) or None,
                "tags": tags,
                "provider": "Kaggle",
                "source_url": source_url,
                "status": _status_for(starts_on, ends_on, today),
            }
        )
    return opportunities


def _load_catalog(today: date) -> list[Opportunity]:
    records = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    if not isinstance(records, list):
        raise ValueError("The opportunities catalog must contain a JSON list.")

    by_id: dict[str, dict[str, object]] = {}
    for record in records:
        if not isinstance(record, dict):
            continue
        starts_on = date.fromisoformat(str(record["starts_on"]))
        ends_on = date.fromisoformat(str(record["ends_on"]))
        by_id[str(record["id"])] = {
            **record,
            "status": _status_for(starts_on, ends_on, today),
        }

    if SYNC_PATH.exists():
        try:
            snapshot = json.loads(SYNC_PATH.read_text(encoding="utf-8"))
            synced_records = snapshot.get("items", [])
            if not isinstance(synced_records, list):
                raise ValueError("Synced opportunities must contain a JSON list.")
            for record in synced_records:
                opportunity = Opportunity.model_validate(record)
                by_id[opportunity.id] = opportunity.model_dump(mode="json")
        except (OSError, ValueError, TypeError) as error:
            logger.warning("Could not read the opportunity sync cache: %s", error)

    opportunities: list[Opportunity] = []
    for record in by_id.values():
        starts_on = date.fromisoformat(str(record["starts_on"]))
        ends_on = date.fromisoformat(str(record["ends_on"]))
        record["status"] = _status_for(starts_on, ends_on, today)
        opportunities.append(Opportunity.model_validate(record))
    return opportunities


def _read_sync_state() -> dict[str, object]:
    username = os.getenv("KAGGLE_USERNAME", "").strip()
    key = os.getenv("KAGGLE_KEY", "").strip()
    state: dict[str, object] = {
        "provider": "Kaggle",
        "enabled": bool(username and key),
        "interval_hours": REFRESH_INTERVAL_SECONDS // 3600,
        "last_attempt_at": None,
        "last_success_at": None,
        "last_error": None,
    }
    if not state["enabled"]:
        state["last_error"] = (
            "Set KAGGLE_USERNAME and KAGGLE_KEY in the backend environment to enable Kaggle sync."
        )
    if not SYNC_PATH.exists():
        return state
    try:
        snapshot = json.loads(SYNC_PATH.read_text(encoding="utf-8"))
        stored_state = snapshot.get("sync")
        if isinstance(stored_state, dict):
            state.update(
                {
                    "last_attempt_at": stored_state.get("last_attempt_at"),
                    "last_success_at": stored_state.get("last_success_at"),
                    "last_error": stored_state.get("last_error"),
                }
            )
    except (OSError, ValueError, TypeError) as error:
        logger.warning("Could not read opportunity sync status: %s", error)
        state["last_error"] = "Could not read the saved sync status."
    if not state["enabled"] and not state["last_error"]:
        state["last_error"] = (
            "Set KAGGLE_USERNAME and KAGGLE_KEY in the backend environment to enable Kaggle sync."
        )
    return state


def _read_cached_items() -> list[dict[str, object]]:
    if not SYNC_PATH.exists():
        return []
    try:
        snapshot = json.loads(SYNC_PATH.read_text(encoding="utf-8"))
        items = snapshot.get("items", [])
        if not isinstance(items, list):
            raise ValueError("Synced opportunities must contain a JSON list.")
        return [item for item in items if isinstance(item, dict)]
    except (OSError, ValueError, TypeError) as error:
        logger.warning("Could not read the opportunity sync cache: %s", error)
        return []


def _write_snapshot(
    items: list[dict[str, object]],
    sync: dict[str, object],
) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    content = json.dumps({"items": items, "sync": sync}, indent=2)
    temporary_path: Optional[str] = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=DATA_DIR,
            delete=False,
            suffix=".tmp",
        ) as temporary_file:
            temporary_path = temporary_file.name
            temporary_file.write(content)
        os.replace(temporary_path, SYNC_PATH)
    finally:
        if temporary_path and os.path.exists(temporary_path):
            os.unlink(temporary_path)


async def refresh_kaggle_opportunities() -> dict[str, object]:
    """Fetch and atomically cache current competitions using Kaggle's official API."""
    username = os.getenv("KAGGLE_USERNAME", "").strip()
    key = os.getenv("KAGGLE_KEY", "").strip()
    current_state = _read_sync_state()
    current_state["last_attempt_at"] = datetime.now(timezone.utc).isoformat()

    if not username or not key:
        current_state["enabled"] = False
        current_state["last_error"] = (
            "Set KAGGLE_USERNAME and KAGGLE_KEY in the backend environment to enable Kaggle sync."
        )
        logger.info("Kaggle opportunity sync is disabled because credentials are not configured.")
        return current_state

    current_state["enabled"] = True
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(
                KAGGLE_API_URL,
                params={"page": 1, "pageSize": 100, "group": "general"},
                auth=(username, key),
            )
            response.raise_for_status()
            payload = response.json()
        items = _parse_kaggle_competitions(payload, datetime.now(timezone.utc).date())
        current_state["last_success_at"] = datetime.now(timezone.utc).isoformat()
        current_state["last_error"] = None
        _write_snapshot(items, current_state)
        logger.info("Refreshed %s current competitions from Kaggle.", len(items))
    except (httpx.HTTPError, json.JSONDecodeError, OSError, ValueError) as error:
        current_state["last_error"] = str(error) or error.__class__.__name__
        logger.error("Kaggle opportunity refresh failed; retaining last good cache: %s", error)
        try:
            _write_snapshot(_read_cached_items(), current_state)
        except OSError:
            logger.exception("Could not persist Kaggle sync failure status.")
    return current_state


async def _refresh_loop() -> None:
    while True:
        await refresh_kaggle_opportunities()
        await asyncio.sleep(REFRESH_INTERVAL_SECONDS)


_refresh_task: Optional[asyncio.Task[None]] = None


def start_opportunity_refresh() -> None:
    global _refresh_task
    if _refresh_task is None or _refresh_task.done():
        _refresh_task = asyncio.create_task(_refresh_loop())


async def stop_opportunity_refresh() -> None:
    global _refresh_task
    if _refresh_task is not None:
        _refresh_task.cancel()
        try:
            await _refresh_task
        except asyncio.CancelledError:
            pass
        _refresh_task = None


@router.get("")
def list_opportunities(
    kind: Optional[OpportunityKind] = None,
    status: Optional[OpportunityStatus] = None,
    q: Annotated[Optional[str], Query(max_length=100)] = None,
) -> dict[str, object]:
    """Return curated and synced opportunities with optional filters."""
    today = datetime.now(timezone.utc).date()
    opportunities = _load_catalog(today)

    if kind:
        opportunities = [item for item in opportunities if item.kind == kind]
    if status:
        opportunities = [item for item in opportunities if item.status == status]
    if q:
        query = q.strip().casefold()
        if query:
            opportunities = [
                item
                for item in opportunities
                if query
                in " ".join(
                    [
                        item.title,
                        item.organizer,
                        item.description,
                        item.provider,
                        *item.tags,
                    ]
                ).casefold()
            ]

    sync = _read_sync_state()
    return {
        "items": opportunities,
        "count": len(opportunities),
        "automatic_sync_enabled": bool(sync["enabled"]),
        "sync": sync,
    }

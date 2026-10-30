import unittest
from datetime import date
import json
import tempfile
from pathlib import Path
from unittest.mock import patch

from server import opportunities
from server.opportunities import (
    _load_catalog,
    _parse_kaggle_competitions,
    _status_for,
    list_opportunities,
)


class OpportunityCatalogTests(unittest.TestCase):
    def test_status_uses_inclusive_start_and_end_dates(self):
        self.assertEqual(
            _status_for(date(2026, 10, 30), date(2026, 11, 12), date(2026, 10, 30)),
            "open",
        )
        self.assertEqual(
            _status_for(date(2026, 11, 1), date(2026, 11, 12), date(2026, 10, 30)),
            "upcoming",
        )
        self.assertEqual(
            _status_for(date(2026, 10, 1), date(2026, 10, 29), date(2026, 10, 30)),
            "ended",
        )

    def test_catalog_records_have_valid_dates_and_source_urls(self):
        entries = _load_catalog(date(2026, 10, 30))
        self.assertEqual(len(entries), 6)
        self.assertTrue(all(entry.source_url.scheme == "https" for entry in entries))

    def test_kaggle_parser_maps_current_entries_and_skips_expired(self):
        items = _parse_kaggle_competitions(
            [
                {
                    "ref": "sample-ai-event",
                    "title": "Sample AI Event",
                    "organizationName": "Example Org",
                    "description": "Build an AI model.",
                    "enabledDate": "2026-10-01T00:00:00Z",
                    "deadline": "2026-11-15T23:59:00Z",
                    "reward": "$5,000",
                    "tags": ["Machine Learning"],
                    "url": "https://www.kaggle.com/competitions/sample-ai-event",
                },
                {
                    "ref": "expired-event",
                    "title": "Expired Event",
                    "deadline": "2026-10-29T00:00:00Z",
                },
            ],
            date(2026, 10, 30),
        )
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["id"], "sample-ai-event")
        self.assertEqual(items[0]["status"], "open")
        self.assertEqual(items[0]["tags"], ["Machine Learning"])

    def test_synced_items_merge_with_curated_catalog(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            snapshot_path = Path(temp_dir) / "opportunities_sync.json"
            snapshot_path.write_text(
                json.dumps(
                    {
                        "items": [
                            {
                                "id": "new-kaggle-event",
                                "kind": "competition",
                                "title": "New Kaggle Event",
                                "organizer": "Kaggle",
                                "description": "A new competition",
                                "starts_on": "2026-10-30",
                                "ends_on": "2026-11-30",
                                "format": "Online",
                                "tags": ["AI/ML"],
                                "provider": "Kaggle",
                                "source_url": "https://www.kaggle.com/competitions/new-kaggle-event",
                                "status": "open",
                            }
                        ],
                        "sync": {},
                    }
                ),
                encoding="utf-8",
            )
            with patch.object(opportunities, "SYNC_PATH", snapshot_path):
                result = list_opportunities()
        self.assertEqual(result["count"], 7)
        self.assertTrue(any(item.id == "new-kaggle-event" for item in result["items"]))

    def test_search_and_kind_filters(self):
        result = list_opportunities(kind="competition", q="quantum")
        self.assertEqual(result["count"], 1)
        self.assertEqual(
            result["items"][0].id,
            "google-verifiable-quantum-circuit-compilation",
        )
        self.assertFalse(result["automatic_sync_enabled"])
        self.assertEqual(result["sync"]["provider"], "Kaggle")


if __name__ == "__main__":
    unittest.main()

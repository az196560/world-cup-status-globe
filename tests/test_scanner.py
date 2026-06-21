from __future__ import annotations

import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from src.award_monitor.config import AppConfig, EmailConfig, RouteConfig
from src.award_monitor.db import Database
from src.award_monitor.emailer import Emailer
from src.award_monitor.providers.registry import build_provider_registry
from src.award_monitor.scanner import Scanner


class ScannerTests(unittest.TestCase):
    def test_scan_route_persists_availability(self) -> None:
        with TemporaryDirectory() as directory:
            tmp_path = Path(directory)
            route = RouteConfig(
                name="Test Route",
                origins=("SFO",),
                destinations=("HND",),
                programs=("aeroplan",),
                start_date="2026-07-01",
                end_date="2026-08-15",
                cabins=("business", "first"),
            )
            config = AppConfig(
                database_path=tmp_path / "monitor.sqlite3",
                email=EmailConfig(enabled=False),
                programs=("aeroplan",),
                routes=(route,),
            )
            db = Database(config.database_path)
            db.initialize()
            db.sync_routes(config.routes)
            scanner = Scanner(db, build_provider_registry(config.programs, mock_data=True), Emailer(config.email))

            result = scanner.scan_all()

            self.assertEqual(result["routes"], 1)
            self.assertEqual(result["searched_count"], 1)
            self.assertGreaterEqual(result["result_count"], 1)
            self.assertEqual(len(db.list_availability()), result["result_count"])

    def test_single_search_supports_airport_sets(self) -> None:
        with TemporaryDirectory() as directory:
            tmp_path = Path(directory)
            db = Database(tmp_path / "monitor.sqlite3")
            db.initialize()
            scanner = Scanner(
                db,
                build_provider_registry(("aeroplan", "alaska"), mock_data=True),
                Emailer(EmailConfig(enabled=False)),
            )

            rows = scanner.single_search(
                {
                    "origins": ["SFO", "LAX"],
                    "destinations": ["HND", "NRT"],
                    "programs": ["aeroplan", "alaska"],
                    "start_date": "2026-07-01",
                    "end_date": "2026-08-15",
                    "cabins": ["business", "first"],
                }
            )

            self.assertTrue(rows)
            self.assertEqual({row["source"] for row in rows}, {"single_search"})
            self.assertTrue({row["program"] for row in rows}.issubset({"aeroplan", "alaska"}))


if __name__ == "__main__":
    unittest.main()

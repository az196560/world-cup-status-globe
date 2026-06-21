from __future__ import annotations

import argparse
import json
import threading
import time
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

from .config import AppConfig, load_config
from .db import Database
from .emailer import Emailer
from .programs import PROGRAMS
from .providers import build_provider_registry
from .scanner import Scanner


class AppState:
    def __init__(self, config: AppConfig):
        self.config = config
        self.db = Database(config.database_path)
        self.db.initialize()
        self.db.sync_routes(config.routes)
        self.providers = build_provider_registry(config.programs, config.mock_data)
        self.scanner = Scanner(self.db, self.providers, Emailer(config.email))
        self.scan_lock = threading.Lock()
        self.last_scheduler_error: str | None = None

    def run_scan_all(self) -> dict[str, Any]:
        if not self.scan_lock.acquire(blocking=False):
            return {"status": "already_running"}
        try:
            result = self.scanner.scan_all()
            result["status"] = "success"
            return result
        finally:
            self.scan_lock.release()


def make_handler(state: AppState, web_root: Path):
    class Handler(SimpleHTTPRequestHandler):
        server_version = "AwardMonitor/0.1"

        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(web_root), **kwargs)

        def do_GET(self) -> None:
            parsed = urlparse(self.path)
            if parsed.path == "/api/programs":
                self._json({"programs": [{"id": key, "name": value} for key, value in PROGRAMS.items()]})
                return
            if parsed.path == "/api/routes":
                self._json({"routes": state.db.list_routes()})
                return
            if parsed.path == "/api/availability":
                query = parse_qs(parsed.query)
                limit = int(query.get("limit", ["200"])[0])
                self._json({"availability": state.db.list_availability(limit=limit)})
                return
            if parsed.path == "/api/scan-runs":
                self._json({"scan_runs": state.db.recent_scan_runs()})
                return
            if parsed.path == "/api/status":
                self._json(
                    {
                        "scan_interval_minutes": state.config.scan_interval_minutes,
                        "database_path": str(state.config.database_path),
                        "mock_data": state.config.mock_data,
                        "scheduler_error": state.last_scheduler_error,
                    }
                )
                return
            if parsed.path == "/":
                self.path = "/index.html"
            return super().do_GET()

        def do_POST(self) -> None:
            parsed = urlparse(self.path)
            if parsed.path == "/api/scan":
                threading.Thread(target=state.run_scan_all, daemon=True).start()
                self._json({"status": "started"}, HTTPStatus.ACCEPTED)
                return
            if parsed.path == "/api/search":
                payload = self._read_json()
                try:
                    rows = state.scanner.single_search(payload)
                    self._json({"availability": rows})
                except Exception as exc:
                    self._json({"error": str(exc)}, HTTPStatus.BAD_REQUEST)
                return
            self._json({"error": "Not found"}, HTTPStatus.NOT_FOUND)

        def log_message(self, format: str, *args) -> None:
            return

        def _read_json(self) -> dict[str, Any]:
            length = int(self.headers.get("Content-Length", "0"))
            if length == 0:
                return {}
            return json.loads(self.rfile.read(length).decode("utf-8"))

        def _json(self, payload: dict[str, Any], status: HTTPStatus = HTTPStatus.OK) -> None:
            body = json.dumps(payload, default=str).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

    return Handler


def start_scheduler(state: AppState) -> None:
    def loop() -> None:
        while True:
            try:
                state.run_scan_all()
                state.last_scheduler_error = None
            except Exception as exc:
                state.last_scheduler_error = str(exc)
            time.sleep(max(state.config.scan_interval_minutes, 1) * 60)

    threading.Thread(target=loop, daemon=True, name="award-monitor-scheduler").start()


def main() -> None:
    parser = argparse.ArgumentParser(description="Award tickets monitor")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--config", default=None)
    parser.add_argument("--no-scheduler", action="store_true")
    args = parser.parse_args()

    config = load_config(args.config)
    state = AppState(config)
    if not args.no_scheduler:
        start_scheduler(state)

    web_root = Path(__file__).resolve().parents[2] / "web"
    server = ThreadingHTTPServer((args.host, args.port), make_handler(state, web_root))
    print(f"Award monitor running at http://{args.host}:{args.port}")
    print(f"Database: {config.database_path}")
    server.serve_forever()


if __name__ == "__main__":
    main()


from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

from .config import RouteConfig


SCHEMA = """
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS routes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  origins_json TEXT NOT NULL,
  destinations_json TEXT NOT NULL,
  programs_json TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  cabins_json TEXT NOT NULL,
  allow_short_haul_economy INTEGER NOT NULL DEFAULT 1,
  max_economy_distance_miles INTEGER NOT NULL DEFAULT 800,
  max_points INTEGER,
  min_seats INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scan_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_id INTEGER,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TEXT,
  searched_count INTEGER NOT NULL DEFAULT 0,
  result_count INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  FOREIGN KEY(route_id) REFERENCES routes(id)
);

CREATE TABLE IF NOT EXISTS availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scan_run_id INTEGER,
  route_id INTEGER,
  source TEXT NOT NULL DEFAULT 'scheduled_scan',
  program TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_date TEXT NOT NULL,
  cabin TEXT NOT NULL,
  seats INTEGER NOT NULL,
  points INTEGER,
  taxes_cents INTEGER,
  currency TEXT NOT NULL DEFAULT 'USD',
  carrier TEXT,
  flight_numbers_json TEXT NOT NULL DEFAULT '[]',
  mixed_cabin INTEGER NOT NULL DEFAULT 0,
  booking_url TEXT,
  raw_json TEXT NOT NULL DEFAULT '{}',
  first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(program, origin, destination, departure_date, cabin, carrier, flight_numbers_json),
  FOREIGN KEY(scan_run_id) REFERENCES scan_runs(id),
  FOREIGN KEY(route_id) REFERENCES routes(id)
);

CREATE TABLE IF NOT EXISTS alert_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  availability_id INTEGER NOT NULL,
  channel TEXT NOT NULL,
  sent_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL,
  error TEXT,
  FOREIGN KEY(availability_id) REFERENCES availability(id)
);
"""


class Database:
    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(self.path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def initialize(self) -> None:
        with self.connect() as conn:
            conn.executescript(SCHEMA)

    def upsert_route(self, route: RouteConfig) -> int:
        with self.connect() as conn:
            conn.execute(
                """
                INSERT INTO routes (
                  name, origins_json, destinations_json, programs_json, start_date, end_date,
                  cabins_json, allow_short_haul_economy, max_economy_distance_miles,
                  max_points, min_seats, active
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(name) DO UPDATE SET
                  origins_json=excluded.origins_json,
                  destinations_json=excluded.destinations_json,
                  programs_json=excluded.programs_json,
                  start_date=excluded.start_date,
                  end_date=excluded.end_date,
                  cabins_json=excluded.cabins_json,
                  allow_short_haul_economy=excluded.allow_short_haul_economy,
                  max_economy_distance_miles=excluded.max_economy_distance_miles,
                  max_points=excluded.max_points,
                  min_seats=excluded.min_seats,
                  active=excluded.active,
                  updated_at=CURRENT_TIMESTAMP
                """,
                (
                    route.name,
                    json.dumps(route.origins),
                    json.dumps(route.destinations),
                    json.dumps(route.programs),
                    route.start_date,
                    route.end_date,
                    json.dumps(route.cabins),
                    int(route.allow_short_haul_economy),
                    route.max_economy_distance_miles,
                    route.max_points,
                    route.min_seats,
                    int(route.active),
                ),
            )
            row = conn.execute("SELECT id FROM routes WHERE name = ?", (route.name,)).fetchone()
            return int(row["id"])

    def sync_routes(self, routes: tuple[RouteConfig, ...]) -> None:
        for route in routes:
            self.upsert_route(route)

    def list_routes(self, active_only: bool = False) -> list[dict[str, Any]]:
        query = "SELECT * FROM routes"
        if active_only:
            query += " WHERE active = 1"
        query += " ORDER BY name"
        with self.connect() as conn:
            return [decode_route(row) for row in conn.execute(query).fetchall()]

    def create_scan_run(self, route_id: int | None) -> int:
        with self.connect() as conn:
            cursor = conn.execute(
                "INSERT INTO scan_runs (route_id, status) VALUES (?, 'running')",
                (route_id,),
            )
            return int(cursor.lastrowid)

    def finish_scan_run(
        self,
        scan_run_id: int,
        status: str,
        searched_count: int,
        result_count: int,
        error: str | None = None,
    ) -> None:
        with self.connect() as conn:
            conn.execute(
                """
                UPDATE scan_runs
                SET status = ?, searched_count = ?, result_count = ?, error = ?, finished_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (status, searched_count, result_count, error, scan_run_id),
            )

    def upsert_availability(self, item: dict[str, Any]) -> tuple[int, bool]:
        with self.connect() as conn:
            existing = conn.execute(
                """
                SELECT id FROM availability
                WHERE program = ? AND origin = ? AND destination = ? AND departure_date = ?
                  AND cabin = ? AND COALESCE(carrier, '') = COALESCE(?, '')
                  AND flight_numbers_json = ?
                """,
                (
                    item["program"],
                    item["origin"],
                    item["destination"],
                    item["departure_date"],
                    item["cabin"],
                    item.get("carrier"),
                    json.dumps(item.get("flight_numbers", [])),
                ),
            ).fetchone()
            params = (
                item.get("scan_run_id"),
                item.get("route_id"),
                item.get("source", "scheduled_scan"),
                item["program"],
                item["origin"],
                item["destination"],
                item["departure_date"],
                item["cabin"],
                item["seats"],
                item.get("points"),
                item.get("taxes_cents"),
                item.get("currency", "USD"),
                item.get("carrier"),
                json.dumps(item.get("flight_numbers", [])),
                int(item.get("mixed_cabin", False)),
                item.get("booking_url"),
                json.dumps(item.get("raw", {})),
            )
            if existing:
                conn.execute(
                    """
                    UPDATE availability
                    SET scan_run_id = ?, route_id = ?, source = ?, seats = ?, points = ?,
                        taxes_cents = ?, currency = ?, mixed_cabin = ?, booking_url = ?,
                        raw_json = ?, last_seen_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                    """,
                    (
                        item.get("scan_run_id"),
                        item.get("route_id"),
                        item.get("source", "scheduled_scan"),
                        item["seats"],
                        item.get("points"),
                        item.get("taxes_cents"),
                        item.get("currency", "USD"),
                        int(item.get("mixed_cabin", False)),
                        item.get("booking_url"),
                        json.dumps(item.get("raw", {})),
                        existing["id"],
                    ),
                )
                return int(existing["id"]), False
            cursor = conn.execute(
                """
                INSERT INTO availability (
                  scan_run_id, route_id, source, program, origin, destination, departure_date,
                  cabin, seats, points, taxes_cents, currency, carrier, flight_numbers_json,
                  mixed_cabin, booking_url, raw_json
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                params,
            )
            return int(cursor.lastrowid), True

    def list_availability(self, limit: int = 200) -> list[dict[str, Any]]:
        with self.connect() as conn:
            rows = conn.execute(
                """
                SELECT a.*, r.name AS route_name
                FROM availability a
                LEFT JOIN routes r ON r.id = a.route_id
                ORDER BY a.last_seen_at DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
            return [decode_availability(row) for row in rows]

    def recent_scan_runs(self, limit: int = 20) -> list[dict[str, Any]]:
        with self.connect() as conn:
            return [
                dict(row)
                for row in conn.execute(
                    """
                    SELECT sr.*, r.name AS route_name
                    FROM scan_runs sr
                    LEFT JOIN routes r ON r.id = sr.route_id
                    ORDER BY sr.started_at DESC
                    LIMIT ?
                    """,
                    (limit,),
                ).fetchall()
            ]


def decode_route(row: sqlite3.Row) -> dict[str, Any]:
    data = dict(row)
    for key in ("origins_json", "destinations_json", "programs_json", "cabins_json"):
        data[key.removesuffix("_json")] = json.loads(data.pop(key))
    data["active"] = bool(data["active"])
    data["allow_short_haul_economy"] = bool(data["allow_short_haul_economy"])
    return data


def decode_availability(row: sqlite3.Row) -> dict[str, Any]:
    data = dict(row)
    data["flight_numbers"] = json.loads(data.pop("flight_numbers_json"))
    data["raw"] = json.loads(data.pop("raw_json"))
    data["mixed_cabin"] = bool(data["mixed_cabin"])
    return data


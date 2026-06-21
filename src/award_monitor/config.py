from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from datetime import date, timedelta
from pathlib import Path
from typing import Any

from .programs import PROGRAMS, normalize_program


DEFAULT_CONFIG_PATH = Path("config/monitors.json")


@dataclass(frozen=True)
class EmailConfig:
    enabled: bool = False
    sender: str = ""
    recipients: tuple[str, ...] = ()


@dataclass(frozen=True)
class RouteConfig:
    name: str
    origins: tuple[str, ...]
    destinations: tuple[str, ...]
    programs: tuple[str, ...]
    start_date: str
    end_date: str
    cabins: tuple[str, ...] = ("business", "first")
    allow_short_haul_economy: bool = True
    max_economy_distance_miles: int = 800
    max_points: int | None = None
    min_seats: int = 1
    active: bool = True


@dataclass(frozen=True)
class AppConfig:
    scan_interval_minutes: int = 60
    lookahead_days: int = 330
    database_path: Path = Path("data/award_monitor.sqlite3")
    email: EmailConfig = field(default_factory=EmailConfig)
    programs: tuple[str, ...] = tuple(PROGRAMS)
    routes: tuple[RouteConfig, ...] = ()
    mock_data: bool = True


def _parse_route(raw: dict[str, Any], lookahead_days: int) -> RouteConfig:
    today = date.today()
    origins = tuple(code.strip().upper() for code in raw.get("origins", []) if code.strip())
    destinations = tuple(code.strip().upper() for code in raw.get("destinations", []) if code.strip())
    if not origins or not destinations:
        raise ValueError(f"Route {raw.get('name', '<unnamed>')} needs origins and destinations")

    programs = tuple(normalize_program(program) for program in raw.get("programs", PROGRAMS))
    cabins = tuple(cabin.strip().lower() for cabin in raw.get("cabins", ["business", "first"]))
    return RouteConfig(
        name=raw.get("name") or f"{','.join(origins)} to {','.join(destinations)}",
        origins=origins,
        destinations=destinations,
        programs=programs,
        start_date=raw.get("start_date") or today.isoformat(),
        end_date=raw.get("end_date") or (today + timedelta(days=lookahead_days)).isoformat(),
        cabins=cabins,
        allow_short_haul_economy=bool(raw.get("allow_short_haul_economy", True)),
        max_economy_distance_miles=int(raw.get("max_economy_distance_miles", 800)),
        max_points=raw.get("max_points"),
        min_seats=int(raw.get("min_seats", 1)),
        active=bool(raw.get("active", True)),
    )


def load_config(path: str | Path | None = None) -> AppConfig:
    config_path = Path(path or os.getenv("AWARD_MONITOR_CONFIG", DEFAULT_CONFIG_PATH))
    raw: dict[str, Any] = {}
    if config_path.exists():
        raw = json.loads(config_path.read_text(encoding="utf-8"))

    lookahead_days = int(raw.get("lookahead_days", 330))
    email_raw = raw.get("email", {})
    programs = tuple(normalize_program(program) for program in raw.get("programs", PROGRAMS))
    routes = tuple(_parse_route(route, lookahead_days) for route in raw.get("routes", []))
    database_path = Path(os.getenv("AWARD_MONITOR_DB", raw.get("database_path", "data/award_monitor.sqlite3")))

    return AppConfig(
        scan_interval_minutes=int(raw.get("scan_interval_minutes", 60)),
        lookahead_days=lookahead_days,
        database_path=database_path,
        email=EmailConfig(
            enabled=bool(email_raw.get("enabled", False)),
            sender=email_raw.get("from", ""),
            recipients=tuple(email_raw.get("to", [])),
        ),
        programs=programs,
        routes=routes,
        mock_data=os.getenv("AWARD_MONITOR_MOCK_DATA", str(raw.get("mock_data", True))).lower()
        not in {"0", "false", "no"},
    )


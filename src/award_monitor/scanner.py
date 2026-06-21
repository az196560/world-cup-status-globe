from __future__ import annotations

import itertools
import traceback
from typing import Any

from .db import Database
from .emailer import Emailer
from .providers import AwardAvailability, AwardProvider, AwardSearch


class Scanner:
    def __init__(self, db: Database, providers: dict[str, AwardProvider], emailer: Emailer):
        self.db = db
        self.providers = providers
        self.emailer = emailer

    def scan_all(self) -> dict[str, Any]:
        totals = {"routes": 0, "searched_count": 0, "result_count": 0, "new_count": 0}
        for route in self.db.list_routes(active_only=True):
            result = self.scan_route(route)
            totals["routes"] += 1
            totals["searched_count"] += result["searched_count"]
            totals["result_count"] += result["result_count"]
            totals["new_count"] += result["new_count"]
        return totals

    def scan_route(self, route: dict[str, Any]) -> dict[str, Any]:
        scan_run_id = self.db.create_scan_run(route["id"])
        searched_count = 0
        result_count = 0
        new_awards: list[dict] = []
        try:
            for search in self._expand_route(route):
                searched_count += 1
                provider = self.providers[search.program]
                for award in provider.search(search):
                    result_count += 1
                    row = self._award_to_row(award, route["id"], scan_run_id, "scheduled_scan")
                    availability_id, is_new = self.db.upsert_availability(row)
                    if is_new:
                        row["id"] = availability_id
                        new_awards.append(row)
            self.db.finish_scan_run(scan_run_id, "success", searched_count, result_count)
            self.emailer.send_new_awards(new_awards)
            return {
                "scan_run_id": scan_run_id,
                "status": "success",
                "searched_count": searched_count,
                "result_count": result_count,
                "new_count": len(new_awards),
            }
        except Exception as exc:
            self.db.finish_scan_run(
                scan_run_id,
                "failed",
                searched_count,
                result_count,
                "".join(traceback.format_exception_only(type(exc), exc)).strip(),
            )
            raise

    def single_search(self, payload: dict[str, Any]) -> list[dict[str, Any]]:
        searches = self._expand_payload(payload)
        rows: list[dict[str, Any]] = []
        for search in searches:
            provider = self.providers[search.program]
            for award in provider.search(search):
                row = self._award_to_row(award, None, None, "single_search")
                availability_id, _ = self.db.upsert_availability(row)
                row["id"] = availability_id
                rows.append(row)
        return rows

    def _expand_route(self, route: dict[str, Any]) -> list[AwardSearch]:
        searches: list[AwardSearch] = []
        for program, origin, destination in itertools.product(
            route["programs"], route["origins"], route["destinations"]
        ):
            if program not in self.providers:
                continue
            searches.append(
                AwardSearch(
                    program=program,
                    origin=origin,
                    destination=destination,
                    start_date=route["start_date"],
                    end_date=route["end_date"],
                    cabins=tuple(route["cabins"]),
                    allow_short_haul_economy=route["allow_short_haul_economy"],
                    max_economy_distance_miles=route["max_economy_distance_miles"],
                    min_seats=route["min_seats"],
                    max_points=route["max_points"],
                )
            )
        return searches

    def _expand_payload(self, payload: dict[str, Any]) -> list[AwardSearch]:
        origins = [code.strip().upper() for code in payload.get("origins", []) if code.strip()]
        destinations = [code.strip().upper() for code in payload.get("destinations", []) if code.strip()]
        programs = payload.get("programs") or [payload.get("program")]
        programs = [program for program in programs if program]
        cabins = tuple(payload.get("cabins") or ["business", "first"])
        searches: list[AwardSearch] = []
        for program, origin, destination in itertools.product(programs, origins, destinations):
            if program not in self.providers:
                continue
            searches.append(
                AwardSearch(
                    program=program,
                    origin=origin,
                    destination=destination,
                    start_date=payload["start_date"],
                    end_date=payload["end_date"],
                    cabins=cabins,
                    allow_short_haul_economy=bool(payload.get("allow_short_haul_economy", True)),
                    max_economy_distance_miles=int(payload.get("max_economy_distance_miles", 800)),
                    min_seats=int(payload.get("min_seats", 1)),
                    max_points=payload.get("max_points"),
                )
            )
        return searches

    def _award_to_row(
        self,
        award: AwardAvailability,
        route_id: int | None,
        scan_run_id: int | None,
        source: str,
    ) -> dict[str, Any]:
        return {
            "scan_run_id": scan_run_id,
            "route_id": route_id,
            "source": source,
            "program": award.program,
            "origin": award.origin,
            "destination": award.destination,
            "departure_date": award.departure_date,
            "cabin": award.cabin,
            "seats": award.seats,
            "points": award.points,
            "taxes_cents": award.taxes_cents,
            "currency": award.currency,
            "carrier": award.carrier,
            "flight_numbers": list(award.flight_numbers),
            "mixed_cabin": award.mixed_cabin,
            "booking_url": award.booking_url,
            "raw": award.raw,
        }


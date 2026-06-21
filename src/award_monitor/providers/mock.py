from __future__ import annotations

import hashlib
from datetime import date, datetime, timedelta

from .base import AwardAvailability, AwardSearch


class MockAwardProvider:
    """Deterministic provider for developing the scanner, DB, and UI without live credentials."""

    def __init__(self, program: str):
        self.program = program

    def search(self, search: AwardSearch) -> list[AwardAvailability]:
        start = datetime.strptime(search.start_date, "%Y-%m-%d").date()
        end = datetime.strptime(search.end_date, "%Y-%m-%d").date()
        end = min(end, start + timedelta(days=45))
        results: list[AwardAvailability] = []
        current = start
        while current <= end:
            for cabin in search.cabins:
                item = self._maybe_build(search, current, cabin)
                if item:
                    results.append(item)
            if search.allow_short_haul_economy:
                item = self._maybe_build(search, current, "economy", mixed_cabin=True)
                if item:
                    results.append(item)
            current += timedelta(days=1)
        return results

    def _maybe_build(
        self,
        search: AwardSearch,
        departure_date: date,
        cabin: str,
        mixed_cabin: bool = False,
    ) -> AwardAvailability | None:
        seed = f"{self.program}:{search.origin}:{search.destination}:{departure_date}:{cabin}"
        digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()
        score = int(digest[:8], 16)
        threshold = 9 if cabin in {"business", "first"} else 4
        if score % 100 >= threshold:
            return None
        seats = max(search.min_seats, score % 4 + 1)
        base_points = {"economy": 12500, "business": 60000, "first": 85000}.get(cabin, 45000)
        points = base_points + (score % 7) * 2500
        if search.max_points is not None and points > search.max_points:
            return None
        return AwardAvailability(
            program=self.program,
            origin=search.origin,
            destination=search.destination,
            departure_date=departure_date.isoformat(),
            cabin=cabin,
            seats=seats,
            points=points,
            taxes_cents=560 + (score % 18) * 100,
            carrier=self._carrier_for(search),
            flight_numbers=(f"{self.program[:2].upper()}{100 + score % 800}",),
            mixed_cabin=mixed_cabin,
            booking_url=f"https://example.com/{self.program}/search",
            raw={"mock": True, "score": score},
        )

    def _carrier_for(self, search: AwardSearch) -> str:
        carriers = {
            "aeroplan": "AC",
            "alaska": "AS",
            "lifemiles": "AV",
            "united": "UA",
            "virgin_atlantic": "VS",
            "american": "AA",
            "delta": "DL",
        }
        return carriers.get(search.program, search.program[:2].upper())


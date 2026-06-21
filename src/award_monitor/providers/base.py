from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol


@dataclass(frozen=True)
class AwardSearch:
    program: str
    origin: str
    destination: str
    start_date: str
    end_date: str
    cabins: tuple[str, ...]
    allow_short_haul_economy: bool = True
    max_economy_distance_miles: int = 800
    min_seats: int = 1
    max_points: int | None = None


@dataclass(frozen=True)
class AwardAvailability:
    program: str
    origin: str
    destination: str
    departure_date: str
    cabin: str
    seats: int
    points: int | None = None
    taxes_cents: int | None = None
    currency: str = "USD"
    carrier: str | None = None
    flight_numbers: tuple[str, ...] = ()
    mixed_cabin: bool = False
    booking_url: str | None = None
    raw: dict = field(default_factory=dict)


class AwardProvider(Protocol):
    program: str

    def search(self, search: AwardSearch) -> list[AwardAvailability]:
        ...


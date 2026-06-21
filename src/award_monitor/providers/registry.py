from __future__ import annotations

from .base import AwardProvider
from .mock import MockAwardProvider


def build_provider_registry(programs: tuple[str, ...], mock_data: bool = True) -> dict[str, AwardProvider]:
    if not mock_data:
        raise RuntimeError(
            "Live provider adapters are not configured yet. Enable AWARD_MONITOR_MOCK_DATA=1 "
            "or implement provider adapters in src/award_monitor/providers/."
        )
    return {program: MockAwardProvider(program) for program in programs}


from __future__ import annotations

PROGRAMS = {
    "aeroplan": "Air Canada Aeroplan",
    "alaska": "Alaska Mileage Plan",
    "lifemiles": "Avianca LifeMiles",
    "united": "United MileagePlus",
    "virgin_atlantic": "Virgin Atlantic Flying Club",
    "american": "American Airlines AAdvantage",
    "delta": "Delta SkyMiles",
}


def normalize_program(program: str) -> str:
    value = program.strip().lower().replace(" ", "_").replace("-", "_")
    aliases = {
        "air_canada": "aeroplan",
        "air_canada_aeroplan": "aeroplan",
        "avianca": "lifemiles",
        "avianca_lifemiles": "lifemiles",
        "mileage_plan": "alaska",
        "alaska_mileage_plan": "alaska",
        "mileageplus": "united",
        "united_mileageplus": "united",
        "virgin": "virgin_atlantic",
        "virgin_flying_club": "virgin_atlantic",
        "flying_club": "virgin_atlantic",
        "american_airline": "american",
        "american_airlines": "american",
        "aadvantage": "american",
        "delta_airline": "delta",
        "delta_airlines": "delta",
        "skymiles": "delta",
    }
    value = aliases.get(value, value)
    if value not in PROGRAMS:
        raise ValueError(f"Unsupported mileage program: {program}")
    return value


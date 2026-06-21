# 2026 World Cup Status Globe

Interactive Sites/Vinext website for browsing FIFA World Cup 26 team status on
a globe.

## What It Shows

- A draggable world globe with countries colored by tournament status.
- Click any named country on the globe to inspect its World Cup record or see
  that the current dataset does not cover it precisely.
- All 48 World Cup finalists with group, standings, match scores, upcoming
  fixtures, and current notes.
- Knockout-stage bracket with match numbers, teams/placeholders, kickoff times,
  venues, and cities.
- 162 parsed qualification records from the 2026 FIFA World Cup qualification
  tables.
- Search and filters for finalists and eliminated teams.

Data is static and labeled as current through `2026-06-21`.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validate

```bash
npm run lint
npm run build
```

The canonical Sites preview is `public/screenshot.jpeg`.

## Main Files

- `app/components/WorldCupDashboard.tsx`: globe UI, filters, standings, and
  bracket/detail panels.
- `app/data/worldCupData.ts`: World Cup group, match, knockout, country, and
  source data.
- `app/data/qualifying-records.json`: generated qualification-stage records.
- `public/countries-110m.json`: bundled world topology used by the globe.

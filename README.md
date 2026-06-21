# 2026 World Cup Status Globe

Interactive website for browsing FIFA World Cup 26 team status on a globe.

Public site: <https://az196560.github.io/world-cup-status-globe/>

## What It Shows

- A draggable world globe with countries colored by tournament status.
- Click any named country on the globe to inspect its World Cup record or see
  that the current dataset does not cover it precisely.
- All 48 World Cup finalists with group, standings, match scores, upcoming
  fixtures, and current notes.
- Knockout-stage bracket with match numbers, teams/placeholders, kickoff times,
  venues, and cities.
- 212 qualification records, including early AFC/CONCACAF rounds and selected
  associations that did not enter qualifying.
- Chinese and English UI modes, with flag emoji and bilingual country/region
  names in the main views.
- Search and filters for finalists, eliminated teams, and non-entered teams.

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
npm run build:pages
```

The GitHub Pages build outputs to `dist-pages/`.

## Main Files

- `app/components/WorldCupDashboard.tsx`: globe UI, filters, standings, and
  bracket/detail panels.
- `app/data/worldCupData.ts`: World Cup group, match, knockout, country, and
  source data.
- `app/data/regionMeta.ts`: flag emoji, region codes, and bilingual display
  names.
- `app/data/qualifying-records.json`: generated qualification-stage records.
- `github-pages/`: static entry used by GitHub Pages.
- `public/countries-110m.json`: bundled world topology used by the globe.

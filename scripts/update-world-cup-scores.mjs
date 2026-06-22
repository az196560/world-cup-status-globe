import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const dataPath = path.join(root, "app/data/worldCupData.ts");
const scoreboardUrl =
  process.env.WORLD_CUP_SCOREBOARD_URL ??
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=200";
const updateDelayAfterKickoffMinutes = Number(process.env.WORLD_CUP_UPDATE_DELAY_MINUTES ?? 240);
const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");
const now = process.env.WORLD_CUP_UPDATE_NOW ? new Date(process.env.WORLD_CUP_UPDATE_NOW) : new Date();

const espnNameToLocal = new Map([
  ["Bosnia-Herzegovina", "Bosnia and Herzegovina"],
  ["Congo DR", "DR Congo"],
  ["Ivory Coast", "Côte d’Ivoire"],
]);

function localName(name) {
  return espnNameToLocal.get(name) ?? name;
}

function normalizeKey(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function normalizeVenue(value) {
  return normalizeKey(value).replace(/^at t\b/, "att");
}

function isKnownTeamName(name, matches) {
  return matches.some((match) => match.home === name || match.away === name);
}

function extractArray(source, exportName) {
  const marker = `export const ${exportName}`;
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error(`Cannot find ${marker}`);
  const assignmentIndex = source.indexOf("=", markerIndex);
  if (assignmentIndex < 0) throw new Error(`Cannot find ${exportName} assignment`);
  const start = source.indexOf("[", assignmentIndex);
  if (start < 0) throw new Error(`Cannot find ${exportName} array start`);

  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = "";
      }
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        return {
          start,
          end: index + 1,
          text: source.slice(start, index + 1),
        };
      }
    }
  }
  throw new Error(`Cannot find ${exportName} array end`);
}

function evaluateArray(arrayText, exportName) {
  try {
    return vm.runInNewContext(arrayText, {}, { timeout: 1000 });
  } catch (error) {
    throw new Error(`Cannot parse ${exportName}: ${error.message}`);
  }
}

function formatValue(value) {
  return JSON.stringify(value);
}

function formatMatch(match) {
  const fields = [
    `group: ${formatValue(match.group)}`,
    `date: ${formatValue(match.date)}`,
    `home: ${formatValue(match.home)}`,
    `away: ${formatValue(match.away)}`,
  ];
  if (match.homeScore !== undefined) fields.push(`homeScore: ${match.homeScore}`);
  if (match.awayScore !== undefined) fields.push(`awayScore: ${match.awayScore}`);
  fields.push(`venue: ${formatValue(match.venue)}`);
  fields.push(`status: ${formatValue(match.status)}`);
  return `  { ${fields.join(", ")} }`;
}

function formatKnockoutMatch(match) {
  const fields = [
    `matchNumber: ${match.matchNumber}`,
    `round: ${formatValue(match.round)}`,
    `date: ${formatValue(match.date)}`,
    `time: ${formatValue(match.time)}`,
    `timezone: ${formatValue(match.timezone)}`,
    `home: ${formatValue(match.home)}`,
    `away: ${formatValue(match.away)}`,
  ];
  if (match.homeScore !== undefined) fields.push(`homeScore: ${match.homeScore}`);
  if (match.awayScore !== undefined) fields.push(`awayScore: ${match.awayScore}`);
  if (match.status !== undefined) fields.push(`status: ${formatValue(match.status)}`);
  fields.push(`venue: ${formatValue(match.venue)}`);
  fields.push(`city: ${formatValue(match.city)}`);
  return `  { ${fields.join(", ")} }`;
}

function blockFor(items, formatter) {
  return `[\n${items.map(formatter).join(",\n")},\n]`;
}

function eventCompetitors(event) {
  const competition = event.competitions?.[0];
  const home = competition?.competitors?.find((competitor) => competitor.homeAway === "home");
  const away = competition?.competitors?.find((competitor) => competitor.homeAway === "away");
  if (!competition || !home || !away) return null;
  return { competition, home, away };
}

function finalEnoughToPublish(event, competition) {
  if (!competition.status?.type?.completed) return false;
  if (force) return true;
  const kickoff = new Date(event.date);
  const publishAfter = new Date(kickoff.getTime() + updateDelayAfterKickoffMinutes * 60 * 1000);
  return now >= publishAfter;
}

function statusForEvent(event, competition) {
  if (finalEnoughToPublish(event, competition)) return "final";
  if (competition.status?.type?.state === "in") return "live";
  return "scheduled";
}

function score(competitor) {
  const parsed = Number.parseInt(competitor.score, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function pacificDateLabel(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function updateFreshness(source) {
  const date = pacificDateLabel(now);
  return source
    .replace(/asOf: "[^"]+"/, `asOf: "${date}"`)
    .replace(/label: "截至 [^"]+"/, `label: "截至 ${date}（美国太平洋时间）"`);
}

const source = fs.readFileSync(dataPath, "utf8");
const matchesArray = extractArray(source, "matches");
const knockoutArray = extractArray(source, "knockoutMatches");
const matches = evaluateArray(matchesArray.text, "matches");
const knockoutMatches = evaluateArray(knockoutArray.text, "knockoutMatches");

const response = await fetch(scoreboardUrl);
if (!response.ok) {
  throw new Error(`ESPN scoreboard returned ${response.status}`);
}
const scoreboard = await response.json();
const events = scoreboard.events ?? [];

const eventByTeams = new Map();
const eventByDateVenue = new Map();
for (const event of events) {
  const parsed = eventCompetitors(event);
  if (!parsed) continue;
  const home = localName(parsed.home.team.displayName);
  const away = localName(parsed.away.team.displayName);
  eventByTeams.set(`${normalizeKey(home)}|${normalizeKey(away)}`, { event, ...parsed, homeName: home, awayName: away });
  eventByDateVenue.set(`${event.date.slice(0, 10)}|${normalizeVenue(parsed.competition.venue?.fullName ?? "")}`, {
    event,
    ...parsed,
    homeName: home,
    awayName: away,
  });
}

let groupUpdates = 0;
let knockoutUpdates = 0;
const nextMatches = matches.map((match) => {
  const entry = eventByTeams.get(`${normalizeKey(match.home)}|${normalizeKey(match.away)}`);
  if (!entry) return match;
  const nextStatus = statusForEvent(entry.event, entry.competition);
  if (nextStatus !== "final") return match;
  const homeScore = score(entry.home);
  const awayScore = score(entry.away);
  if (homeScore === undefined || awayScore === undefined) return match;
  const next = { ...match, homeScore, awayScore, status: "final" };
  if (JSON.stringify(next) !== JSON.stringify(match)) groupUpdates += 1;
  return next;
});

const nextKnockoutMatches = knockoutMatches.map((match) => {
  const entry = eventByDateVenue.get(`${match.date}|${normalizeVenue(match.venue)}`);
  if (!entry) return match;

  const next = { ...match };
  const eventHomeIsKnown = isKnownTeamName(entry.homeName, matches);
  const eventAwayIsKnown = isKnownTeamName(entry.awayName, matches);
  if (eventHomeIsKnown) next.home = entry.homeName;
  if (eventAwayIsKnown) next.away = entry.awayName;

  const nextStatus = statusForEvent(entry.event, entry.competition);
  if (nextStatus === "final") {
    const homeScore = score(entry.home);
    const awayScore = score(entry.away);
    if (homeScore !== undefined && awayScore !== undefined) {
      next.homeScore = homeScore;
      next.awayScore = awayScore;
      next.status = "final";
    }
  }

  if (JSON.stringify(next) !== JSON.stringify(match)) knockoutUpdates += 1;
  return next;
});

let nextSource = source;
if (groupUpdates || knockoutUpdates) {
  nextSource = `${nextSource.slice(0, matchesArray.start)}${blockFor(nextMatches, formatMatch)}${nextSource.slice(matchesArray.end)}`;
}
const nextKnockoutArray = extractArray(nextSource, "knockoutMatches");
if (groupUpdates || knockoutUpdates) {
  nextSource = `${nextSource.slice(0, nextKnockoutArray.start)}${blockFor(nextKnockoutMatches, formatKnockoutMatch)}${nextSource.slice(nextKnockoutArray.end)}`;
}
if (groupUpdates || knockoutUpdates) nextSource = updateFreshness(nextSource);

if (nextSource !== source && !dryRun) {
  fs.writeFileSync(dataPath, nextSource);
}

console.log(
  JSON.stringify(
    {
      dryRun,
      force,
      now: now.toISOString(),
      events: events.length,
      groupUpdates,
      knockoutUpdates,
      changed: nextSource !== source,
    },
    null,
    2,
  ),
);

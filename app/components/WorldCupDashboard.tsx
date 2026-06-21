"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Filter,
  GitBranch,
  Globe2,
  MapPin,
  RotateCcw,
  Search,
  Trophy,
} from "lucide-react";
import {
  geoDistance,
  geoGraticule10,
  geoOrthographic,
  geoPath,
  type GeoPermissibleObjects,
} from "d3-geo";
import { feature } from "topojson-client";
import qualifyingData from "@/app/data/qualifying-records.json";
import {
  countryAliases,
  dataFreshness,
  knockoutMatches,
  matches,
  sources,
  teams,
  type Match,
  type TournamentTeam,
} from "@/app/data/worldCupData";

type QualifyingRecord = {
  team: string;
  confed: string;
  status: "qualified" | "eliminated";
  stage: string;
  group?: string;
  position?: number | null;
  points?: number | null;
};

type StandingRow = {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
};

type CountryFeature = GeoJSON.Feature<GeoJSON.Geometry, { name?: string }>;
type SelectionTarget = { name: string; kind: "country" | "team" } | null;

type Topology = {
  objects: {
    countries: unknown;
  };
};

const records = qualifyingData.records as QualifyingRecord[];
const recordByTeam = new Map(records.map((record) => [record.team, record]));
const teamByName = new Map(teams.map((team) => [team.name, team]));
const teamsByGroup = new Map<string, TournamentTeam[]>();

for (const team of teams) {
  const groupTeams = teamsByGroup.get(team.group) ?? [];
  groupTeams.push(team);
  teamsByGroup.set(team.group, groupTeams);
}

const statusLabels = {
  all: "全部",
  finals: "决赛圈",
  eliminated: "预选赛淘汰",
};

const groupLetters = Array.from(teamsByGroup.keys()).sort();
const bracketRoundOrder = [
  "Round of 32",
  "Round of 16",
  "Quarterfinals",
  "Semifinals",
  "Final",
] as const;

const bracketMatchOrder: Record<(typeof bracketRoundOrder)[number], number[]> = {
  "Round of 32": [74, 77, 73, 75, 83, 84, 81, 82, 76, 78, 79, 80, 86, 88, 85, 87],
  "Round of 16": [89, 90, 93, 94, 91, 92, 95, 96],
  Quarterfinals: [97, 98, 99, 100],
  Semifinals: [101, 102],
  Final: [104],
};

const knockoutRoundLabels: Record<(typeof bracketRoundOrder)[number] | "Third place", string> = {
  "Round of 32": "32 强",
  "Round of 16": "16 强",
  Quarterfinals: "1/4 决赛",
  Semifinals: "半决赛",
  Final: "决赛",
  "Third place": "三四名",
};

const bracketSlotHeight = 184;
const bracketCardHeight = 164;

function bracketTop(round: (typeof bracketRoundOrder)[number], index: number) {
  const roundIndex = bracketRoundOrder.indexOf(round);
  const span = 2 ** roundIndex;
  return index * bracketSlotHeight * span + ((span - 1) * bracketSlotHeight) / 2;
}

function bracketCardStyle(round: (typeof bracketRoundOrder)[number], index: number) {
  const roundIndex = bracketRoundOrder.indexOf(round);
  return {
    "--card-top": `${bracketTop(round, index)}px`,
    "--card-height": `${bracketCardHeight}px`,
    "--branch-height": `${Math.max(1, 2 ** roundIndex) * bracketSlotHeight}px`,
  } as CSSProperties;
}

function normalizeName(name: string) {
  return countryAliases[name] ?? name;
}

function calculateStandings(group: string): StandingRow[] {
  const rows = new Map<string, StandingRow>();

  for (const team of teamsByGroup.get(group) ?? []) {
    rows.set(team.name, {
      team: team.name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
    });
  }

  for (const match of matches.filter((item) => item.group === group && item.status === "final")) {
    if (match.homeScore === undefined || match.awayScore === undefined) continue;
    const home = rows.get(match.home);
    const away = rows.get(match.away);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.gf += match.homeScore;
    home.ga += match.awayScore;
    away.gf += match.awayScore;
    away.ga += match.homeScore;
    home.gd = home.gf - home.ga;
    away.gd = away.gf - away.ga;

    if (match.homeScore > match.awayScore) {
      home.won += 1;
      away.lost += 1;
      home.points += 3;
    } else if (match.homeScore < match.awayScore) {
      away.won += 1;
      home.lost += 1;
      away.points += 3;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  return Array.from(rows.values()).sort((a, b) => {
    return (
      b.points - a.points ||
      b.gd - a.gd ||
      b.gf - a.gf ||
      a.team.localeCompare(b.team)
    );
  });
}

function scoreLabel(match: Match) {
  if (match.status === "live") return "进行中";
  if (match.status === "scheduled") return "待赛";
  return `${match.homeScore}-${match.awayScore}`;
}

function nextMatchFor(teamName: string) {
  return matches.find(
    (match) =>
      match.status !== "final" && (match.home === teamName || match.away === teamName),
  );
}

function latestMatchesFor(teamName: string) {
  return matches.filter((match) => match.home === teamName || match.away === teamName);
}

function groupPosition(teamName: string, group: string) {
  const standing = calculateStandings(group);
  const index = standing.findIndex((row) => row.team === teamName);
  return index >= 0 ? index + 1 : null;
}

function statusForCountry(countryName: string) {
  const teamName = normalizeName(countryName);
  const team = teamByName.get(teamName);
  if (team) return "finals";
  const record = recordByTeam.get(teamName);
  if (record?.status === "eliminated") return "eliminated";
  return "unknown";
}

function countryFill(status: string, isSelected: boolean) {
  if (isSelected) return "#ffd166";
  if (status === "finals") return "#1b9aaa";
  if (status === "eliminated") return "#d46a6a";
  return "#d7dde7";
}

function recordForTeam(teamName: string) {
  return recordByTeam.get(teamName);
}

function makeRows() {
  const byName = new Map<string, QualifyingRecord & { tournament?: TournamentTeam }>();

  for (const record of records) byName.set(record.team, { ...record });
  for (const team of teams) {
    const record = byName.get(team.name);
    byName.set(team.name, {
      team: team.name,
      confed: team.confed,
      status: "qualified",
      stage: record?.stage ?? "晋级 2026 世界杯决赛圈",
      tournament: team,
    });
  }

  return Array.from(byName.values()).sort((a, b) => {
    const aRank = a.status === "qualified" ? 0 : 1;
    const bRank = b.status === "qualified" ? 0 : 1;
    return aRank - bRank || a.team.localeCompare(b.team);
  });
}

export function WorldCupDashboard() {
  const [features, setFeatures] = useState<CountryFeature[]>([]);
  const [rotation, setRotation] = useState<[number, number]>([-18, -18]);
  const [selectedTeam, setSelectedTeam] = useState("United States");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "finals" | "eliminated">("all");
  const [activeGroup, setActiveGroup] = useState("D");
  const dragState = useRef<{
    x: number;
    y: number;
    rotation: [number, number];
    candidate: SelectionTarget;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/countries-110m.json")
      .then((response) => response.json())
      .then((topology: Topology) => {
        if (cancelled) return;
        const collection = feature(
          topology as never,
          topology.objects.countries as never,
        ) as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name?: string }>;
        setFeatures(collection.features as CountryFeature[]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => makeRows(), []);
  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery =
        !normalized ||
        row.team.toLowerCase().includes(normalized) ||
        row.confed.toLowerCase().includes(normalized) ||
        row.stage.toLowerCase().includes(normalized);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "finals" && row.status === "qualified") ||
        (statusFilter === "eliminated" && row.status === "eliminated");
      return matchesQuery && matchesStatus;
    });
  }, [query, rows, statusFilter]);

  const selectedTournamentTeam = teamByName.get(selectedTeam);
  const selectedRecord = recordForTeam(selectedTeam);
  const selectedStatus = selectedTournamentTeam
    ? "finals"
    : selectedRecord
      ? "eliminated"
      : "unknown";
  const selectedMatches = latestMatchesFor(selectedTeam);
  const selectedNext = nextMatchFor(selectedTeam);
  const selectedGroupPosition = selectedTournamentTeam
    ? groupPosition(selectedTournamentTeam.name, selectedTournamentTeam.group)
    : null;
  const bracketByRound = useMemo(() => {
    return bracketRoundOrder.map((round) => ({
      round,
      matches: knockoutMatches
        .filter((match) => match.round === round)
        .sort(
          (left, right) =>
            bracketMatchOrder[round].indexOf(left.matchNumber) -
            bracketMatchOrder[round].indexOf(right.matchNumber),
        ),
    }));
  }, []);
  const thirdPlaceMatch = knockoutMatches.find((match) => match.round === "Third place");

  const projection = useMemo(() => {
    return geoOrthographic()
      .rotate(rotation)
      .scale(330)
      .translate([360, 360])
      .clipAngle(90);
  }, [rotation]);

  const path = useMemo(() => geoPath(projection), [projection]);
  const selectedCountryName = selectedTournamentTeam?.name ?? selectedTeam;
  const visibleCenter: [number, number] = [-rotation[0], -rotation[1]];
  const visibleMarkers = teams
    .map((team) => {
      const isFrontFacing =
        geoDistance([team.lon, team.lat], visibleCenter) <= Math.PI / 2;
      if (!isFrontFacing) return null;
      const point = projection([team.lon, team.lat]);
      if (!point) return null;
      return {
        team,
        x: Number(point[0].toFixed(3)),
        y: Number(point[1].toFixed(3)),
      };
    })
    .filter(Boolean) as { team: TournamentTeam; x: number; y: number }[];

  function selectTeam(teamName: string) {
    const team = teamByName.get(teamName);
    setSelectedTeam(teamName);
    if (team) {
      setActiveGroup(team.group);
      setRotation([-team.lon, -team.lat]);
    }
  }

  function onPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    const target = event.target as Element;
    const countryName = target.getAttribute("data-country");
    const teamName = target.getAttribute("data-team");
    const candidate = teamName
      ? { name: teamName, kind: "team" as const }
      : countryName
        ? { name: countryName, kind: "country" as const }
        : null;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = { x: event.clientX, y: event.clientY, rotation, candidate, moved: false };
  }

  function onPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!dragState.current) return;
    const dx = event.clientX - dragState.current.x;
    const dy = event.clientY - dragState.current.y;
    if (Math.hypot(dx, dy) > 4) dragState.current.moved = true;
    const nextLon = dragState.current.rotation[0] + dx * 0.45;
    const nextLat = Math.max(-65, Math.min(65, dragState.current.rotation[1] - dy * 0.35));
    setRotation([nextLon, nextLat]);
  }

  function onPointerUp(event: React.PointerEvent<SVGSVGElement>) {
    const state = dragState.current;
    if (state && !state.moved && state.candidate) {
      selectTeam(state.candidate.name);
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragState.current = null;
  }

  return (
    <main className="site-shell">
      <section className="hero-band">
        <div className="hero-copy">
          <div className="eyebrow">
            <Globe2 size={16} aria-hidden="true" />
            FIFA World Cup 26
          </div>
          <h1>2026 世界杯状态地球仪</h1>
          <p>{dataFreshness.label}</p>
        </div>

        <div className="metric-strip">
          <div>
            <span>{teams.length}</span>
            <small>决赛圈球队</small>
          </div>
          <div>
            <span>{records.length}</span>
            <small>资格赛记录</small>
          </div>
          <div>
            <span>{matches.filter((match) => match.status === "final").length}</span>
            <small>已录入比分</small>
          </div>
        </div>
      </section>

      <section className="workspace">
        <div className="globe-panel">
          <div className="panel-title">
            <div>
              <h2>世界状态</h2>
              <p>青色：决赛圈；红色：预选赛淘汰；灰色：主数据未覆盖</p>
            </div>
            <button
              className="icon-button"
              type="button"
              aria-label="重置视角"
              title="重置视角"
              onClick={() => setRotation([-18, -18])}
            >
              <RotateCcw size={18} />
            </button>
          </div>

          <svg
            className="globe"
            viewBox="0 0 720 720"
            role="img"
            aria-label="2026 世界杯国家状态地球仪"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <path className="sphere" d={path({ type: "Sphere" } as GeoPermissibleObjects) ?? ""} />
            <path className="graticule" d={path(geoGraticule10()) ?? ""} />
            {features.map((country, index) => {
              const name = normalizeName(country.properties?.name ?? "");
              const status = statusForCountry(name);
              const isSelected = normalizeName(name) === selectedCountryName;
              return (
                <path
                  key={`${name}-${index}`}
                  d={path(country as GeoPermissibleObjects) ?? ""}
                  fill={countryFill(status, isSelected)}
                  className={name ? "country clickable-country" : "country"}
                  data-country={name}
                >
                  <title>{name}</title>
                </path>
              );
            })}
            {visibleMarkers.map(({ team, x, y }) => (
              <g key={team.name}>
                <circle
                  cx={x}
                  cy={y}
                  r={15}
                  className="team-hit"
                  data-team={team.name}
                />
                <circle
                  cx={x}
                  cy={y}
                  r={team.name === selectedTeam ? 7 : 4}
                  className={team.name === selectedTeam ? "team-dot selected" : "team-dot"}
                  data-team={team.name}
                />
                <title>{team.name}</title>
              </g>
            ))}
          </svg>
        </div>

        <aside className="detail-panel">
          <div className="panel-title">
            <div>
              <h2>{selectedTeam}</h2>
              <p>
                {selectedTournamentTeam
                  ? `${selectedTournamentTeam.confed} · ${selectedTournamentTeam.group} 组`
                  : selectedRecord?.confed ?? "主数据未覆盖"}
              </p>
            </div>
            <span className={`status-pill ${selectedStatus}`}>
              {selectedStatus === "finals"
                ? "决赛圈"
                : selectedStatus === "eliminated"
                  ? "预选赛"
                  : "未覆盖"}
            </span>
          </div>

          <div className="status-summary">
            <Trophy size={18} aria-hidden="true" />
            <span>
              {selectedTournamentTeam?.currentStatus ??
                selectedRecord?.stage ??
                "这个国家/地区可以在地球仪上选中，但当前数据集没有精确到它的 2026 世界杯资格赛阶段。"}
            </span>
          </div>

          {selectedTournamentTeam ? (
            <>
              <div className="detail-grid">
                <div>
                  <small>小组排名</small>
                  <strong>{selectedGroupPosition ? `${selectedGroupPosition}` : "—"}</strong>
                </div>
                <div>
                  <small>球队代码</small>
                  <strong>{selectedTournamentTeam.code}</strong>
                </div>
                <div>
                  <small>下一场</small>
                  <strong>{selectedNext ? selectedNext.date.slice(5) : "—"}</strong>
                </div>
              </div>

              <div className="match-list">
                {selectedMatches.map((match) => (
                  <div className="match-row" key={`${match.date}-${match.home}-${match.away}`}>
                    <span>{match.date.slice(5)}</span>
                    <strong>
                      {match.home} {scoreLabel(match)} {match.away}
                    </strong>
                    <small>{match.venue}</small>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="data-note">{selectedRecord?.stage ?? "该国家/协会未在当前资格赛主表中定位。"}</p>
          )}
        </aside>
      </section>

      <section className="controls-band">
        <label className="search-box">
          <Search size={18} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索球队、洲际足联或阶段"
          />
        </label>
        <div className="segmented" aria-label="状态过滤">
          {(Object.keys(statusLabels) as Array<keyof typeof statusLabels>).map((key) => (
            <button
              key={key}
              type="button"
              className={statusFilter === key ? "active" : ""}
              onClick={() => setStatusFilter(key)}
            >
              <Filter size={15} aria-hidden="true" />
              {statusLabels[key]}
            </button>
          ))}
        </div>
      </section>

      <section className="tables-layout">
        <div className="standings-panel">
          <div className="panel-title">
            <div>
              <h2>小组积分</h2>
              <p>{activeGroup} 组</p>
            </div>
            <div className="group-tabs">
              {groupLetters.map((group) => (
                <button
                  key={group}
                  type="button"
                  className={activeGroup === group ? "active" : ""}
                  onClick={() => setActiveGroup(group)}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>队</th>
                  <th>赛</th>
                  <th>胜</th>
                  <th>平</th>
                  <th>负</th>
                  <th>净</th>
                  <th>分</th>
                </tr>
              </thead>
              <tbody>
                {calculateStandings(activeGroup).map((row) => (
                  <tr key={row.team} onClick={() => selectTeam(row.team)}>
                    <td>{row.team}</td>
                    <td>{row.played}</td>
                    <td>{row.won}</td>
                    <td>{row.drawn}</td>
                    <td>{row.lost}</td>
                    <td>{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                    <td>
                      <strong>{row.points}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="records-panel">
          <div className="panel-title">
            <div>
              <h2>全部状态</h2>
              <p>{filteredRows.length} 条</p>
            </div>
            <CalendarDays size={18} aria-hidden="true" />
          </div>
          <div className="record-list">
            {filteredRows.map((row) => (
              <button
                key={row.team}
                type="button"
                className="record-row"
                onClick={() => selectTeam(row.team)}
              >
                <span>{row.team}</span>
                <small>{row.confed || row.tournament?.confed || "—"}</small>
                <strong>{row.tournament ? `${row.tournament.group} 组` : row.stage}</strong>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="knockout-panel">
        <div className="panel-title">
          <div>
            <h2>淘汰赛对阵图</h2>
            <p>比赛编号 73-104；时间为场馆当地时间，未定席位以小组名或胜者编号显示</p>
          </div>
          <GitBranch size={20} aria-hidden="true" />
        </div>
        <div className="bracket-scroller">
          <div className="bracket-grid tree-bracket">
            {bracketByRound.map(({ round, matches: roundMatches }) => (
              <section className="bracket-column" key={round}>
                <h3>{knockoutRoundLabels[round]}</h3>
                <div className="bracket-stack">
                  {roundMatches.map((match, index) => (
                    <article
                      className="bracket-card tree-card"
                      data-round={round}
                      data-slot={index}
                      style={bracketCardStyle(round, index)}
                      key={match.matchNumber}
                    >
                      <div className="match-id">Match {match.matchNumber}</div>
                      <div className="bracket-teams">
                        <strong>{match.home}</strong>
                        <span>vs</span>
                        <strong>{match.away}</strong>
                      </div>
                      <div className="bracket-meta">
                        <span>
                          <Clock3 size={14} aria-hidden="true" />
                          {match.date.slice(5)} · {match.time} {match.timezone}
                        </span>
                        <span>
                          <MapPin size={14} aria-hidden="true" />
                          {match.venue} · {match.city}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
          {thirdPlaceMatch ? (
            <article className="third-place-card">
              <div>
                <h3>{knockoutRoundLabels["Third place"]}</h3>
                <div className="match-id">Match {thirdPlaceMatch.matchNumber}</div>
              </div>
              <div className="bracket-teams">
                <strong>{thirdPlaceMatch.home}</strong>
                <span>vs</span>
                <strong>{thirdPlaceMatch.away}</strong>
              </div>
              <div className="bracket-meta">
                <span>
                  <Clock3 size={14} aria-hidden="true" />
                  {thirdPlaceMatch.date.slice(5)} · {thirdPlaceMatch.time} {thirdPlaceMatch.timezone}
                </span>
                <span>
                  <MapPin size={14} aria-hidden="true" />
                  {thirdPlaceMatch.venue} · {thirdPlaceMatch.city}
                </span>
              </div>
            </article>
          ) : null}
        </div>
      </section>

      <footer className="source-bar">
        <div>
          {dataFreshness.notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
        <div className="source-links">
          {sources.map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
              {source.label}
            </a>
          ))}
        </div>
      </footer>
    </main>
  );
}

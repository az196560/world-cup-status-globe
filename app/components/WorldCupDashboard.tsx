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
  associationMapPoints,
  countryAliases,
  dataFreshness,
  knockoutMatches,
  matches,
  sources,
  teams,
  type Match,
  type TournamentTeam,
} from "@/app/data/worldCupData";
import {
  compactRegionLabel,
  confedLabel,
  confedName,
  confedShortName,
  regionLabel,
  regionName,
  type Language,
} from "@/app/data/regionMeta";

type QualifyingRecord = {
  team: string;
  confed: string;
  status: "qualified" | "eliminated" | "not_entered";
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

const statusKeys = ["all", "finals", "eliminated", "not_entered"] as const;
type StatusFilter = (typeof statusKeys)[number];

const copy = {
  zh: {
    all: "全部",
    bracket: "淘汰赛对阵图",
    bracketHint: "比赛编号 73-104；时间为场馆当地时间，未定席位以小组名或胜者编号显示",
    code: "球队代码",
    dataMissing: "该国家/协会未在当前资格赛主表中定位。",
    eliminated: "预选赛淘汰",
    finals: "决赛圈",
    globeAlt: "2026 世界杯国家状态地球仪",
    globeLegend: "青色：决赛圈；红色：预选赛淘汰；紫色：未参赛；灰色：主数据未覆盖",
    globeTitle: "世界状态",
    group: "组",
    language: "English",
    latestDataGap: "这个国家/地区可以在地球仪上选中，但当前数据集没有精确到它的 2026 世界杯资格赛阶段。",
    nextMatch: "下一场",
    not_entered: "未参赛",
    points: "分",
    position: "小组排名",
    recordCount: "资格赛记录",
    recordList: "全部状态",
    reset: "重置视角",
    rows: "条",
    scoredMatches: "已录入比分",
    search: "搜索球队、国家/地区、洲际足联或阶段",
    standings: "小组积分",
    title: "2026 世界杯状态地球仪",
    tournamentTeams: "决赛圈球队",
    unknown: "未覆盖",
    played: "赛",
    won: "胜",
    drawn: "平",
    lost: "负",
    gd: "净",
    team: "队",
    scheduled: "待赛",
    live: "进行中",
  },
  en: {
    all: "All",
    bracket: "Knockout Bracket",
    bracketHint: "Matches 73-104; times are local to the venue, and undecided slots use group or winner labels",
    code: "Team code",
    dataMissing: "This association is selectable on the globe, but this data set has not mapped its exact 2026 qualifying stage.",
    eliminated: "Eliminated in qualifying",
    finals: "Finals",
    globeAlt: "2026 World Cup country status globe",
    globeLegend: "Teal: finals; red: eliminated; purple: did not enter; gray: not covered",
    globeTitle: "World Status",
    group: "Group",
    language: "中文",
    latestDataGap: "This country or association is selectable on the globe, but this data set has not mapped its exact 2026 World Cup qualifying stage.",
    nextMatch: "Next match",
    not_entered: "Did not enter",
    points: "Pts",
    position: "Group rank",
    recordCount: "Qualifying records",
    recordList: "All Statuses",
    reset: "Reset view",
    rows: "rows",
    scoredMatches: "Scores entered",
    search: "Search team, country/region, confederation, or stage",
    standings: "Group Standings",
    title: "2026 World Cup Status Globe",
    tournamentTeams: "Finals teams",
    unknown: "Not covered",
    played: "P",
    won: "W",
    drawn: "D",
    lost: "L",
    gd: "GD",
    team: "Team",
    scheduled: "Scheduled",
    live: "Live",
  },
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

const knockoutRoundLabelsEn: Record<(typeof bracketRoundOrder)[number] | "Third place", string> = {
  "Round of 32": "Round of 32",
  "Round of 16": "Round of 16",
  Quarterfinals: "Quarterfinals",
  Semifinals: "Semifinals",
  Final: "Final",
  "Third place": "Third place",
};

function knockoutLabel(round: (typeof bracketRoundOrder)[number] | "Third place", language: Language) {
  return language === "zh" ? knockoutRoundLabels[round] : knockoutRoundLabelsEn[round];
}

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

function scoreLabel(match: Match, language: Language) {
  if (match.status === "live") return copy[language].live;
  if (match.status === "scheduled") return copy[language].scheduled;
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
  const record = recordByTeam.get(teamName) ?? recordByTeam.get(countryName);
  if (record?.status === "eliminated") return "eliminated";
  if (record?.status === "not_entered") return "not_entered";
  return "unknown";
}

function countryFill(status: string, isSelected: boolean) {
  if (isSelected) return "#ffd166";
  if (status === "finals") return "#1b9aaa";
  if (status === "eliminated") return "#d46a6a";
  if (status === "not_entered") return "#8f7bd8";
  return "#d7dde7";
}

function recordForTeam(teamName: string) {
  return recordByTeam.get(teamName) ?? recordByTeam.get(normalizeName(teamName));
}

function statusLabel(status: string, language: Language) {
  if (status === "finals" || status === "qualified") return copy[language].finals;
  if (status === "eliminated") return copy[language].eliminated;
  if (status === "not_entered") return copy[language].not_entered;
  return copy[language].unknown;
}

function groupLabel(group: string, language: Language) {
  return language === "zh" ? `${group} 组` : `Group ${group}`;
}

function confedStageLabel(stage: string, language: Language) {
  return (["CONCACAF", "CONMEBOL", "UEFA", "AFC", "CAF", "OFC"] as const).reduce(
    (label, confed) => label.replaceAll(confed, confedShortName(confed, language)),
    stage,
  );
}

function stageLabel(stage: string, language: Language) {
  if (language === "zh") return confedStageLabel(stage, language);
  return confedStageLabel(stage, language)
    .replaceAll("晋级 2026 世界杯决赛圈；", "Qualified for the 2026 World Cup finals; ")
    .replaceAll("晋级 2026 世界杯决赛圈", "Qualified for the 2026 World Cup finals")
    .replaceAll("主办国自动晋级，未参加 CONCACAF 预选赛；", "Qualified automatically as host; did not play CONCACAF qualifying; ")
    .replaceAll("主办国自动晋级，未参加 CONCACAF 预选赛", "Qualified automatically as host; did not play CONCACAF qualifying")
    .replaceAll("未参加 2026 世界杯预选赛：", "Did not enter 2026 World Cup qualifying: ")
    .replaceAll("不是 FIFA 成员；", "Not a FIFA member; ")
    .replaceAll("自 2022 年起暂停俄罗斯国家队参加旗下赛事", "Russian national teams have been suspended from FIFA/UEFA competitions since 2022")
    .replaceAll("厄立特里亚足协在赛前退出，FIFA/CAF 确认其所有比赛取消", "Eritrea withdrew before playing; FIFA/CAF confirmed its matches were cancelled")
    .replaceAll("曾可通过 2027 亚洲杯资格赛路径参赛，但未进入 2026 世界杯预选赛抽签", "had an AFC Asian Cup qualifying route but did not enter the 2026 World Cup qualifying draw")
    .replaceAll("第一轮", "first round")
    .replaceAll("第二轮", "second round")
    .replaceAll("第三轮", "third round")
    .replaceAll("第四轮", "fourth round")
    .replaceAll("小组赛", "group stage")
    .replaceAll("半决赛", "semifinal")
    .replaceAll("决赛", "final")
    .replaceAll("附加赛", "play-off")
    .replaceAll("直接晋级", "direct qualification")
    .replaceAll("负于", "lost to")
    .replaceAll("负于新西兰；洲际附加赛未出线", "lost to New Zealand; did not qualify through the inter-confederation play-offs")
    .replaceAll("淘汰", "eliminated")
    .replaceAll("第1名", "1st")
    .replaceAll("第2名", "2nd")
    .replaceAll("第3名", "3rd")
    .replaceAll("第4名", "4th")
    .replaceAll("第5名", "5th")
    .replaceAll("第6名", "6th")
    .replaceAll("FIFA 赛事使用 Chinese Taipei 名称", "FIFA competitions use the name Chinese Taipei")
    .replaceAll("已锁定小组第一并晋级 32 强", "clinched first place in the group and advanced to the Round of 32")
    .replaceAll("已被淘汰", "eliminated")
    .replaceAll("战", " matches, ")
    .replaceAll("分", " pts")
    .replaceAll("组", "Group");
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
  const [language, setLanguage] = useState<Language>("zh");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [activeGroup, setActiveGroup] = useState("D");
  const text = copy[language];
  const dragState = useRef<{
    x: number;
    y: number;
    rotation: [number, number];
    candidate: SelectionTarget;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("countries-110m.json")
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
      const zhName = regionName(row.team, "zh").toLowerCase();
      const enName = regionName(row.team, "en").toLowerCase();
      const matchesQuery =
        !normalized ||
        row.team.toLowerCase().includes(normalized) ||
        zhName.includes(normalized) ||
        enName.includes(normalized) ||
        row.confed.toLowerCase().includes(normalized) ||
        confedName(row.confed, "zh").toLowerCase().includes(normalized) ||
        confedName(row.confed, "en").toLowerCase().includes(normalized) ||
        row.stage.toLowerCase().includes(normalized) ||
        stageLabel(row.stage, "zh").toLowerCase().includes(normalized) ||
        stageLabel(row.stage, "en").toLowerCase().includes(normalized);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "finals" && row.status === "qualified") ||
        (statusFilter === "eliminated" && row.status === "eliminated") ||
        (statusFilter === "not_entered" && row.status === "not_entered");
      return matchesQuery && matchesStatus;
    });
  }, [query, rows, statusFilter]);

  const selectedTournamentTeam = teamByName.get(selectedTeam);
  const selectedRecord = recordForTeam(selectedTeam);
  const selectedStatus = selectedTournamentTeam
    ? "finals"
    : selectedRecord
      ? selectedRecord.status
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
  const visibleMarkers = associationMapPoints
    .map((association) => {
      const isFrontFacing =
        geoDistance([association.lon, association.lat], visibleCenter) <= Math.PI / 2;
      if (!isFrontFacing) return null;
      const point = projection([association.lon, association.lat]);
      if (!point) return null;
      return {
        association,
        x: Number(point[0].toFixed(3)),
        y: Number(point[1].toFixed(3)),
      };
    })
    .filter(Boolean) as { association: (typeof associationMapPoints)[number]; x: number; y: number }[];

  function selectTeam(teamName: string) {
    const team = teamByName.get(teamName);
    const association = associationMapPoints.find((item) => item.name === teamName);
    setSelectedTeam(teamName);
    if (team) {
      setActiveGroup(team.group);
      setRotation([-team.lon, -team.lat]);
    } else if (association) {
      setRotation([-association.lon, -association.lat]);
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
          <h1>{text.title}</h1>
          <p>{language === "zh" ? dataFreshness.label : `As of ${dataFreshness.asOf} (US Pacific Time)`}</p>
        </div>

        <div className="metric-strip">
          <div>
            <span>{teams.length}</span>
            <small>{text.tournamentTeams}</small>
          </div>
          <div>
            <span>{records.length}</span>
            <small>{text.recordCount}</small>
          </div>
          <div>
            <span>{matches.filter((match) => match.status === "final").length}</span>
            <small>{text.scoredMatches}</small>
          </div>
          <button
            className="language-toggle"
            type="button"
            onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
          >
            {text.language}
          </button>
        </div>
      </section>

      <section className="workspace">
        <div className="globe-panel">
          <div className="panel-title">
            <div>
              <h2>{text.globeTitle}</h2>
              <p>{text.globeLegend}</p>
            </div>
            <button
              className="icon-button"
              type="button"
              aria-label={text.reset}
              title={text.reset}
              onClick={() => setRotation([-18, -18])}
            >
              <RotateCcw size={18} />
            </button>
          </div>

          <svg
            className="globe"
            viewBox="0 0 720 720"
            role="img"
            aria-label={text.globeAlt}
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
                  <title>{regionLabel(name, language)}</title>
                </path>
              );
            })}
            {visibleMarkers.map(({ association, x, y }) => {
              const markerStatus = statusForCountry(association.name);
              const selected = association.name === selectedTeam;
              return (
              <g key={association.name}>
                <circle
                  cx={x}
                  cy={y}
                  r={14}
                  className="team-hit"
                  data-team={association.name}
                />
                <circle
                  cx={x}
                  cy={y}
                  r={selected ? 7 : 4.5}
                  className={`team-dot ${markerStatus}${selected ? " selected" : ""}`}
                  data-team={association.name}
                />
                <title>{regionLabel(association.name, language)}</title>
              </g>
              );
            })}
          </svg>
        </div>

        <aside className="detail-panel">
          <div className="panel-title">
            <div>
              <h2>{regionLabel(selectedTeam, language)}</h2>
              <p>
                {selectedTournamentTeam
                  ? `${confedLabel(selectedTournamentTeam.confed, language)} · ${groupLabel(selectedTournamentTeam.group, language)}`
                  : selectedRecord?.confed
                    ? confedLabel(selectedRecord.confed, language)
                    : text.unknown}
              </p>
            </div>
            <span className={`status-pill ${selectedStatus}`}>
              {statusLabel(selectedStatus, language)}
            </span>
          </div>

          <div className="status-summary">
            <Trophy size={18} aria-hidden="true" />
            <span>
              {selectedTournamentTeam?.currentStatus
                ? stageLabel(selectedTournamentTeam.currentStatus, language)
                : selectedRecord?.stage
                  ? stageLabel(selectedRecord.stage, language)
                  : text.latestDataGap}
            </span>
          </div>

          {selectedTournamentTeam ? (
            <>
              <div className="detail-grid">
                <div>
                  <small>{text.position}</small>
                  <strong>{selectedGroupPosition ? `${selectedGroupPosition}` : "—"}</strong>
                </div>
                <div>
                  <small>{text.code}</small>
                  <strong>{selectedTournamentTeam.code}</strong>
                </div>
                <div>
                  <small>{text.nextMatch}</small>
                  <strong>{selectedNext ? selectedNext.date.slice(5) : "—"}</strong>
                </div>
              </div>

              <div className="match-list">
                {selectedMatches.map((match) => (
                  <div className="match-row" key={`${match.date}-${match.home}-${match.away}`}>
                    <span>{match.date.slice(5)}</span>
                    <strong>
                      {compactRegionLabel(match.home, language)} {scoreLabel(match, language)}{" "}
                      {compactRegionLabel(match.away, language)}
                    </strong>
                    <small>{match.venue}</small>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="data-note">
              {selectedRecord?.stage ? stageLabel(selectedRecord.stage, language) : text.dataMissing}
            </p>
          )}
        </aside>
      </section>

      <section className="controls-band">
        <label className="search-box">
          <Search size={18} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={text.search}
          />
        </label>
        <div className="segmented" aria-label={language === "zh" ? "状态过滤" : "Status filter"}>
          {statusKeys.map((key) => (
            <button
              key={key}
              type="button"
              className={statusFilter === key ? "active" : ""}
              onClick={() => setStatusFilter(key)}
            >
              <Filter size={15} aria-hidden="true" />
              {text[key]}
            </button>
          ))}
        </div>
      </section>

      <section className="tables-layout">
        <div className="standings-panel">
          <div className="panel-title">
            <div>
              <h2>{text.standings}</h2>
              <p>{groupLabel(activeGroup, language)}</p>
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
                  <th>{text.team}</th>
                  <th>{text.played}</th>
                  <th>{text.won}</th>
                  <th>{text.drawn}</th>
                  <th>{text.lost}</th>
                  <th>{text.gd}</th>
                  <th>{text.points}</th>
                </tr>
              </thead>
              <tbody>
                {calculateStandings(activeGroup).map((row) => (
                  <tr key={row.team} onClick={() => selectTeam(row.team)}>
                    <td>{compactRegionLabel(row.team, language)}</td>
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
              <h2>{text.recordList}</h2>
              <p>{filteredRows.length} {text.rows}</p>
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
                <span>{regionLabel(row.team, language)}</span>
                <small>{confedLabel(row.confed || row.tournament?.confed || "", language) || "—"}</small>
                <strong>
                  {row.tournament
                    ? groupLabel(row.tournament.group, language)
                    : stageLabel(row.stage, language)}
                </strong>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="knockout-panel">
        <div className="panel-title">
          <div>
            <h2>{text.bracket}</h2>
            <p>{text.bracketHint}</p>
          </div>
          <GitBranch size={20} aria-hidden="true" />
        </div>
        <div className="bracket-scroller">
          <div className="bracket-grid tree-bracket">
            {bracketByRound.map(({ round, matches: roundMatches }) => (
              <section className="bracket-column" key={round}>
                <h3>{knockoutLabel(round, language)}</h3>
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
                        <strong>{compactRegionLabel(match.home, language)}</strong>
                        <span>vs</span>
                        <strong>{compactRegionLabel(match.away, language)}</strong>
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
                <h3>{knockoutLabel("Third place", language)}</h3>
                <div className="match-id">Match {thirdPlaceMatch.matchNumber}</div>
              </div>
              <div className="bracket-teams">
                <strong>{compactRegionLabel(thirdPlaceMatch.home, language)}</strong>
                <span>vs</span>
                <strong>{compactRegionLabel(thirdPlaceMatch.away, language)}</strong>
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
            <p key={note}>{language === "zh" ? note : stageLabel(note, language)}</p>
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

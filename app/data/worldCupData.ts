export type TournamentTeam = {
  name: string;
  code: string;
  group: string;
  confed: string;
  lat: number;
  lon: number;
  currentStatus?: string;
};

export type Match = {
  group: string;
  date: string;
  home: string;
  away: string;
  homeScore?: number;
  awayScore?: number;
  venue: string;
  status: "final" | "scheduled" | "live";
};

export type KnockoutMatch = {
  matchNumber: number;
  round: "Round of 32" | "Round of 16" | "Quarterfinals" | "Semifinals" | "Third place" | "Final";
  date: string;
  time: string;
  timezone: string;
  home: string;
  away: string;
  venue: string;
  city: string;
};

export const dataFreshness = {
  asOf: "2026-06-21",
  label: "截至 2026-06-21（美国太平洋时间）",
  notes: [
    "决赛圈比分按 ESPN 赛程页和 FIFA 比赛中心整理。",
    "淘汰赛对阵图按 FIFA 已公布的比赛编号、当地开球时间和场馆整理；未定席位以小组名或胜者编号展示。",
    "资格赛阶段来自 Wikipedia 的 2026 FIFA World Cup qualification 页面表格。",
    "早期资格赛轮次未在主表完整列出的协会，会在总表里标为资料未精确到轮次。",
  ],
};

export const sources = [
  {
    label: "ESPN 2026 FIFA World Cup fixtures/results",
    url: "https://www.espn.com/soccer/story/_/id/48939282/2026-fifa-world-cup-fixtures-results-match-schedule-group-stage-knockout-rounds-bracket",
  },
  {
    label: "Wikipedia 2026 FIFA World Cup qualification",
    url: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_qualification",
  },
  {
    label: "FIFA World Cup 26 match centre",
    url: "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures",
  },
  {
    label: "Wikipedia 2026 FIFA World Cup knockout stage",
    url: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage",
  },
];

export const teams: TournamentTeam[] = [
  { name: "Mexico", code: "MEX", group: "A", confed: "CONCACAF", lat: 23.6, lon: -102.5, currentStatus: "A 组 2 战 6 分，已锁定小组第一并晋级 32 强" },
  { name: "South Korea", code: "KOR", group: "A", confed: "AFC", lat: 36.4, lon: 127.8 },
  { name: "Czechia", code: "CZE", group: "A", confed: "UEFA", lat: 49.8, lon: 15.5 },
  { name: "South Africa", code: "RSA", group: "A", confed: "CAF", lat: -30.6, lon: 22.9 },
  { name: "Canada", code: "CAN", group: "B", confed: "CONCACAF", lat: 56.1, lon: -106.3 },
  { name: "Qatar", code: "QAT", group: "B", confed: "AFC", lat: 25.3, lon: 51.2 },
  { name: "Switzerland", code: "SUI", group: "B", confed: "UEFA", lat: 46.8, lon: 8.2 },
  { name: "Bosnia and Herzegovina", code: "BIH", group: "B", confed: "UEFA", lat: 44.2, lon: 17.7 },
  { name: "Brazil", code: "BRA", group: "C", confed: "CONMEBOL", lat: -10.8, lon: -52.9 },
  { name: "Haiti", code: "HAI", group: "C", confed: "CONCACAF", lat: 19.0, lon: -72.3, currentStatus: "C 组 0 分，已被淘汰" },
  { name: "Scotland", code: "SCO", group: "C", confed: "UEFA", lat: 56.5, lon: -4.2 },
  { name: "Morocco", code: "MAR", group: "C", confed: "CAF", lat: 31.8, lon: -7.1 },
  { name: "United States", code: "USA", group: "D", confed: "CONCACAF", lat: 39.8, lon: -98.6, currentStatus: "D 组 2 战 6 分，已锁定小组第一并晋级 32 强" },
  { name: "Paraguay", code: "PAR", group: "D", confed: "CONMEBOL", lat: -23.4, lon: -58.4 },
  { name: "Australia", code: "AUS", group: "D", confed: "AFC", lat: -25.3, lon: 133.8 },
  { name: "Türkiye", code: "TUR", group: "D", confed: "UEFA", lat: 39.0, lon: 35.2, currentStatus: "D 组 0 分，已被淘汰" },
  { name: "Germany", code: "GER", group: "E", confed: "UEFA", lat: 51.2, lon: 10.5, currentStatus: "E 组 2 战 6 分，已锁定小组第一并晋级 32 强" },
  { name: "Curaçao", code: "CUW", group: "E", confed: "CONCACAF", lat: 12.2, lon: -69.0 },
  { name: "Côte d’Ivoire", code: "CIV", group: "E", confed: "CAF", lat: 7.5, lon: -5.6 },
  { name: "Ecuador", code: "ECU", group: "E", confed: "CONMEBOL", lat: -1.8, lon: -78.2 },
  { name: "Netherlands", code: "NED", group: "F", confed: "UEFA", lat: 52.1, lon: 5.3 },
  { name: "Japan", code: "JPN", group: "F", confed: "AFC", lat: 36.2, lon: 138.3 },
  { name: "Sweden", code: "SWE", group: "F", confed: "UEFA", lat: 60.1, lon: 18.6 },
  { name: "Tunisia", code: "TUN", group: "F", confed: "CAF", lat: 33.9, lon: 9.6 },
  { name: "Belgium", code: "BEL", group: "G", confed: "UEFA", lat: 50.5, lon: 4.5 },
  { name: "Egypt", code: "EGY", group: "G", confed: "CAF", lat: 26.8, lon: 30.8 },
  { name: "Iran", code: "IRN", group: "G", confed: "AFC", lat: 32.4, lon: 53.7 },
  { name: "New Zealand", code: "NZL", group: "G", confed: "OFC", lat: -40.9, lon: 174.9 },
  { name: "Spain", code: "ESP", group: "H", confed: "UEFA", lat: 40.5, lon: -3.7 },
  { name: "Cape Verde", code: "CPV", group: "H", confed: "CAF", lat: 16.0, lon: -24.0 },
  { name: "Saudi Arabia", code: "KSA", group: "H", confed: "AFC", lat: 23.9, lon: 45.1 },
  { name: "Uruguay", code: "URU", group: "H", confed: "CONMEBOL", lat: -32.5, lon: -55.8 },
  { name: "France", code: "FRA", group: "I", confed: "UEFA", lat: 46.2, lon: 2.2 },
  { name: "Senegal", code: "SEN", group: "I", confed: "CAF", lat: 14.5, lon: -14.5 },
  { name: "Iraq", code: "IRQ", group: "I", confed: "AFC", lat: 33.2, lon: 43.7 },
  { name: "Norway", code: "NOR", group: "I", confed: "UEFA", lat: 60.5, lon: 8.5 },
  { name: "Argentina", code: "ARG", group: "J", confed: "CONMEBOL", lat: -38.4, lon: -63.6 },
  { name: "Algeria", code: "ALG", group: "J", confed: "CAF", lat: 28.0, lon: 1.7 },
  { name: "Austria", code: "AUT", group: "J", confed: "UEFA", lat: 47.5, lon: 14.6 },
  { name: "Jordan", code: "JOR", group: "J", confed: "AFC", lat: 31.2, lon: 36.5 },
  { name: "Portugal", code: "POR", group: "K", confed: "UEFA", lat: 39.4, lon: -8.2 },
  { name: "DR Congo", code: "COD", group: "K", confed: "CAF", lat: -2.9, lon: 23.7 },
  { name: "Uzbekistan", code: "UZB", group: "K", confed: "AFC", lat: 41.4, lon: 64.6 },
  { name: "Colombia", code: "COL", group: "K", confed: "CONMEBOL", lat: 4.6, lon: -74.3 },
  { name: "England", code: "ENG", group: "L", confed: "UEFA", lat: 52.4, lon: -1.5 },
  { name: "Croatia", code: "CRO", group: "L", confed: "UEFA", lat: 45.1, lon: 15.2 },
  { name: "Ghana", code: "GHA", group: "L", confed: "CAF", lat: 7.9, lon: -1.0 },
  { name: "Panama", code: "PAN", group: "L", confed: "CONCACAF", lat: 8.5, lon: -80.8 },
];

export const matches: Match[] = [
  { group: "A", date: "2026-06-11", home: "Mexico", away: "South Africa", homeScore: 2, awayScore: 0, venue: "Mexico City", status: "final" },
  { group: "A", date: "2026-06-11", home: "South Korea", away: "Czechia", homeScore: 2, awayScore: 1, venue: "Zapopan", status: "final" },
  { group: "A", date: "2026-06-18", home: "Czechia", away: "South Africa", homeScore: 1, awayScore: 1, venue: "Atlanta", status: "final" },
  { group: "A", date: "2026-06-18", home: "Mexico", away: "South Korea", homeScore: 1, awayScore: 0, venue: "Zapopan", status: "final" },
  { group: "A", date: "2026-06-24", home: "Czechia", away: "Mexico", venue: "Mexico City", status: "scheduled" },
  { group: "A", date: "2026-06-24", home: "South Africa", away: "South Korea", venue: "Guadalupe", status: "scheduled" },
  { group: "B", date: "2026-06-12", home: "Canada", away: "Bosnia and Herzegovina", homeScore: 1, awayScore: 1, venue: "Toronto", status: "final" },
  { group: "B", date: "2026-06-13", home: "Qatar", away: "Switzerland", homeScore: 1, awayScore: 1, venue: "Santa Clara", status: "final" },
  { group: "B", date: "2026-06-18", home: "Switzerland", away: "Bosnia and Herzegovina", homeScore: 4, awayScore: 1, venue: "Inglewood", status: "final" },
  { group: "B", date: "2026-06-18", home: "Canada", away: "Qatar", homeScore: 6, awayScore: 0, venue: "Vancouver", status: "final" },
  { group: "B", date: "2026-06-24", home: "Switzerland", away: "Canada", venue: "Vancouver", status: "scheduled" },
  { group: "B", date: "2026-06-24", home: "Bosnia and Herzegovina", away: "Qatar", venue: "Seattle", status: "scheduled" },
  { group: "C", date: "2026-06-13", home: "Brazil", away: "Morocco", homeScore: 1, awayScore: 1, venue: "East Rutherford", status: "final" },
  { group: "C", date: "2026-06-13", home: "Haiti", away: "Scotland", homeScore: 0, awayScore: 1, venue: "Foxborough", status: "final" },
  { group: "C", date: "2026-06-19", home: "Scotland", away: "Morocco", homeScore: 0, awayScore: 1, venue: "Foxborough", status: "final" },
  { group: "C", date: "2026-06-19", home: "Brazil", away: "Haiti", homeScore: 3, awayScore: 0, venue: "Philadelphia", status: "final" },
  { group: "C", date: "2026-06-24", home: "Scotland", away: "Brazil", venue: "Miami Gardens", status: "scheduled" },
  { group: "C", date: "2026-06-24", home: "Morocco", away: "Haiti", venue: "Atlanta", status: "scheduled" },
  { group: "D", date: "2026-06-12", home: "United States", away: "Paraguay", homeScore: 4, awayScore: 1, venue: "Inglewood", status: "final" },
  { group: "D", date: "2026-06-13", home: "Australia", away: "Türkiye", homeScore: 2, awayScore: 0, venue: "Vancouver", status: "final" },
  { group: "D", date: "2026-06-19", home: "United States", away: "Australia", homeScore: 2, awayScore: 0, venue: "Seattle", status: "final" },
  { group: "D", date: "2026-06-19", home: "Türkiye", away: "Paraguay", homeScore: 0, awayScore: 1, venue: "Santa Clara", status: "final" },
  { group: "D", date: "2026-06-25", home: "Türkiye", away: "United States", venue: "Inglewood", status: "scheduled" },
  { group: "D", date: "2026-06-25", home: "Paraguay", away: "Australia", venue: "Santa Clara", status: "scheduled" },
  { group: "E", date: "2026-06-14", home: "Germany", away: "Curaçao", homeScore: 7, awayScore: 1, venue: "Houston", status: "final" },
  { group: "E", date: "2026-06-14", home: "Côte d’Ivoire", away: "Ecuador", homeScore: 1, awayScore: 0, venue: "Philadelphia", status: "final" },
  { group: "E", date: "2026-06-20", home: "Germany", away: "Côte d’Ivoire", homeScore: 2, awayScore: 1, venue: "Toronto", status: "final" },
  { group: "E", date: "2026-06-20", home: "Ecuador", away: "Curaçao", homeScore: 0, awayScore: 0, venue: "Kansas City", status: "final" },
  { group: "E", date: "2026-06-25", home: "Ecuador", away: "Germany", venue: "East Rutherford", status: "scheduled" },
  { group: "E", date: "2026-06-25", home: "Curaçao", away: "Côte d’Ivoire", venue: "Philadelphia", status: "scheduled" },
  { group: "F", date: "2026-06-14", home: "Netherlands", away: "Japan", homeScore: 2, awayScore: 2, venue: "Arlington", status: "final" },
  { group: "F", date: "2026-06-14", home: "Sweden", away: "Tunisia", homeScore: 5, awayScore: 1, venue: "Guadalupe", status: "final" },
  { group: "F", date: "2026-06-20", home: "Netherlands", away: "Sweden", homeScore: 5, awayScore: 1, venue: "Houston", status: "final" },
  { group: "F", date: "2026-06-21", home: "Tunisia", away: "Japan", venue: "Guadalupe", status: "scheduled" },
  { group: "F", date: "2026-06-25", home: "Japan", away: "Sweden", venue: "Arlington", status: "scheduled" },
  { group: "F", date: "2026-06-25", home: "Tunisia", away: "Netherlands", venue: "Kansas City", status: "scheduled" },
  { group: "G", date: "2026-06-15", home: "Belgium", away: "Egypt", homeScore: 1, awayScore: 1, venue: "Seattle", status: "final" },
  { group: "G", date: "2026-06-15", home: "Iran", away: "New Zealand", homeScore: 2, awayScore: 2, venue: "Inglewood", status: "final" },
  { group: "G", date: "2026-06-21", home: "Belgium", away: "Iran", venue: "Inglewood", status: "scheduled" },
  { group: "G", date: "2026-06-21", home: "New Zealand", away: "Egypt", venue: "Vancouver", status: "scheduled" },
  { group: "G", date: "2026-06-26", home: "Egypt", away: "Iran", venue: "Seattle", status: "scheduled" },
  { group: "G", date: "2026-06-26", home: "New Zealand", away: "Belgium", venue: "Vancouver", status: "scheduled" },
  { group: "H", date: "2026-06-15", home: "Spain", away: "Cape Verde", homeScore: 0, awayScore: 0, venue: "Atlanta", status: "final" },
  { group: "H", date: "2026-06-15", home: "Saudi Arabia", away: "Uruguay", homeScore: 1, awayScore: 1, venue: "Miami Gardens", status: "final" },
  { group: "H", date: "2026-06-21", home: "Spain", away: "Saudi Arabia", venue: "Atlanta", status: "scheduled" },
  { group: "H", date: "2026-06-21", home: "Uruguay", away: "Cape Verde", venue: "Miami Gardens", status: "scheduled" },
  { group: "H", date: "2026-06-26", home: "Cape Verde", away: "Saudi Arabia", venue: "Houston", status: "scheduled" },
  { group: "H", date: "2026-06-26", home: "Uruguay", away: "Spain", venue: "Zapopan", status: "scheduled" },
  { group: "I", date: "2026-06-16", home: "France", away: "Senegal", homeScore: 3, awayScore: 1, venue: "East Rutherford", status: "final" },
  { group: "I", date: "2026-06-16", home: "Iraq", away: "Norway", homeScore: 1, awayScore: 4, venue: "Foxborough", status: "final" },
  { group: "I", date: "2026-06-22", home: "France", away: "Iraq", venue: "Philadelphia", status: "scheduled" },
  { group: "I", date: "2026-06-22", home: "Norway", away: "Senegal", venue: "East Rutherford", status: "scheduled" },
  { group: "I", date: "2026-06-26", home: "Norway", away: "France", venue: "Foxborough", status: "scheduled" },
  { group: "I", date: "2026-06-26", home: "Senegal", away: "Iraq", venue: "Toronto", status: "scheduled" },
  { group: "J", date: "2026-06-16", home: "Argentina", away: "Algeria", homeScore: 3, awayScore: 0, venue: "Kansas City", status: "final" },
  { group: "J", date: "2026-06-16", home: "Austria", away: "Jordan", homeScore: 3, awayScore: 1, venue: "Santa Clara", status: "final" },
  { group: "J", date: "2026-06-22", home: "Argentina", away: "Austria", venue: "Arlington", status: "scheduled" },
  { group: "J", date: "2026-06-22", home: "Jordan", away: "Algeria", venue: "Santa Clara", status: "scheduled" },
  { group: "J", date: "2026-06-27", home: "Algeria", away: "Austria", venue: "Kansas City", status: "scheduled" },
  { group: "J", date: "2026-06-27", home: "Jordan", away: "Argentina", venue: "Arlington", status: "scheduled" },
  { group: "K", date: "2026-06-17", home: "Portugal", away: "DR Congo", homeScore: 1, awayScore: 1, venue: "Houston", status: "final" },
  { group: "K", date: "2026-06-17", home: "Uzbekistan", away: "Colombia", homeScore: 1, awayScore: 3, venue: "Mexico City", status: "final" },
  { group: "K", date: "2026-06-23", home: "Portugal", away: "Uzbekistan", venue: "Houston", status: "scheduled" },
  { group: "K", date: "2026-06-23", home: "Colombia", away: "DR Congo", venue: "Zapopan", status: "scheduled" },
  { group: "K", date: "2026-06-27", home: "Colombia", away: "Portugal", venue: "Miami Gardens", status: "scheduled" },
  { group: "K", date: "2026-06-27", home: "DR Congo", away: "Uzbekistan", venue: "Atlanta", status: "scheduled" },
  { group: "L", date: "2026-06-17", home: "England", away: "Croatia", homeScore: 4, awayScore: 2, venue: "Dallas", status: "final" },
  { group: "L", date: "2026-06-17", home: "Ghana", away: "Panama", homeScore: 1, awayScore: 0, venue: "Toronto", status: "final" },
  { group: "L", date: "2026-06-23", home: "England", away: "Ghana", venue: "Foxborough", status: "scheduled" },
  { group: "L", date: "2026-06-23", home: "Panama", away: "Croatia", venue: "Toronto", status: "scheduled" },
  { group: "L", date: "2026-06-27", home: "Panama", away: "England", venue: "East Rutherford", status: "scheduled" },
  { group: "L", date: "2026-06-27", home: "Croatia", away: "Ghana", venue: "Philadelphia", status: "scheduled" },
];

export const knockoutMatches: KnockoutMatch[] = [
  { matchNumber: 73, round: "Round of 32", date: "2026-06-28", time: "12:00 p.m.", timezone: "UTC-7", home: "Runner-up Group A", away: "Runner-up Group B", venue: "SoFi Stadium", city: "Inglewood" },
  { matchNumber: 74, round: "Round of 32", date: "2026-06-29", time: "4:30 p.m.", timezone: "UTC-4", home: "Germany", away: "3rd Group A/B/C/D/F", venue: "Gillette Stadium", city: "Foxborough" },
  { matchNumber: 75, round: "Round of 32", date: "2026-06-29", time: "7:00 p.m.", timezone: "UTC-6", home: "Winner Group F", away: "Runner-up Group C", venue: "Estadio BBVA", city: "Guadalupe" },
  { matchNumber: 76, round: "Round of 32", date: "2026-06-29", time: "12:00 p.m.", timezone: "UTC-5", home: "Winner Group C", away: "Runner-up Group F", venue: "NRG Stadium", city: "Houston" },
  { matchNumber: 77, round: "Round of 32", date: "2026-06-30", time: "5:00 p.m.", timezone: "UTC-4", home: "Winner Group I", away: "3rd Group C/D/F/G/H", venue: "MetLife Stadium", city: "East Rutherford" },
  { matchNumber: 78, round: "Round of 32", date: "2026-06-30", time: "12:00 p.m.", timezone: "UTC-5", home: "Runner-up Group E", away: "Runner-up Group I", venue: "AT&T Stadium", city: "Arlington" },
  { matchNumber: 79, round: "Round of 32", date: "2026-06-30", time: "7:00 p.m.", timezone: "UTC-6", home: "Mexico", away: "3rd Group C/E/F/H/I", venue: "Estadio Azteca", city: "Mexico City" },
  { matchNumber: 80, round: "Round of 32", date: "2026-07-01", time: "12:00 p.m.", timezone: "UTC-4", home: "Winner Group L", away: "3rd Group E/H/I/J/K", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { matchNumber: 81, round: "Round of 32", date: "2026-07-01", time: "5:00 p.m.", timezone: "UTC-7", home: "United States", away: "3rd Group B/E/F/I/J", venue: "Levi's Stadium", city: "Santa Clara" },
  { matchNumber: 82, round: "Round of 32", date: "2026-07-01", time: "1:00 p.m.", timezone: "UTC-7", home: "Winner Group G", away: "3rd Group A/E/H/I/J", venue: "Lumen Field", city: "Seattle" },
  { matchNumber: 83, round: "Round of 32", date: "2026-07-02", time: "7:00 p.m.", timezone: "UTC-4", home: "Runner-up Group K", away: "Runner-up Group L", venue: "BMO Field", city: "Toronto" },
  { matchNumber: 84, round: "Round of 32", date: "2026-07-02", time: "12:00 p.m.", timezone: "UTC-7", home: "Winner Group H", away: "Runner-up Group J", venue: "SoFi Stadium", city: "Inglewood" },
  { matchNumber: 85, round: "Round of 32", date: "2026-07-02", time: "8:00 p.m.", timezone: "UTC-7", home: "Winner Group B", away: "3rd Group E/F/G/I/J", venue: "BC Place", city: "Vancouver" },
  { matchNumber: 86, round: "Round of 32", date: "2026-07-03", time: "6:00 p.m.", timezone: "UTC-4", home: "Winner Group J", away: "Runner-up Group H", venue: "Hard Rock Stadium", city: "Miami Gardens" },
  { matchNumber: 87, round: "Round of 32", date: "2026-07-03", time: "8:30 p.m.", timezone: "UTC-5", home: "Winner Group K", away: "3rd Group D/E/I/J/L", venue: "Arrowhead Stadium", city: "Kansas City" },
  { matchNumber: 88, round: "Round of 32", date: "2026-07-03", time: "1:00 p.m.", timezone: "UTC-5", home: "Runner-up Group D", away: "Runner-up Group G", venue: "AT&T Stadium", city: "Arlington" },
  { matchNumber: 89, round: "Round of 16", date: "2026-07-04", time: "5:00 p.m.", timezone: "UTC-4", home: "Winner Match 74", away: "Winner Match 77", venue: "Lincoln Financial Field", city: "Philadelphia" },
  { matchNumber: 90, round: "Round of 16", date: "2026-07-04", time: "12:00 p.m.", timezone: "UTC-5", home: "Winner Match 73", away: "Winner Match 75", venue: "NRG Stadium", city: "Houston" },
  { matchNumber: 91, round: "Round of 16", date: "2026-07-05", time: "4:00 p.m.", timezone: "UTC-4", home: "Winner Match 76", away: "Winner Match 78", venue: "MetLife Stadium", city: "East Rutherford" },
  { matchNumber: 92, round: "Round of 16", date: "2026-07-05", time: "6:00 p.m.", timezone: "UTC-6", home: "Winner Match 79", away: "Winner Match 80", venue: "Estadio Azteca", city: "Mexico City" },
  { matchNumber: 93, round: "Round of 16", date: "2026-07-06", time: "2:00 p.m.", timezone: "UTC-5", home: "Winner Match 83", away: "Winner Match 84", venue: "AT&T Stadium", city: "Arlington" },
  { matchNumber: 94, round: "Round of 16", date: "2026-07-06", time: "5:00 p.m.", timezone: "UTC-7", home: "Winner Match 81", away: "Winner Match 82", venue: "Lumen Field", city: "Seattle" },
  { matchNumber: 95, round: "Round of 16", date: "2026-07-07", time: "12:00 p.m.", timezone: "UTC-4", home: "Winner Match 86", away: "Winner Match 88", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { matchNumber: 96, round: "Round of 16", date: "2026-07-07", time: "1:00 p.m.", timezone: "UTC-7", home: "Winner Match 85", away: "Winner Match 87", venue: "BC Place", city: "Vancouver" },
  { matchNumber: 97, round: "Quarterfinals", date: "2026-07-09", time: "4:00 p.m.", timezone: "UTC-4", home: "Winner Match 89", away: "Winner Match 90", venue: "Gillette Stadium", city: "Foxborough" },
  { matchNumber: 98, round: "Quarterfinals", date: "2026-07-10", time: "12:00 p.m.", timezone: "UTC-7", home: "Winner Match 93", away: "Winner Match 94", venue: "SoFi Stadium", city: "Inglewood" },
  { matchNumber: 99, round: "Quarterfinals", date: "2026-07-11", time: "5:00 p.m.", timezone: "UTC-4", home: "Winner Match 91", away: "Winner Match 92", venue: "Hard Rock Stadium", city: "Miami Gardens" },
  { matchNumber: 100, round: "Quarterfinals", date: "2026-07-11", time: "8:00 p.m.", timezone: "UTC-5", home: "Winner Match 95", away: "Winner Match 96", venue: "Arrowhead Stadium", city: "Kansas City" },
  { matchNumber: 101, round: "Semifinals", date: "2026-07-14", time: "2:00 p.m.", timezone: "UTC-5", home: "Winner Match 97", away: "Winner Match 98", venue: "AT&T Stadium", city: "Arlington" },
  { matchNumber: 102, round: "Semifinals", date: "2026-07-15", time: "3:00 p.m.", timezone: "UTC-4", home: "Winner Match 99", away: "Winner Match 100", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { matchNumber: 103, round: "Third place", date: "2026-07-18", time: "5:00 p.m.", timezone: "UTC-4", home: "Loser Match 101", away: "Loser Match 102", venue: "Hard Rock Stadium", city: "Miami Gardens" },
  { matchNumber: 104, round: "Final", date: "2026-07-19", time: "3:00 p.m.", timezone: "UTC-4", home: "Winner Match 101", away: "Winner Match 102", venue: "MetLife Stadium", city: "East Rutherford" },
];

export const countryAliases: Record<string, string> = {
  "United States of America": "United States",
  "Czech Republic": "Czechia",
  "Côte d'Ivoire": "Côte d’Ivoire",
  "Ivory Coast": "Côte d’Ivoire",
  Turkey: "Türkiye",
  "Bosnia and Herz.": "Bosnia and Herzegovina",
  "Dem. Rep. Congo": "DR Congo",
  Congo: "DR Congo",
  "Dominican Rep.": "Dominican Republic",
  "Eq. Guinea": "Equatorial Guinea",
  "eSwatini": "Eswatini",
  "S. Sudan": "South Sudan",
  "Central African Rep.": "Central African Republic",
};

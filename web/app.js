const programNames = new Map();

const $ = (id) => document.getElementById(id);

function csv(value) {
  return value
    .split(",")
    .map((part) => part.trim().toUpperCase())
    .filter(Boolean);
}

function selectedValues(select) {
  return Array.from(select.selectedOptions).map((option) => option.value);
}

function formatPoints(points) {
  if (points === null || points === undefined) return "";
  return Number(points).toLocaleString();
}

function formatTaxes(cents) {
  if (cents === null || cents === undefined) return "";
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

function cabinLabel(item) {
  const mixed = item.mixed_cabin ? " mixed" : "";
  return `${item.cabin}${mixed}`;
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

async function postJson(url, payload = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Request failed");
  return body;
}

async function loadPrograms() {
  const { programs } = await getJson("/api/programs");
  const select = $("programs");
  select.innerHTML = "";
  for (const program of programs) {
    programNames.set(program.id, program.name);
    const option = document.createElement("option");
    option.value = program.id;
    option.textContent = program.name;
    option.selected = ["aeroplan", "alaska", "united"].includes(program.id);
    select.appendChild(option);
  }
}

async function loadStatus() {
  const status = await getJson("/api/status");
  $("statusLine").textContent = `${status.mock_data ? "Mock provider mode" : "Live provider mode"} · scans every ${status.scan_interval_minutes} min · ${status.database_path}`;
}

async function loadRoutes() {
  const { routes } = await getJson("/api/routes");
  $("routeCount").textContent = `${routes.length}`;
  $("routes").innerHTML = routes
    .map(
      (route) => `
      <div class="item">
        <div class="itemTitle">
          <span>${route.name}</span>
          <span class="${route.active ? "ok" : "warn"}">${route.active ? "active" : "off"}</span>
        </div>
        <div class="meta">${route.origins.join(", ")} → ${route.destinations.join(", ")}</div>
        <div class="meta">${route.programs.map((id) => programNames.get(id) || id).join(", ")}</div>
        <div class="meta">${route.start_date} to ${route.end_date} · ${route.cabins.join(", ")}</div>
      </div>
    `
    )
    .join("");
}

async function loadAvailability() {
  const { availability } = await getJson("/api/availability?limit=300");
  $("availabilityCount").textContent = `${availability.length}`;
  $("availabilityBody").innerHTML = availability
    .map(
      (item) => `
      <tr>
        <td><strong>${programNames.get(item.program) || item.program}</strong></td>
        <td>${item.origin} → ${item.destination}</td>
        <td>${item.departure_date}</td>
        <td><span class="badge">${cabinLabel(item)}</span></td>
        <td>${item.seats}</td>
        <td>${formatPoints(item.points)}</td>
        <td>${formatTaxes(item.taxes_cents)}</td>
        <td>${item.carrier || ""} ${item.flight_numbers.join(" ")}</td>
        <td>${item.last_seen_at}</td>
      </tr>
    `
    )
    .join("");
}

async function loadScanRuns() {
  const { scan_runs: runs } = await getJson("/api/scan-runs");
  $("scanRuns").innerHTML = runs
    .map(
      (run) => `
      <div class="item">
        <div class="itemTitle">
          <span>${run.route_name || "All routes"}</span>
          <span class="${run.status === "success" ? "ok" : "warn"}">${run.status}</span>
        </div>
        <div class="meta">${run.started_at}${run.finished_at ? ` to ${run.finished_at}` : ""}</div>
        <div class="meta">${run.searched_count} searches · ${run.result_count} results</div>
        ${run.error ? `<div class="meta warn">${run.error}</div>` : ""}
      </div>
    `
    )
    .join("");
}

async function refresh() {
  await Promise.all([loadStatus(), loadRoutes(), loadAvailability(), loadScanRuns()]);
}

function setDefaultDates() {
  const today = new Date();
  const end = new Date();
  end.setDate(today.getDate() + 45);
  $("startDate").value = today.toISOString().slice(0, 10);
  $("endDate").value = end.toISOString().slice(0, 10);
}

async function runScan() {
  const button = $("scanButton");
  button.disabled = true;
  button.textContent = "Scanning...";
  try {
    await postJson("/api/scan");
    setTimeout(refresh, 1200);
  } finally {
    button.disabled = false;
    button.textContent = "Run Scan";
  }
}

async function runSearch() {
  const button = $("searchButton");
  button.disabled = true;
  button.textContent = "Searching...";
  try {
    const payload = {
      origins: csv($("origins").value),
      destinations: csv($("destinations").value),
      start_date: $("startDate").value,
      end_date: $("endDate").value,
      programs: selectedValues($("programs")),
      cabins: selectedValues($("cabins")),
      allow_short_haul_economy: true,
    };
    await postJson("/api/search", payload);
    await refresh();
  } finally {
    button.disabled = false;
    button.textContent = "One-Off Search";
  }
}

async function init() {
  setDefaultDates();
  await loadPrograms();
  await refresh();
  $("scanButton").addEventListener("click", runScan);
  $("searchButton").addEventListener("click", runSearch);
  setInterval(refresh, 30000);
}

init().catch((error) => {
  $("statusLine").textContent = error.message;
});


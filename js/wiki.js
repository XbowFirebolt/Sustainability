// Requires: WIKI_DATA global (loaded by wiki.html bootstrap)
// Requires: PROJECT_CATALOG, applyProjectTheme (from shared.js)

const wikiProject = PROJECT_CATALOG.find((p) => p.id === WIKI_DATA.projectId);

if (wikiProject) {
  applyProjectTheme(wikiProject);
  document.title = wikiProject.name + " — Sustainability Tracker";
  document.getElementById("wiki-title").textContent = wikiProject.name;
}

const wikiProjectEmoji = wikiProject ? wikiProject.emoji : "?";

function getLifeBarColor(percent) {
  if (percent <= 25) return "#c0320a";
  if (percent <= 45) return "#c07a10";
  if (percent <= 65) return "#b0a010";
  if (percent <= 80) return "#5a8a2a";
  return "#2d6a2d";
}

function loadFavorites() {
  return JSON.parse(localStorage.getItem(WIKI_DATA.favoritesKey) || "[]");
}

function saveFavorites(ids) {
  localStorage.setItem(WIKI_DATA.favoritesKey, JSON.stringify(ids));
}

// Species detail modal
const speciesModal = document.getElementById("species-modal");
let activeCard = null;
let tabPanelsScrollListener = null;
let unitMode = localStorage.getItem("wiki_unit_mode") || "metric";
let currentModalSpecies = null;
let suppressHistoryUpdate = false;

function openSpeciesModal(species, cardEl) {
  if (!suppressHistoryUpdate) {
    const url = new URL(window.location);
    url.searchParams.set("species", species.id);
    history.pushState({ speciesId: species.id }, "", url);
  }

  activeCard = cardEl;

  const imgArea = document.getElementById("species-modal-image");
  if (species.photo) {
    imgArea.style.backgroundImage = `url(${species.photo})`;
    imgArea.style.backgroundSize = "cover";
    imgArea.style.backgroundPosition = "center";
    document.getElementById("species-modal-emoji").style.display = "none";
  } else {
    imgArea.style.backgroundImage = "";
    imgArea.style.background = "linear-gradient(135deg, #0a0a0a, var(--color-primary))";
    document.getElementById("species-modal-emoji").style.display = "";
    document.getElementById("species-modal-emoji").textContent = wikiProjectEmoji;
  }

  document.getElementById("species-modal-name").textContent = species.commonName;
  document.getElementById("species-modal-sci").textContent = species.scientificName;

  const fill = document.getElementById("species-modal-fill");
  fill.style.width = `${species.lifePercent}%`;
  fill.style.background = getLifeBarColor(species.lifePercent);
  document.getElementById("species-modal-status").textContent = species.statusLabel;

  currentModalSpecies = species;
  activateTab("vital");
  renderVitalSigns(species);
  renderHealthMetrics(species);
  renderThreats(species.threats);
  renderActionItems(species.actionItems);

  const modalContent = speciesModal.querySelector(".species-modal");

  // Reset scroll and image opacity for fresh open
  const imgAreaEl = document.getElementById("species-modal-image");
  imgAreaEl.style.opacity = "";
  modalContent.scrollTop = 0;

  // Clean up any previous scroll listener
  if (tabPanelsScrollListener) {
    modalContent.removeEventListener("scroll", tabPanelsScrollListener);
  }
  tabPanelsScrollListener = function () {
    imgAreaEl.style.opacity = Math.max(0, 1 - modalContent.scrollTop / 200);
  };
  modalContent.addEventListener("scroll", tabPanelsScrollListener);

  if (cardEl) {
    const cardRect = cardEl.getBoundingClientRect();

    // Disable transition and show overlay (starts its opacity fade)
    modalContent.style.transition = "none";
    speciesModal.classList.remove("hidden");

    // Force reflow to get modal's natural centered position
    const modalRect = modalContent.getBoundingClientRect();

    // Translate + scale to place the modal exactly over the card
    const tx = (cardRect.left + cardRect.width / 2) - (modalRect.left + modalRect.width / 2);
    const ty = (cardRect.top + cardRect.height / 2) - (modalRect.top + modalRect.height / 2);
    const scale = cardRect.width / modalRect.width;

    // Snap to card position (no transition yet)
    modalContent.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    modalContent.getBoundingClientRect(); // commit starting state

    // Re-enable transition and animate to natural centered position
    modalContent.style.transition = "";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        modalContent.style.transform = "";
      });
    });
  } else {
    // No card to morph from (e.g. deep link) — just fade in
    speciesModal.classList.remove("hidden");
  }
}

function closeSpeciesModal() {
  if (!suppressHistoryUpdate) {
    const url = new URL(window.location);
    url.searchParams.delete("species");
    history.pushState({}, "", url);
  }

  const modalContent = speciesModal.querySelector(".species-modal");

  // Remove scroll listener
  if (tabPanelsScrollListener) {
    modalContent.removeEventListener("scroll", tabPanelsScrollListener);
    tabPanelsScrollListener = null;
  }

  if (activeCard) {
    const cardRect = activeCard.getBoundingClientRect();
    const modalRect = modalContent.getBoundingClientRect();

    const tx = (cardRect.left + cardRect.width / 2) - (modalRect.left + modalRect.width / 2);
    const ty = (cardRect.top + cardRect.height / 2) - (modalRect.top + modalRect.height / 2);
    const scale = cardRect.width / modalRect.width;

    // Animate modal back to card; fade overlay simultaneously
    modalContent.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    speciesModal.classList.add("hidden");

    // After animation, reset for next open
    const cardToRefocus = activeCard;
    setTimeout(() => {
      modalContent.style.transform = "";
      activeCard = null;
      if (cardToRefocus) cardToRefocus.focus({ preventScroll: true });
    }, 400);
  } else {
    speciesModal.classList.add("hidden");
  }
}

document.getElementById("species-modal-close").addEventListener("click", closeSpeciesModal);
speciesModal.addEventListener("click", (e) => {
  if (e.target === speciesModal) closeSpeciesModal();
});

window.addEventListener("popstate", () => {
  suppressHistoryUpdate = true;
  const params = new URLSearchParams(window.location.search);
  const speciesId = params.get("species");
  if (speciesId) {
    const species = WIKI_DATA.items.find((s) => s.id === speciesId);
    if (species) {
      const cardEl = document.querySelector(`[data-species-id="${speciesId}"]`);
      openSpeciesModal(species, cardEl);
    }
  } else if (!speciesModal.classList.contains("hidden")) {
    closeSpeciesModal();
  }
  suppressHistoryUpdate = false;
});

// ── Tab switching ──────────────────────────────────────────────

function activateTab(tabKey) {
  document.querySelectorAll(".species-tab").forEach((btn) => {
    const isActive = btn.dataset.tab === tabKey;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });
  document.querySelectorAll(".species-tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === "tab-panel-" + tabKey);
  });
}

document.querySelectorAll(".species-tab").forEach((btn) => {
  btn.addEventListener("click", () => activateTab(btn.dataset.tab));
});

// ── Tab content renderers ──────────────────────────────────────

function renderVitalSigns(species) {
  const panel = document.getElementById("tab-panel-vital");
  panel.innerHTML = "";

  const items = species.vitalSigns;

  if (!Array.isArray(items) || !items.length) {
    panel.innerHTML =
      '<div class="tab-placeholder">' +
        '<span class="tab-placeholder-icon">📊</span>' +
        "Vital statistics data is not yet available for this species." +
      "</div>";
    return;
  }

  // ── Unit toggle ──────────────────────────────────────────────
  const toggle = document.createElement("div");
  toggle.className = "vital-unit-toggle";

  ["metric", "imperial"].forEach((unit) => {
    const btn = document.createElement("button");
    btn.className = "vital-unit-btn" + (unitMode === unit ? " active" : "");
    btn.dataset.unit = unit;
    btn.textContent = unit === "metric" ? "Metric" : "Imperial";
    btn.addEventListener("click", () => {
      unitMode = unit;
      localStorage.setItem("wiki_unit_mode", unit);
      renderVitalSigns(currentModalSpecies);
    });
    toggle.appendChild(btn);
  });

  panel.appendChild(toggle);

  // ── Stats ────────────────────────────────────────────────────
  const list = document.createElement("div");
  list.className = "tab-vital-list";

  items.forEach((item) => {
    const displayValue =
      unitMode === "metric"   && item.metric   ? item.metric   :
      unitMode === "imperial" && item.imperial ? item.imperial :
      item.value;

    const row = document.createElement("div");
    row.className = "tab-vital-row";

    const lbl = document.createElement("span");
    lbl.className = "tab-vital-label";
    lbl.textContent = item.label;

    const val = document.createElement("span");
    val.className = "tab-vital-value";
    val.textContent = displayValue;

    row.appendChild(lbl);
    row.appendChild(val);
    list.appendChild(row);
  });

  panel.appendChild(list);

  // ── Physical Scale + Habitat (side by side) ──────────────────
  if (species.physicalScaleImage || species.habitatImage) {
    const imageRow = document.createElement("div");
    imageRow.className = "tab-vital-image-row";

    if (species.physicalScaleImage) {
      const scaleSection = document.createElement("div");
      scaleSection.className = "tab-vital-subsection";

      const scaleHeader = document.createElement("div");
      scaleHeader.className = "tab-vital-subsection-header";
      scaleHeader.textContent = "Physical Scale";

      const scaleImg = document.createElement("img");
      scaleImg.className = "tab-vital-subsection-image";
      scaleImg.src = species.physicalScaleImage;
      scaleImg.alt = "Size comparison of " + species.commonName + " to a human";

      scaleSection.appendChild(scaleHeader);
      scaleSection.appendChild(scaleImg);
      imageRow.appendChild(scaleSection);
    }

    if (species.habitatImage) {
      const habitatSection = document.createElement("div");
      habitatSection.className = "tab-vital-subsection";

      const habitatHeader = document.createElement("div");
      habitatHeader.className = "tab-vital-subsection-header";
      habitatHeader.textContent = "Habitat";

      const habitatImg = document.createElement("img");
      habitatImg.className = "tab-vital-subsection-image";
      habitatImg.src = species.habitatImage;
      habitatImg.alt = "Habitat map for " + species.commonName;

      const mapLink = document.createElement("a");
      mapLink.className = "vital-map-link";
      mapLink.href = "index.html";
      mapLink.textContent = "View on Map \u2192";

      habitatSection.appendChild(habitatHeader);
      habitatSection.appendChild(habitatImg);
      habitatSection.appendChild(mapLink);
      imageRow.appendChild(habitatSection);
    }

    panel.appendChild(imageRow);

    if (Array.isArray(species.habitatStats) && species.habitatStats.length) {
      const rangeList = document.createElement("div");
      rangeList.className = "tab-vital-list tab-vital-list--habitat";

      species.habitatStats.forEach((item) => {
        const displayValue =
          unitMode === "metric"   && item.metric   ? item.metric   :
          unitMode === "imperial" && item.imperial ? item.imperial :
          item.value;

        const row = document.createElement("div");
        row.className = "tab-vital-row";

        const lbl = document.createElement("span");
        lbl.className = "tab-vital-label";
        lbl.textContent = item.label;

        const val = document.createElement("span");
        val.className = "tab-vital-value";
        val.textContent = displayValue;

        row.appendChild(lbl);
        row.appendChild(val);
        rangeList.appendChild(row);
      });

      panel.appendChild(rangeList);
    }
  }
}

function renderPopulationChart(container, data) {
  const PAD = { top: 14, right: 16, bottom: 28, left: 48 };
  const W = 480, H = 160;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const valRange = maxVal - minVal || 1;

  const xOf = (i) => PAD.left + (i / (data.length - 1)) * innerW;
  const yOf = (v) => PAD.top + innerH - ((v - minVal) / valRange) * innerH;

  const svgNS = "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.className = "health-chart-svg";

  // Grid lines at 0%, 33%, 67%, 100% of value range
  [0, 0.33, 0.67, 1].forEach((t) => {
    const y = PAD.top + innerH - t * innerH;
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", PAD.left);
    line.setAttribute("x2", PAD.left + innerW);
    line.setAttribute("y1", y);
    line.setAttribute("y2", y);
    line.setAttribute("stroke", "currentColor");
    line.setAttribute("stroke-opacity", "0.08");
    line.setAttribute("stroke-width", "1");
    svg.appendChild(line);

    const gridLabel = document.createElementNS(svgNS, "text");
    gridLabel.setAttribute("x", PAD.left - 5);
    gridLabel.setAttribute("y", y + 3.5);
    gridLabel.setAttribute("text-anchor", "end");
    gridLabel.className = "health-chart-value";
    gridLabel.textContent = "~" + Math.round(minVal + t * valRange).toLocaleString();
    svg.appendChild(gridLabel);
  });

  // Shaded area fill
  const areaPoints =
    data.map((d, i) => `${xOf(i)},${yOf(d.value)}`).join(" ") +
    ` ${xOf(data.length - 1)},${PAD.top + innerH} ${xOf(0)},${PAD.top + innerH}`;
  const area = document.createElementNS(svgNS, "polygon");
  area.setAttribute("points", areaPoints);
  area.setAttribute("fill", "var(--color-primary)");
  area.setAttribute("fill-opacity", "0.12");
  svg.appendChild(area);

  // Data line
  const polyline = document.createElementNS(svgNS, "polyline");
  polyline.setAttribute("points", data.map((d, i) => `${xOf(i)},${yOf(d.value)}`).join(" "));
  polyline.setAttribute("fill", "none");
  polyline.setAttribute("stroke", "var(--color-primary)");
  polyline.setAttribute("stroke-width", "2");
  polyline.setAttribute("stroke-linejoin", "round");
  svg.appendChild(polyline);

  // Dots and year labels
  data.forEach((d, i) => {
    const cx = xOf(i), cy = yOf(d.value);

    const dot = document.createElementNS(svgNS, "circle");
    dot.setAttribute("cx", cx);
    dot.setAttribute("cy", cy);
    dot.setAttribute("r", "3.5");
    dot.setAttribute("fill", "var(--color-primary)");
    svg.appendChild(dot);

    const yearLabel = document.createElementNS(svgNS, "text");
    yearLabel.setAttribute("x", cx);
    yearLabel.setAttribute("y", H - 6);
    yearLabel.setAttribute("text-anchor", "middle");
    yearLabel.className = "health-chart-year";
    yearLabel.textContent = d.year;
    svg.appendChild(yearLabel);
  });

  container.appendChild(svg);
}

function renderRegionGrid(container, regions) {
  const grid = document.createElement("div");
  grid.className = "health-region-grid";

  regions.forEach(({ name, severity, note }) => {
    const card = document.createElement("div");
    card.className = "health-region-card";

    const nameEl = document.createElement("div");
    nameEl.className = "health-region-name";
    nameEl.textContent = name;

    const badge = document.createElement("span");
    badge.className = "tab-severity-badge tab-severity-badge--" + (severity || "medium");
    badge.textContent = severity || "unknown";

    const noteEl = document.createElement("div");
    noteEl.className = "health-region-note";
    noteEl.textContent = note;

    card.appendChild(nameEl);
    card.appendChild(badge);
    card.appendChild(noteEl);
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

function renderHealthMetrics(species) {
  const panel = document.getElementById("tab-panel-health");
  panel.innerHTML = "";

  const items = species.healthMetrics;

  if (!Array.isArray(items) || !items.length) {
    panel.innerHTML =
      '<div class="tab-placeholder">' +
        '<span class="tab-placeholder-icon">🩺</span>' +
        "Health and conservation metric data is not yet available for this species." +
      "</div>";
    return;
  }

  const TREND_SYMBOLS = { up: "▲", down: "▼", stable: "—" };
  const TREND_CLASSES  = { up: "tab-trend--up", down: "tab-trend--down", stable: "tab-trend--stable" };

  // ── Population Trend Chart ─────────────────────────────────────
  if (Array.isArray(species.populationTrend) && species.populationTrend.length) {
    const sectionTitle = document.createElement("div");
    sectionTitle.className = "health-section-title";
    sectionTitle.textContent = "Population Trend";
    panel.appendChild(sectionTitle);

    const chartWrap = document.createElement("div");
    chartWrap.className = "health-chart-wrap";
    renderPopulationChart(chartWrap, species.populationTrend);
    panel.appendChild(chartWrap);
  }

  // ── Key Metrics list ───────────────────────────────────────────
  const metricsTitle = document.createElement("div");
  metricsTitle.className = "health-section-title";
  metricsTitle.textContent = "Key Metrics";
  panel.appendChild(metricsTitle);

  const list = document.createElement("div");
  list.className = "tab-health-list";

  items.forEach(({ label, value, trend, links }) => {
    const hasLinks = Array.isArray(links) && links.length;
    const row = document.createElement("div");
    row.className = "tab-health-row";

    const lbl = document.createElement("span");
    lbl.className = "tab-health-label";
    lbl.textContent = label;

    const rightCol = document.createElement("div");
    rightCol.className = "tab-health-right";

    const valueWrap = document.createElement("div");
    valueWrap.className = "tab-health-value-wrap";

    const val = document.createElement("span");
    val.className = "tab-health-value";
    val.textContent = value;
    valueWrap.appendChild(val);

    if (trend && TREND_SYMBOLS[trend]) {
      const indicator = document.createElement("span");
      indicator.className = "tab-trend " + (TREND_CLASSES[trend] || "");
      indicator.textContent = TREND_SYMBOLS[trend];
      indicator.setAttribute("aria-label", trend);
      valueWrap.appendChild(indicator);
    }

    rightCol.appendChild(valueWrap);

    if (hasLinks) {
      const linksWrap = document.createElement("div");
      linksWrap.className = "health-metric-links";
      links.forEach(({ label: linkLabel, url }) => {
        const a = document.createElement("a");
        a.className = "health-metric-link";
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = linkLabel;
        linksWrap.appendChild(a);
      });
      rightCol.appendChild(linksWrap);
    }

    row.appendChild(lbl);
    row.appendChild(rightCol);
    list.appendChild(row);
  });

  panel.appendChild(list);

  // ── Prey Availability by Region ────────────────────────────────
  if (Array.isArray(species.preyDeclineRegions) && species.preyDeclineRegions.length) {
    const preyTitle = document.createElement("div");
    preyTitle.className = "health-section-title";
    preyTitle.textContent = "Prey Availability by Region";
    panel.appendChild(preyTitle);
    renderRegionGrid(panel, species.preyDeclineRegions);
  }

  // ── Fishing Pressure by Region ─────────────────────────────────
  if (Array.isArray(species.fishingPressureRegions) && species.fishingPressureRegions.length) {
    const pressureTitle = document.createElement("div");
    pressureTitle.className = "health-section-title";
    pressureTitle.textContent = "Fishing Pressure by Region";
    panel.appendChild(pressureTitle);
    renderRegionGrid(panel, species.fishingPressureRegions);
  }
}

function renderThreats(items) {
  const panel = document.getElementById("tab-panel-threats");
  panel.innerHTML = "";

  if (!Array.isArray(items) || !items.length) {
    panel.innerHTML =
      '<div class="tab-placeholder">' +
        '<span class="tab-placeholder-icon">⚠️</span>' +
        "Threat data is not yet available for this species." +
      "</div>";
    return;
  }

  const list = document.createElement("div");
  list.className = "tab-threats-list";

  items.forEach(({ name, severity, description }) => {
    const card = document.createElement("div");
    card.className = "tab-threat-card";

    const header = document.createElement("div");
    header.className = "tab-threat-header";

    const threatName = document.createElement("span");
    threatName.className = "tab-threat-name";
    threatName.textContent = name;

    const badge = document.createElement("span");
    badge.className = "tab-severity-badge tab-severity-badge--" + (severity || "medium");
    badge.textContent = severity || "unknown";

    header.appendChild(threatName);
    header.appendChild(badge);

    const desc = document.createElement("div");
    desc.className = "tab-threat-desc";
    desc.textContent = description;

    card.appendChild(header);
    card.appendChild(desc);
    list.appendChild(card);
  });

  panel.appendChild(list);
}

function renderActionItems(items) {
  const panel = document.getElementById("tab-panel-actions");
  panel.innerHTML = "";

  if (!Array.isArray(items) || !items.length) {
    panel.innerHTML =
      '<div class="tab-placeholder">' +
        '<span class="tab-placeholder-icon">🌱</span>' +
        "Conservation action data is not yet available for this species." +
      "</div>";
    return;
  }

  const list = document.createElement("div");
  list.className = "tab-actions-list";

  items.forEach(({ title, description, link }) => {
    const card = document.createElement("div");
    card.className = "tab-action-card";

    const titleEl = document.createElement("div");
    titleEl.className = "tab-action-title";
    titleEl.textContent = title;

    const descEl = document.createElement("div");
    descEl.className = "tab-action-desc";
    descEl.textContent = description;

    card.appendChild(titleEl);
    card.appendChild(descEl);

    if (link) {
      const a = document.createElement("a");
      a.className = "tab-action-link";
      a.href = link;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = "Learn more →";
      card.appendChild(a);
    }

    list.appendChild(card);
  });

  panel.appendChild(list);
}

const wikiSearch = document.getElementById("wiki-search");

let focusedCardIndex = -1;
let activeStatusFilters = new Set();
let sortMode = "default";

const SEVERITY_SCORE = { critical: 4, high: 3, medium: 2, low: 1 };

function getThreatSeverityScore(species) {
  if (!species.threats || species.threats.length === 0) return 0;
  return Math.max(...species.threats.map((t) => SEVERITY_SCORE[t.severity] || 0));
}

function getMaxSeverityLabel(species) {
  const score = getThreatSeverityScore(species);
  return { 4: "critical", 3: "high", 2: "medium", 1: "low" }[score] || null;
}

function renderWikiGrid(query) {
  const grid = document.getElementById("wiki-grid");
  const q = query ? query.trim().toLowerCase() : "";
  let filtered = q
    ? WIKI_DATA.items.filter(
        (s) =>
          s.commonName.toLowerCase().includes(q) ||
          s.scientificName.toLowerCase().includes(q) ||
          s.statusLabel.toLowerCase().includes(q)
      )
    : [...WIKI_DATA.items];

  if (activeStatusFilters.size > 0) {
    filtered = filtered.filter((s) => activeStatusFilters.has(s.statusLabel));
  }

  const favIds = loadFavorites();
  let sorted;
  if (sortMode === "default") {
    sorted = [
      ...filtered.filter((s) => favIds.includes(s.id)),
      ...filtered.filter((s) => !favIds.includes(s.id)),
    ];
  } else if (sortMode === "name-asc") {
    sorted = [...filtered].sort((a, b) => a.commonName.localeCompare(b.commonName));
  } else if (sortMode === "health-asc") {
    sorted = [...filtered].sort((a, b) => a.lifePercent - b.lifePercent);
  } else if (sortMode === "health-desc") {
    sorted = [...filtered].sort((a, b) => b.lifePercent - a.lifePercent);
  } else if (sortMode === "threat-desc") {
    sorted = [...filtered].sort((a, b) => getThreatSeverityScore(b) - getThreatSeverityScore(a));
  } else {
    sorted = filtered;
  }

  grid.innerHTML = "";
  focusedCardIndex = -1;

  if (sorted.length === 0) {
    const empty = document.createElement("p");
    empty.className = "discover-empty";
    empty.textContent =
      activeStatusFilters.size > 0
        ? "No species match your search or filters."
        : "No species match your search.";
    grid.appendChild(empty);
    return;
  }

  sorted.forEach((species) => {
    const isFav = favIds.includes(species.id);

    const card = document.createElement("div");
    card.className = "species-card";
    card.dataset.speciesId = species.id;
    card.tabIndex = 0;
    card.addEventListener("click", () => openSpeciesModal(species, card));

    // Image area
    const imgArea = document.createElement("div");
    imgArea.className = "species-card-image";
    if (species.photo) {
      imgArea.style.backgroundImage = `url(${species.photo})`;
      imgArea.style.backgroundSize = "cover";
      imgArea.style.backgroundPosition = "center";
    } else {
      imgArea.textContent = wikiProjectEmoji;
      imgArea.style.background = "linear-gradient(135deg, #0a0a0a, var(--color-primary))";
    }

    // Favorite star button
    const starBtn = document.createElement("button");
    starBtn.className = "species-card-star" + (isFav ? " favorited" : "");
    starBtn.textContent = isFav ? "★" : "☆";
    starBtn.setAttribute(
      "aria-label",
      isFav ? `Unfavorite ${species.commonName}` : `Favorite ${species.commonName}`
    );
    starBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const ids = loadFavorites();
      const idx = ids.indexOf(species.id);
      if (idx === -1) {
        ids.push(species.id);
      } else {
        ids.splice(idx, 1);
      }
      saveFavorites(ids);
      renderWikiGrid(wikiSearch.value);
    });
    imgArea.appendChild(starBtn);

    // Card body
    const body = document.createElement("div");
    body.className = "species-card-body";

    const name = document.createElement("div");
    name.className = "species-card-name";
    name.textContent = species.commonName;

    const sci = document.createElement("div");
    sci.className = "species-card-sci";
    sci.textContent = species.scientificName;

    // Threat severity badge
    const maxSeverity = getMaxSeverityLabel(species);
    let threatBadge = null;
    if (maxSeverity) {
      threatBadge = document.createElement("div");
      threatBadge.className = `card-threat-badge tab-severity-badge tab-severity-badge--${maxSeverity}`;
      threatBadge.textContent = maxSeverity.charAt(0).toUpperCase() + maxSeverity.slice(1);
    }

    // Life bar
    const lifeWrap = document.createElement("div");
    lifeWrap.className = "species-life-wrap";

    const lifeBar = document.createElement("div");
    lifeBar.className = "species-life-bar";

    const lifeFill = document.createElement("div");
    lifeFill.className = "species-life-fill";
    lifeFill.style.width = "0%";
    lifeFill.dataset.targetWidth = species.lifePercent;
    lifeFill.style.background = getLifeBarColor(species.lifePercent);

    const lifeLabel = document.createElement("div");
    lifeLabel.className = "species-life-label";
    lifeLabel.textContent = species.statusLabel;

    lifeBar.appendChild(lifeFill);
    lifeWrap.appendChild(lifeBar);
    lifeWrap.appendChild(lifeLabel);

    // Fun fact
    const funfact = document.createElement("div");
    funfact.className = "species-funfact";

    const funfactLabel = document.createElement("div");
    funfactLabel.className = "funfact-label";
    funfactLabel.textContent = "Fun Fact";

    const funfactText = document.createElement("div");
    funfactText.className = "funfact-text";
    funfactText.textContent = species.funFact;

    funfact.appendChild(funfactLabel);
    funfact.appendChild(funfactText);

    body.appendChild(name);
    body.appendChild(sci);
    if (threatBadge) body.appendChild(threatBadge);
    body.appendChild(lifeWrap);
    body.appendChild(funfact);
    card.appendChild(imgArea);
    card.appendChild(body);
    grid.appendChild(card);
  });

  // Animate life bars from 0% to their value as cards enter the viewport
  if (window._wikiLifeObserver) window._wikiLifeObserver.disconnect();
  window._wikiLifeObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort(
        (a, b) =>
          a.boundingClientRect.top - b.boundingClientRect.top ||
          a.boundingClientRect.left - b.boundingClientRect.left
      );
    visible.forEach((entry, i) => {
      const fill = entry.target.querySelector(".species-life-fill");
      if (fill) setTimeout(() => { fill.style.width = fill.dataset.targetWidth + "%"; }, i * 60);
      window._wikiLifeObserver.unobserve(entry.target);
    });
  }, { threshold: 0.15 });
  grid.querySelectorAll(".species-card").forEach((card) => window._wikiLifeObserver.observe(card));
}

wikiSearch.addEventListener("input", () => renderWikiGrid(wikiSearch.value));

document.getElementById("wiki-sort").addEventListener("change", (e) => {
  sortMode = e.target.value;
  renderWikiGrid(wikiSearch.value);
});

// ── Keyboard navigation ────────────────────────────────────────

function getVisibleCards() {
  return Array.from(document.querySelectorAll(".species-card"));
}

function setFocusedCard(index) {
  const cards = getVisibleCards();
  cards.forEach((c) => c.classList.remove("keyboard-focused"));
  if (index < 0 || index >= cards.length) {
    focusedCardIndex = -1;
    return;
  }
  focusedCardIndex = index;
  const card = cards[index];
  card.classList.add("keyboard-focused");
  card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  card.focus({ preventScroll: true });
}

document.addEventListener("keydown", (e) => {
  const modalOpen = !speciesModal.classList.contains("hidden");

  if (modalOpen) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeSpeciesModal();
      return;
    }
    if (e.key === "Tab") {
      const tabs = Array.from(document.querySelectorAll(".species-tab"));
      const activeIdx = tabs.findIndex((t) => t.classList.contains("active"));
      e.preventDefault();
      const nextIdx = e.shiftKey
        ? (activeIdx - 1 + tabs.length) % tabs.length
        : (activeIdx + 1) % tabs.length;
      activateTab(tabs[nextIdx].dataset.tab);
      tabs[nextIdx].focus();
      return;
    }
    return;
  }

  // Modal closed — card navigation
  if (e.target === wikiSearch) return;

  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    const cards = getVisibleCards();
    if (!cards.length) return;
    e.preventDefault();
    let next;
    if (focusedCardIndex === -1) {
      next = e.key === "ArrowRight" ? 0 : cards.length - 1;
    } else {
      next =
        e.key === "ArrowRight"
          ? (focusedCardIndex + 1) % cards.length
          : (focusedCardIndex - 1 + cards.length) % cards.length;
    }
    setFocusedCard(next);
    return;
  }

  if (e.key === "Enter" && focusedCardIndex !== -1) {
    const cards = getVisibleCards();
    const card = cards[focusedCardIndex];
    if (!card) return;
    e.preventDefault();
    const species = WIKI_DATA.items.find((s) => s.id === card.dataset.speciesId);
    if (species) openSpeciesModal(species, card);
    return;
  }
});

// ── At-a-glance status bar ─────────────────────────────────────

const STATUS_ORDER = [
  { label: "Extinct",               color: "#888888", bg: "rgba(136,136,136,0.13)" },
  { label: "Extinct in the Wild",   color: "#9c3d9c", bg: "rgba(156,61,156,0.13)"  },
  { label: "Critically Endangered", color: "#c0320a", bg: "rgba(192,50,10,0.13)"   },
  { label: "Endangered",            color: "#c07a10", bg: "rgba(192,122,16,0.13)"  },
  { label: "Vulnerable",            color: "#b0a010", bg: "rgba(176,160,16,0.13)"  },
  { label: "Near Threatened",       color: "#5a8a2a", bg: "rgba(90,138,42,0.13)"   },
  { label: "Least Concern",         color: "#2d6a2d", bg: "rgba(45,106,45,0.13)"   },
  { label: "Data Deficient",        color: "#707070", bg: "rgba(112,112,112,0.13)" },
  { label: "Not Evaluated",         color: "#505050", bg: "rgba(80,80,80,0.13)"    },
];

function renderStatusBar() {
  const area = document.getElementById("wiki-chips-area");
  const bar = document.getElementById("wiki-status-bar");
  if (!area || !bar) return;

  const counts = {};
  WIKI_DATA.items.forEach((s) => {
    counts[s.statusLabel] = (counts[s.statusLabel] || 0) + 1;
  });

  area.innerHTML = "";

  const heading = document.createElement("span");
  heading.className = "wiki-status-heading";
  heading.textContent = "At a glance";
  area.appendChild(heading);

  let hasChips = false;

  function makeChip(label, color, bg, count) {
    hasChips = true;
    const chip = document.createElement("button");
    chip.className = "status-chip";
    chip.style.setProperty("--chip-color", color);
    chip.style.setProperty("--chip-bg", bg);
    chip.setAttribute("aria-pressed", "false");

    const countEl = document.createElement("span");
    countEl.className = "status-chip-count";
    countEl.textContent = count;

    const labelEl = document.createElement("span");
    labelEl.className = "status-chip-label";
    labelEl.textContent = label;

    chip.appendChild(countEl);
    chip.appendChild(labelEl);

    chip.addEventListener("click", () => {
      if (activeStatusFilters.has(label)) {
        activeStatusFilters.delete(label);
        chip.classList.remove("active");
        chip.setAttribute("aria-pressed", "false");
      } else {
        activeStatusFilters.add(label);
        chip.classList.add("active");
        chip.setAttribute("aria-pressed", "true");
      }
      renderWikiGrid(wikiSearch.value);
    });

    return chip;
  }

  STATUS_ORDER.forEach(({ label, color, bg }) => {
    const count = counts[label];
    if (!count) return;
    area.appendChild(makeChip(label, color, bg, count));
  });

  // Any statuses not in the config table go at the end
  Object.entries(counts).forEach(([label, count]) => {
    if (STATUS_ORDER.find((s) => s.label === label)) return;
    area.appendChild(makeChip(label, "#707070", "rgba(112,112,112,0.13)", count));
  });

  bar.style.display = hasChips ? "" : "none";
}

renderWikiGrid("");
renderStatusBar();

// Open modal directly if species is specified in the URL (deep link / bookmark)
const initSpeciesId = new URLSearchParams(window.location.search).get("species");
if (initSpeciesId) {
  const initSpecies = WIKI_DATA.items.find((s) => s.id === initSpeciesId);
  if (initSpecies) {
    suppressHistoryUpdate = true;
    openSpeciesModal(initSpecies, document.querySelector(`[data-species-id="${initSpeciesId}"]`));
    suppressHistoryUpdate = false;
  }
}

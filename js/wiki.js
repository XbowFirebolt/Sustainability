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

function openSpeciesModal(species, cardEl) {
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

  activateTab("vital");
  renderVitalSigns(species);
  renderHealthMetrics(species.healthMetrics);
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
}

function closeSpeciesModal() {
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
    setTimeout(() => {
      modalContent.style.transform = "";
      activeCard = null;
    }, 400);
  } else {
    speciesModal.classList.add("hidden");
  }
}

document.getElementById("species-modal-close").addEventListener("click", closeSpeciesModal);
speciesModal.addEventListener("click", (e) => {
  if (e.target === speciesModal) closeSpeciesModal();
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

  // ── Stats ────────────────────────────────────────────────────
  const list = document.createElement("div");
  list.className = "tab-vital-list";

  items.forEach(({ label, value }) => {
    const row = document.createElement("div");
    row.className = "tab-vital-row";

    const lbl = document.createElement("span");
    lbl.className = "tab-vital-label";
    lbl.textContent = label;

    const val = document.createElement("span");
    val.className = "tab-vital-value";
    val.textContent = value;

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

      habitatSection.appendChild(habitatHeader);
      habitatSection.appendChild(habitatImg);
      imageRow.appendChild(habitatSection);
    }

    panel.appendChild(imageRow);

    if (Array.isArray(species.habitatStats) && species.habitatStats.length) {
      const rangeList = document.createElement("div");
      rangeList.className = "tab-vital-list tab-vital-list--habitat";

      species.habitatStats.forEach(({ label, value }) => {
        const row = document.createElement("div");
        row.className = "tab-vital-row";

        const lbl = document.createElement("span");
        lbl.className = "tab-vital-label";
        lbl.textContent = label;

        const val = document.createElement("span");
        val.className = "tab-vital-value";
        val.textContent = value;

        row.appendChild(lbl);
        row.appendChild(val);
        rangeList.appendChild(row);
      });

      panel.appendChild(rangeList);
    }
  }
}

function renderHealthMetrics(items) {
  const panel = document.getElementById("tab-panel-health");
  panel.innerHTML = "";

  if (!Array.isArray(items) || !items.length) {
    panel.innerHTML =
      '<div class="tab-placeholder">' +
        '<span class="tab-placeholder-icon">🩺</span>' +
        "Health and conservation metric data is not yet available for this species." +
      "</div>";
    return;
  }

  const list = document.createElement("div");
  list.className = "tab-health-list";

  const TREND_SYMBOLS = { up: "▲", down: "▼", stable: "—" };
  const TREND_CLASSES  = { up: "tab-trend--up", down: "tab-trend--down", stable: "tab-trend--stable" };

  items.forEach(({ label, value, trend }) => {
    const row = document.createElement("div");
    row.className = "tab-health-row";

    const lbl = document.createElement("span");
    lbl.className = "tab-health-label";
    lbl.textContent = label;

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

    row.appendChild(lbl);
    row.appendChild(valueWrap);
    list.appendChild(row);
  });

  panel.appendChild(list);
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

function renderWikiGrid(query) {
  const grid = document.getElementById("wiki-grid");
  const q = query ? query.trim().toLowerCase() : "";
  const filtered = q
    ? WIKI_DATA.items.filter(
        (s) =>
          s.commonName.toLowerCase().includes(q) ||
          s.scientificName.toLowerCase().includes(q) ||
          s.statusLabel.toLowerCase().includes(q)
      )
    : WIKI_DATA.items;

  const favIds = loadFavorites();
  const sorted = [
    ...filtered.filter((s) => favIds.includes(s.id)),
    ...filtered.filter((s) => !favIds.includes(s.id)),
  ];

  grid.innerHTML = "";

  if (sorted.length === 0) {
    const empty = document.createElement("p");
    empty.className = "discover-empty";
    empty.textContent = "No species match your search.";
    grid.appendChild(empty);
    return;
  }

  sorted.forEach((species) => {
    const isFav = favIds.includes(species.id);

    const card = document.createElement("div");
    card.className = "species-card";
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

    // Life bar
    const lifeWrap = document.createElement("div");
    lifeWrap.className = "species-life-wrap";

    const lifeBar = document.createElement("div");
    lifeBar.className = "species-life-bar";

    const lifeFill = document.createElement("div");
    lifeFill.className = "species-life-fill";
    lifeFill.style.width = `${species.lifePercent}%`;
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
    body.appendChild(lifeWrap);
    body.appendChild(funfact);
    card.appendChild(imgArea);
    card.appendChild(body);
    grid.appendChild(card);
  });
}

wikiSearch.addEventListener("input", () => renderWikiGrid(wikiSearch.value));

renderWikiGrid("");

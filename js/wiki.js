// Requires: WIKI_DATA global (loaded by wiki.html bootstrap)
// Requires: PROJECT_CATALOG, applyProjectTheme (from shared.js)

const wikiProject = PROJECT_CATALOG.find((p) => p.id === WIKI_DATA.projectId);

if (wikiProject) {
  applyProjectTheme(wikiProject);
  document.title = wikiProject.name + " Wiki — Sustainability Tracker";
  document.getElementById("wiki-title").textContent = wikiProject.name + " Wiki";
}

const wikiProjectEmoji = wikiProject ? wikiProject.emoji : "?";

function getLifeBarColor(percent) {
  if (percent <= 25) return "#c0320a";
  if (percent <= 45) return "#c07a10";
  if (percent <= 65) return "#b0a010";
  if (percent <= 80) return "#5a8a2a";
  return "#2d6a2d";
}

const RING_CIRCUMFERENCE = 131.95; // 2π × r21

const HABITAT_BADGE = {
  "ocean":      { icon: "🌊", label: "Ocean"       },
  "coastal":    { icon: "🏖",  label: "Coastal"     },
  "tropical":   { icon: "🌡",  label: "Tropical"    },
  "pelagic":    { icon: "🌐",  label: "Pelagic"     },
  "freshwater": { icon: "💧",  label: "Freshwater"  },
  "reef":       { icon: "🪸",  label: "Reef"        },
};

const DIET_BADGE = {
  "carnivore":     { icon: "🦷", label: "Carnivore"     },
  "filter-feeder": { icon: "💧", label: "Filter Feeder" },
  "omnivore":      { icon: "🍽", label: "Omnivore"      },
  "apex-predator": { icon: "⬆",  label: "Apex Predator" },
};

function loadFavorites() {
  return JSON.parse(localStorage.getItem(WIKI_DATA.favoritesKey) || "[]");
}

function saveFavorites(ids) {
  localStorage.setItem(WIKI_DATA.favoritesKey, JSON.stringify(ids));
}

function loadRecentlyViewed() {
  return JSON.parse(localStorage.getItem(WIKI_DATA.recentlyViewedKey) || "[]");
}

function recordRecentlyViewed(id) {
  const MAX = 20;
  const list = loadRecentlyViewed().filter((x) => x !== id);
  list.unshift(id);
  localStorage.setItem(WIKI_DATA.recentlyViewedKey, JSON.stringify(list.slice(0, MAX)));
}

function updateFavoritesToggleText() {
  const btn = document.getElementById("wiki-favorites-toggle");
  const count = loadFavorites().length;
  const star = showFavoritesOnly ? "\u2605" : "\u2606";
  btn.textContent = star + " Favorites" + (count > 0 ? ` (${count})` : "");
}

// Species detail modal
const speciesModal = document.getElementById("species-modal");
let activeCard = null;
let tabPanelsScrollListener = null;
let unitMode = localStorage.getItem("wiki_unit_mode") || "metric";
let currentModalSpecies = null;
let suppressHistoryUpdate = false;
let currentFilteredSorted = [];
let currentModalIndex = -1;
let isNavAnimating = false;

// ── Gallery state ───────────────────────────────────────────────
let galleryPhotos = [];
let galleryIndex = 0;
const galleryOverlay = document.getElementById("photo-gallery");
const galleryImg = document.getElementById("gallery-img");
const galleryCounter = document.getElementById("gallery-counter");
const galleryThumbsEl = document.getElementById("gallery-thumbs");

function getSpeciesPhotos(species) {
  return species.photos || [];
}

function renderGallerySlide() {
  galleryImg.src = galleryPhotos[galleryIndex];
  galleryImg.alt = `Photo ${galleryIndex + 1} of ${galleryPhotos.length}`;
  galleryCounter.textContent = galleryPhotos.length > 1 ? `${galleryIndex + 1} / ${galleryPhotos.length}` : "";
  const thumbs = galleryThumbsEl.querySelectorAll(".gallery-thumb");
  thumbs.forEach((t, i) => t.classList.toggle("active", i === galleryIndex));
}

function renderGalleryThumbs() {
  galleryThumbsEl.innerHTML = "";
  if (galleryPhotos.length <= 1) {
    galleryThumbsEl.style.display = "none";
    return;
  }
  galleryThumbsEl.style.display = "";
  galleryPhotos.forEach((src, i) => {
    const btn = document.createElement("button");
    btn.className = "gallery-thumb" + (i === galleryIndex ? " active" : "");
    btn.setAttribute("aria-label", `View photo ${i + 1}`);
    btn.style.backgroundImage = `url(${src})`;
    btn.addEventListener("click", () => {
      if (i === galleryIndex) return;
      galleryImg.style.transition = "opacity 0.15s ease";
      galleryImg.style.opacity = "0";
      setTimeout(() => {
        galleryIndex = i;
        renderGallerySlide();
        galleryImg.style.transition = "opacity 0.15s ease";
        galleryImg.style.opacity = "";
        setTimeout(() => { galleryImg.style.transition = ""; }, 150);
      }, 150);
    });
    galleryThumbsEl.appendChild(btn);
  });
}

function openGallery(photos, startIndex = 0) {
  galleryPhotos = photos;
  galleryIndex = startIndex;
  renderGalleryThumbs();
  renderGallerySlide();
  galleryOverlay.classList.remove("hidden");

  // Scale-up entrance animation
  galleryImg.style.transition = "none";
  galleryImg.style.opacity = "0";
  galleryImg.style.transform = "scale(0.9)";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      galleryImg.style.transition = "opacity 0.25s ease, transform 0.25s ease";
      galleryImg.style.opacity = "";
      galleryImg.style.transform = "";
      setTimeout(() => { galleryImg.style.transition = ""; }, 250);
    });
  });
}

function closeGallery() {
  galleryOverlay.classList.add("hidden");
}

function navigateGallery(dir) {
  if (galleryPhotos.length <= 1) return;
  const slideOut = dir > 0 ? "-50px" : "50px";
  const slideIn  = dir > 0 ?  "50px" : "-50px";

  galleryImg.style.transition = "opacity 0.18s ease, transform 0.18s ease";
  galleryImg.style.opacity = "0";
  galleryImg.style.transform = `translateX(${slideOut})`;

  setTimeout(() => {
    galleryIndex = (galleryIndex + dir + galleryPhotos.length) % galleryPhotos.length;
    renderGallerySlide();

    galleryImg.style.transition = "none";
    galleryImg.style.opacity = "0";
    galleryImg.style.transform = `translateX(${slideIn})`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        galleryImg.style.transition = "opacity 0.18s ease, transform 0.18s ease";
        galleryImg.style.opacity = "";
        galleryImg.style.transform = "";
        setTimeout(() => { galleryImg.style.transition = ""; }, 180);
      });
    });
  }, 180);
}

document.getElementById("gallery-close").addEventListener("click", (e) => { e.stopPropagation(); closeGallery(); });
document.getElementById("gallery-prev").addEventListener("click", (e) => { e.stopPropagation(); navigateGallery(-1); });
document.getElementById("gallery-next").addEventListener("click", (e) => { e.stopPropagation(); navigateGallery(1); });
galleryImg.addEventListener("click", (e) => e.stopPropagation());
galleryThumbsEl.addEventListener("click", (e) => e.stopPropagation());
galleryOverlay.addEventListener("click", closeGallery);

function openSpeciesModal(species, cardEl, tabKey = "overview") {
  if (!suppressHistoryUpdate) {
    const url = new URL(window.location);
    url.searchParams.set("species", species.id);
    history.pushState({ speciesId: species.id }, "", url);
  }

  activeCard = cardEl;

  const imgArea = document.getElementById("species-modal-image");
  const firstPhoto = species.photos && species.photos[0];
  if (firstPhoto) {
    imgArea.style.backgroundImage = `url(${firstPhoto})`;
    imgArea.style.backgroundSize = "cover";
    imgArea.style.backgroundPosition = "center";
    document.getElementById("species-modal-emoji").style.display = "none";
  } else {
    imgArea.style.backgroundImage = "";
    imgArea.style.background = "linear-gradient(135deg, #0a0a0a, var(--color-primary))";
    document.getElementById("species-modal-emoji").style.display = "";
    document.getElementById("species-modal-emoji").textContent = wikiProjectEmoji;
  }

  // Photo count badge + click-to-gallery
  const photos = getSpeciesPhotos(species);
  let badge = imgArea.querySelector(".photo-count-badge");
  if (photos.length > 0) {
    if (!badge) {
      badge = document.createElement("div");
      badge.className = "photo-count-badge";
      imgArea.appendChild(badge);
    }
    badge.textContent = photos.length === 1 ? `\u229e 1 photo` : `\u229e ${photos.length} photos`;
  } else {
    if (badge) badge.remove();
  }
  if (photos.length > 0) {
    imgArea.style.cursor = "pointer";
    imgArea.onclick = () => openGallery(photos, 0);
    imgArea.setAttribute("role", "button");
    imgArea.setAttribute("aria-label", photos.length > 1 ? `View ${photos.length} photos` : "View photo");
  } else {
    imgArea.style.cursor = "";
    imgArea.onclick = null;
    imgArea.removeAttribute("role");
    imgArea.removeAttribute("aria-label");
  }

  document.getElementById("species-modal-name").textContent = species.commonName;
  document.getElementById("species-modal-sci").textContent = species.scientificName;

  const isFav = loadFavorites().includes(species.id);
  const modalStarBtn = document.getElementById("modal-star-btn");
  modalStarBtn.textContent = isFav ? "\u2605" : "\u2606";
  modalStarBtn.classList.toggle("favorited", isFav);
  modalStarBtn.setAttribute("aria-label", isFav ? `Unfavorite ${species.commonName}` : `Favorite ${species.commonName}`);

  const fill = document.getElementById("species-modal-fill");
  fill.style.width = `${species.lifePercent}%`;
  fill.style.background = getLifeBarColor(species.lifePercent);
  document.getElementById("species-modal-status").textContent = species.statusLabel;

  currentModalSpecies = species;
  recordRecentlyViewed(species.id);
  currentModalIndex = currentFilteredSorted.findIndex((s) => s.id === species.id);
  updateModalNavState();
  activateTab(tabKey);
  renderOverview(species);
  renderVitalSigns(species);
  renderHealthMetrics(species);
  renderThreats(species.threats);
  renderActionItems(species.actionItems);

  const modalContent = speciesModal.querySelector(".species-modal");

  modalContent.scrollTop = 0;

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

function updateModalNavState() {
  const prevBtn = document.getElementById("modal-prev");
  const nextBtn = document.getElementById("modal-next");
  const counter = document.getElementById("modal-counter");
  const total = currentFilteredSorted.length;
  const canNav = total > 1 && currentModalIndex >= 0;
  prevBtn.disabled = !canNav;
  nextBtn.disabled = !canNav;
  counter.textContent = currentModalIndex >= 0 ? `${currentModalIndex + 1} / ${total}` : "";
}

function navigateModal(dir) {
  if (isNavAnimating) return;
  const total = currentFilteredSorted.length;
  if (total === 0 || currentModalIndex < 0) return;
  const newIndex = (currentModalIndex + dir + total) % total;
  const activeTab = document.querySelector(".species-tab.active")?.dataset.tab || "overview";
  const modalContent = speciesModal.querySelector(".species-modal");

  isNavAnimating = true;
  const slideOut = dir > 0 ? "-28px" : "28px";
  const slideIn  = dir > 0 ?  "28px" : "-28px";

  // Fade + slide out
  modalContent.style.transition = "opacity 0.2s ease, transform 0.2s ease";
  modalContent.style.opacity   = "0";
  modalContent.style.transform = `translateX(${slideOut})`;

  setTimeout(() => {
    // Swap content while invisible
    openSpeciesModal(currentFilteredSorted[newIndex], null, activeTab);

    // Jump to enter position (no transition)
    modalContent.style.transition = "none";
    modalContent.style.opacity    = "0";
    modalContent.style.transform  = `translateX(${slideIn})`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Animate into place
        modalContent.style.transition = "opacity 0.2s ease, transform 0.2s ease";
        modalContent.style.opacity    = "";
        modalContent.style.transform  = "";

        setTimeout(() => {
          modalContent.style.transition = "";
          isNavAnimating = false;
        }, 200);
      });
    });
  }, 200);
}

document.getElementById("modal-star-btn").addEventListener("click", () => {
  if (!currentModalSpecies) return;
  const ids = loadFavorites();
  const idx = ids.indexOf(currentModalSpecies.id);
  if (idx === -1) {
    ids.push(currentModalSpecies.id);
  } else {
    ids.splice(idx, 1);
  }
  saveFavorites(ids);
  const isFav = ids.includes(currentModalSpecies.id);
  const btn = document.getElementById("modal-star-btn");
  btn.textContent = isFav ? "\u2605" : "\u2606";
  btn.classList.toggle("favorited", isFav);
  btn.setAttribute("aria-label", isFav ? `Unfavorite ${currentModalSpecies.commonName}` : `Favorite ${currentModalSpecies.commonName}`);
  renderWikiGrid(wikiSearch.value);
});

document.getElementById("modal-prev").addEventListener("click", () => navigateModal(-1));
document.getElementById("modal-next").addEventListener("click", () => navigateModal(1));

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
  const modalContent = speciesModal.querySelector(".species-modal");
  if (modalContent) modalContent.scrollTop = 0;
}

document.querySelectorAll(".species-tab").forEach((btn) => {
  btn.addEventListener("click", () => activateTab(btn.dataset.tab));
});

// ── Tab content renderers ──────────────────────────────────────

function createSectionBox(icon, title, headerSlot) {
  const box = document.createElement("div");
  box.className = "section-box";

  const header = document.createElement("div");
  header.className = "section-box-header";

  const titleEl = document.createElement("div");
  titleEl.className = "section-box-title";

  const iconEl = document.createElement("span");
  iconEl.className = "section-box-icon";
  iconEl.textContent = icon;

  titleEl.appendChild(iconEl);
  titleEl.appendChild(document.createTextNode("\u00a0" + title));
  header.appendChild(titleEl);
  if (headerSlot) header.appendChild(headerSlot);
  box.appendChild(header);

  const body = document.createElement("div");
  body.className = "section-box-body";
  box.appendChild(body);

  return box;
}

function renderOverview(species) {
  const panel = document.getElementById("tab-panel-overview");
  panel.innerHTML = "";

  // Description
  if (species.description) {
    const desc = document.createElement("p");
    desc.className = "overview-description";
    desc.textContent = species.description;
    panel.appendChild(desc);
  }

  // Status bar
  const barColor = getLifeBarColor(species.lifePercent);
  const statusBar = document.createElement("div");
  statusBar.className = "overview-status-bar";
  statusBar.style.borderColor = barColor;
  statusBar.style.background = barColor + "11";

  const badge = document.createElement("span");
  badge.className = "overview-status-badge";
  badge.textContent = species.statusLabel;
  badge.style.background = barColor + "22";
  badge.style.color = barColor;
  badge.style.borderColor = barColor + "66";
  badge.style.border = "1px solid " + barColor + "66";

  const fillWrap = document.createElement("div");
  fillWrap.className = "overview-status-fill-wrap";

  const track = document.createElement("div");
  track.className = "overview-status-track";

  const fill = document.createElement("div");
  fill.className = "overview-status-fill";
  fill.style.width = species.lifePercent + "%";
  fill.style.background = barColor;

  const pct = document.createElement("div");
  pct.className = "overview-status-pct";
  pct.textContent = "Population health: " + species.lifePercent + "%";

  track.appendChild(fill);
  fillWrap.appendChild(track);
  fillWrap.appendChild(pct);
  statusBar.appendChild(badge);
  statusBar.appendChild(fillWrap);
  panel.appendChild(statusBar);

  // Fun fact
  if (species.funFact) {
    const funfact = document.createElement("div");
    funfact.className = "overview-funfact";

    const label = document.createElement("div");
    label.className = "overview-funfact-label";
    label.textContent = "Did you know?";

    const text = document.createElement("div");
    text.className = "overview-funfact-text";
    text.textContent = species.funFact;

    funfact.appendChild(label);
    funfact.appendChild(text);
    panel.appendChild(funfact);
  }

  // At a Glance section box
  const allVitals = Array.isArray(species.vitalSigns) ? species.vitalSigns : [];
  const glanceItems = allVitals.filter((v) => v.glance).slice(0, 6);
  const fallbackItems = allVitals.slice(0, 6);
  const statItems = glanceItems.length ? glanceItems : fallbackItems;

  if (statItems.length) {
    const box = createSectionBox("🔍", "At a Glance");
    const grid = document.createElement("div");
    grid.className = "overview-stats-grid";

    statItems.forEach((item) => {
      const displayValue =
        unitMode === "metric"   && item.metric   ? item.metric   :
        unitMode === "imperial" && item.imperial ? item.imperial :
        item.value;

      const card = document.createElement("div");
      card.className = "overview-stat-card";

      const lbl = document.createElement("div");
      lbl.className = "overview-stat-label";
      lbl.textContent = item.label;

      const val = document.createElement("div");
      val.className = "overview-stat-value";
      val.textContent = displayValue;

      card.appendChild(lbl);
      card.appendChild(val);
      grid.appendChild(card);
    });

    box.querySelector(".section-box-body").appendChild(grid);
    panel.appendChild(box);
  }

  // Habitat Distribution section box
  if (species.habitatImage) {
    const box = createSectionBox("🗺️", "Habitat Distribution");
    const body = box.querySelector(".section-box-body");

    const img = document.createElement("img");
    img.className = "overview-habitat-img";
    img.src = species.habitatImage;
    img.alt = "Habitat distribution map for " + species.commonName;

    const mapLink = document.createElement("a");
    mapLink.className = "overview-map-link";
    mapLink.href = "index.html";
    mapLink.textContent = "View on Map \u2192";

    body.appendChild(img);
    body.appendChild(mapLink);
    panel.appendChild(box);
  }

  renderCredits(panel);
}

function renderCredits(panel) {
  const sources = WIKI_DATA.sources;
  if (!Array.isArray(sources) || !sources.length) return;

  const credits = document.createElement("div");
  credits.className = "tab-credits";

  const label = document.createElement("span");
  label.className = "tab-credits-label";
  label.textContent = "Sources:";
  credits.appendChild(label);

  sources.forEach(({ label: srcLabel, url }, i) => {
    if (i > 0) credits.appendChild(document.createTextNode(", "));
    const a = document.createElement("a");
    a.className = "tab-credits-link";
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = srcLabel;
    credits.appendChild(a);
  });

  panel.appendChild(credits);
}

function renderVitalSigns(species) {
  const panel = document.getElementById("tab-panel-vital");
  panel.innerHTML = "";

  const items = species.vitalSigns;
  const hasStats = Array.isArray(items) && items.length;
  const hasScale = !!species.physicalScaleImage;

  if (!hasStats && !hasScale) {
    panel.innerHTML =
      '<div class="tab-placeholder">' +
        '<span class="tab-placeholder-icon">📊</span>' +
        "Vital statistics data is not yet available for this species." +
      "</div>";
    renderCredits(panel);
    return;
  }

  // ── ⚖️ Physical Biology section box ──────────────────────────
  if (hasStats) {
    // Build unit toggle for section box header
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

    const bioBox = createSectionBox("\u2696\ufe0f", "Physical Biology", toggle);
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

    bioBox.querySelector(".section-box-body").appendChild(list);
    panel.appendChild(bioBox);
  }

  // ── 📏 Size Comparison section box ───────────────────────────
  if (hasScale) {
    const scaleBox = createSectionBox("\ud83d\udccf", "Size Comparison");
    const body = scaleBox.querySelector(".section-box-body");
    body.style.padding = "0.6rem 0.9rem";

    const img = document.createElement("img");
    img.className = "tab-vital-subsection-image";
    img.src = species.physicalScaleImage;
    img.alt = "Size comparison of " + species.commonName + " to a human";

    body.appendChild(img);
    panel.appendChild(scaleBox);
  }

  renderCredits(panel);
}

function renderPopulationChart(container, data) {
  const PAD = { top: 14, right: 16, bottom: 32, left: 62 };
  const W = 480, H = 160;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const values = data.map((d) => d.value);
  const minVal = 0;
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
    gridLabel.setAttribute("font-size", "9");
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
    yearLabel.setAttribute("y", H - 8);
    yearLabel.setAttribute("text-anchor", "middle");
    yearLabel.setAttribute("font-size", "9");
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
    renderCredits(panel);
    return;
  }

  const TREND_SYMBOLS = { up: "▲", down: "▼", stable: "—" };
  const TREND_CLASSES  = { up: "tab-trend--up", down: "tab-trend--down", stable: "tab-trend--stable" };

  // ── Population Trend Chart ─────────────────────────────────────
  if (Array.isArray(species.populationTrend) && species.populationTrend.length) {
    const box = createSectionBox("\ud83d\udcc8", "Population Trend");
    const chartBody = box.querySelector(".section-box-body");
    chartBody.style.padding = "0.65rem 0.75rem";
    const chartWrap = document.createElement("div");
    chartWrap.className = "health-chart-wrap";
    renderPopulationChart(chartWrap, species.populationTrend);
    chartBody.appendChild(chartWrap);
    panel.appendChild(box);
  }

  // ── Key Indicators list ────────────────────────────────────────
  const indicatorsBox = createSectionBox("\ud83d\udcca", "Key Indicators");
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

  indicatorsBox.querySelector(".section-box-body").appendChild(list);
  panel.appendChild(indicatorsBox);

  // ── Regional Pressures ─────────────────────────────────────────
  const hasPrey    = Array.isArray(species.preyDeclineRegions)    && species.preyDeclineRegions.length;
  const hasFishing = Array.isArray(species.fishingPressureRegions) && species.fishingPressureRegions.length;

  if (hasPrey || hasFishing) {
    const pressureBox = createSectionBox("\ud83c\udf0d", "Regional Pressures");
    const body = pressureBox.querySelector(".section-box-body");

    if (hasPrey) {
      const subheader = document.createElement("div");
      subheader.className = "region-subheader";
      subheader.textContent = "Prey Availability";
      body.appendChild(subheader);
      renderRegionGrid(body, species.preyDeclineRegions);
    }

    if (hasFishing) {
      const subheader = document.createElement("div");
      subheader.className = "region-subheader";
      subheader.textContent = "Fishing Pressure";
      body.appendChild(subheader);
      renderRegionGrid(body, species.fishingPressureRegions);
    }

    panel.appendChild(pressureBox);
  }

  renderCredits(panel);
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
    renderCredits(panel);
    return;
  }

  const SEVERITY_ORDER = ["critical", "high", "medium", "low"];
  const groups = {};
  SEVERITY_ORDER.forEach(sev => { groups[sev] = []; });
  items.forEach(item => {
    const sev = item.severity || "medium";
    (groups[sev] || (groups["medium"])).push(item);
  });

  SEVERITY_ORDER.forEach(sev => {
    const group = groups[sev];
    if (!group.length) return;

    const groupEl = document.createElement("div");
    groupEl.className = "threat-group";

    const header = document.createElement("div");
    header.className = "threat-group-header threat-group-header--" + sev;
    header.textContent = sev.charAt(0).toUpperCase() + sev.slice(1);
    groupEl.appendChild(header);

    const cards = document.createElement("div");
    cards.className = "threat-group-cards";

    group.forEach(({ name, description }) => {
      const card = document.createElement("div");
      card.className = "tab-threat-card";

      const nameEl = document.createElement("span");
      nameEl.className = "tab-threat-name";
      nameEl.textContent = name;

      const desc = document.createElement("div");
      desc.className = "tab-threat-desc";
      desc.textContent = description;

      card.appendChild(nameEl);
      card.appendChild(desc);
      cards.appendChild(card);
    });

    groupEl.appendChild(cards);
    panel.appendChild(groupEl);
  });

  renderCredits(panel);
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
    renderCredits(panel);
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
  renderCredits(panel);
}

const wikiSearch = document.getElementById("wiki-search");

let focusedCardIndex = -1;
let activeStatusFilters = new Set();
let sortMode = "default";
let showFavoritesOnly = false;

const SEVERITY_SCORE = { critical: 4, high: 3, medium: 2, low: 1 };

function getThreatSeverityScore(species) {
  if (!species.threats || species.threats.length === 0) return 0;
  return Math.max(...species.threats.map((t) => SEVERITY_SCORE[t.severity] || 0));
}

function getMaxSeverityLabel(species) {
  const score = getThreatSeverityScore(species);
  return { 4: "critical", 3: "high", 2: "medium", 1: "low" }[score] || null;
}

function applyHighlight(el, text, query) {
  if (!query) {
    el.textContent = text;
    return;
  }
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  el.textContent = "";
  parts.forEach((part, i) => {
    if (i % 2 === 1) {
      const mark = document.createElement("mark");
      mark.className = "search-highlight";
      mark.textContent = part;
      el.appendChild(mark);
    } else if (part) {
      el.appendChild(document.createTextNode(part));
    }
  });
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

  const favIds = loadFavorites();

  if (activeStatusFilters.size > 0) {
    filtered = filtered.filter((s) => activeStatusFilters.has(s.statusLabel));
  }

  if (showFavoritesOnly) {
    filtered = filtered.filter((s) => favIds.includes(s.id));
  }

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
  } else if (sortMode === "recently-viewed") {
    const recentIds = loadRecentlyViewed();
    const recentRank = (s) => {
      const i = recentIds.indexOf(s.id);
      return i === -1 ? Infinity : i;
    };
    sorted = [...filtered].sort((a, b) => recentRank(a) - recentRank(b));
  } else {
    sorted = filtered;
  }

  currentFilteredSorted = sorted;
  if (currentModalSpecies && !speciesModal.classList.contains("hidden")) {
    currentModalIndex = currentFilteredSorted.findIndex((s) => s.id === currentModalSpecies.id);
    updateModalNavState();
  }

  grid.innerHTML = "";
  focusedCardIndex = -1;

  if (sorted.length === 0) {
    const hasActiveFilters = activeStatusFilters.size > 0 || showFavoritesOnly || q !== "";
    const empty = document.createElement("div");
    empty.className = "wiki-empty-state";

    const icon = document.createElement("div");
    icon.className = "wiki-empty-icon";
    icon.textContent = "🔍";

    const msg = document.createElement("p");
    msg.className = "wiki-empty-msg";
    msg.textContent = hasActiveFilters
      ? "No species match your current filters."
      : "No species found.";

    empty.appendChild(icon);
    empty.appendChild(msg);

    if (hasActiveFilters) {
      const clearBtn = document.createElement("button");
      clearBtn.className = "wiki-empty-clear-btn";
      clearBtn.textContent = "Clear all filters";
      clearBtn.addEventListener("click", () => {
        document.getElementById("wiki-clear-filters").click();
      });
      empty.appendChild(clearBtn);
    }

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
    const cardPhoto = species.photos && species.photos[0];
    if (cardPhoto) {
      imgArea.style.backgroundImage = `url(${cardPhoto})`;
      imgArea.style.backgroundSize = "cover";
      imgArea.style.backgroundPosition = "center";
    } else {
      imgArea.textContent = wikiProjectEmoji;
      imgArea.style.background = "linear-gradient(135deg, #0a0a0a, var(--color-primary))";
    }

    // Photo count badge
    if (species.photos && species.photos.length > 0) {
      const photoBadge = document.createElement("div");
      photoBadge.className = "card-photo-count";
      photoBadge.textContent = species.photos.length === 1
        ? "1 photo"
        : `${species.photos.length} photos`;
      imgArea.appendChild(photoBadge);
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
    applyHighlight(name, species.commonName, q);

    const sci = document.createElement("div");
    sci.className = "species-card-sci";
    applyHighlight(sci, species.scientificName, q);

    // Threat severity badge
    const maxSeverity = getMaxSeverityLabel(species);
    let threatBadge = null;
    if (maxSeverity) {
      threatBadge = document.createElement("div");
      threatBadge.className = `card-threat-badge tab-severity-badge tab-severity-badge--${maxSeverity}`;
      threatBadge.textContent = maxSeverity.charAt(0).toUpperCase() + maxSeverity.slice(1);
    }

    // Habitat + diet badges
    const badgeRow = document.createElement("div");
    badgeRow.className = "card-badges";
    (species.habitatTypes || []).forEach((type) => {
      const info = HABITAT_BADGE[type];
      if (!info) return;
      const b = document.createElement("span");
      b.className = `card-badge card-badge--habitat card-badge--${type}`;
      b.textContent = `${info.icon} ${info.label}`;
      badgeRow.appendChild(b);
    });
    if (species.dietType) {
      const info = DIET_BADGE[species.dietType];
      if (info) {
        const b = document.createElement("span");
        b.className = `card-badge card-badge--diet card-badge--${species.dietType}`;
        b.textContent = `${info.icon} ${info.label}`;
        badgeRow.appendChild(b);
      }
    }

    // Progress ring
    const ringColor = getLifeBarColor(species.lifePercent);
    const targetOffset = (RING_CIRCUMFERENCE * (1 - species.lifePercent / 100)).toFixed(2);
    const ringWrap = document.createElement("div");
    ringWrap.className = "card-ring-wrap";
    ringWrap.innerHTML = `
      <svg class="card-ring-svg" viewBox="0 0 52 52" width="50" height="50" aria-hidden="true">
        <circle class="ring-track" cx="26" cy="26" r="21"/>
        <circle class="ring-fill" cx="26" cy="26" r="21"
          stroke="${ringColor}"
          style="stroke-dashoffset:${RING_CIRCUMFERENCE}"
          data-target-offset="${targetOffset}"
          transform="rotate(-90,26,26)"/>
        <text class="ring-pct-txt" x="26" y="26">${species.lifePercent}%</text>
      </svg>
      <div class="card-ring-meta">
        <div class="card-ring-status"></div>
        <div class="card-ring-sub">Population health</div>
      </div>`;
    applyHighlight(ringWrap.querySelector(".card-ring-status"), species.statusLabel, q);

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
    body.appendChild(badgeRow);
    if (threatBadge) body.appendChild(threatBadge);
    body.appendChild(ringWrap);
    body.appendChild(funfact);
    card.appendChild(imgArea);
    card.appendChild(body);
    grid.appendChild(card);
  });

  // Animate progress rings from 0 to their value as cards enter the viewport
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
      const ring = entry.target.querySelector(".ring-fill");
      if (ring) setTimeout(() => { ring.style.strokeDashoffset = ring.dataset.targetOffset; }, i * 60);
      window._wikiLifeObserver.unobserve(entry.target);
    });
  }, { threshold: 0.15 });
  grid.querySelectorAll(".species-card").forEach((card) => window._wikiLifeObserver.observe(card));
  updateClearFiltersVisibility();
  updateFavoritesToggleText();
}

wikiSearch.addEventListener("input", () => renderWikiGrid(wikiSearch.value));

document.getElementById("wiki-sort").addEventListener("change", (e) => {
  sortMode = e.target.value;
  renderWikiGrid(wikiSearch.value);
});

document.getElementById("wiki-favorites-toggle").addEventListener("click", () => {
  showFavoritesOnly = !showFavoritesOnly;
  const btn = document.getElementById("wiki-favorites-toggle");
  btn.classList.toggle("active", showFavoritesOnly);
  btn.setAttribute("aria-pressed", String(showFavoritesOnly));
  updateFavoritesToggleText();
  renderWikiGrid(wikiSearch.value);
});

function updateClearFiltersVisibility() {
  const hasFilters =
    wikiSearch.value.trim() !== "" ||
    activeStatusFilters.size > 0 ||
    sortMode !== "default" ||
    showFavoritesOnly;
  document.getElementById("wiki-clear-filters").hidden = !hasFilters;
}

document.getElementById("wiki-clear-filters").addEventListener("click", () => {
  wikiSearch.value = "";
  activeStatusFilters.clear();
  sortMode = "default";
  showFavoritesOnly = false;
  document.getElementById("wiki-sort").value = "default";
  const favBtn = document.getElementById("wiki-favorites-toggle");
  favBtn.classList.remove("active");
  favBtn.setAttribute("aria-pressed", "false");
  updateFavoritesToggleText();
  document.querySelectorAll(".status-chip").forEach((chip) => {
    chip.classList.remove("active");
    chip.setAttribute("aria-pressed", "false");
  });
  renderWikiGrid("");
});

document.getElementById("wiki-surprise-btn").addEventListener("click", () => {
  const items = WIKI_DATA.items;
  if (!items || items.length === 0) return;
  const randomSpecies = items[Math.floor(Math.random() * items.length)];
  openSpeciesModal(randomSpecies, null);
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
  const galleryOpen = !galleryOverlay.classList.contains("hidden");
  if (galleryOpen) {
    if (e.key === "Escape") { e.preventDefault(); closeGallery(); return; }
    if (e.key === "ArrowLeft")  { e.preventDefault(); navigateGallery(-1); return; }
    if (e.key === "ArrowRight") { e.preventDefault(); navigateGallery(1);  return; }
    return;
  }

  const modalOpen = !speciesModal.classList.contains("hidden");

  if (modalOpen) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeSpeciesModal();
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      navigateModal(-1);
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      navigateModal(1);
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

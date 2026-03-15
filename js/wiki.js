// Requires: WIKI_DATA global (loaded by wiki.html bootstrap)
// Requires: PROJECT_CATALOG, applyProjectTheme (from shared.js)

const wikiProject = PROJECT_CATALOG.find((p) => p.id === WIKI_DATA.projectId);

if (wikiProject) {
  applyProjectTheme(wikiProject);
  document.title = wikiProject.name + " Wiki — Sustainability Tracker";
  document.getElementById("wiki-title").textContent = wikiProject.name + " Wiki";
}

const wikiProjectEmoji = wikiProject ? wikiProject.emoji : "?";
const SILHOUETTE_FALLBACK = WIKI_DATA.silhouetteFallback || null;

function applySilhouetteBg(el) {
  el.style.background = "";
  el.style.backgroundImage = `url(${SILHOUETTE_FALLBACK})`;
  el.style.backgroundSize = "cover";
  el.style.backgroundPosition = "center";
}

function applyPhotoBg(el, src, lqip) {
  el.style.background = "";
  el.style.backgroundImage = "";

  // If LQIP layers were eagerly created in createSpeciesCard (data URL, zero network wait),
  // just wire up the full-res load into the existing overlay layer.
  const existingLqip = el.querySelector(".card-img-lqip");
  const existingFull = el.querySelector(".card-img-full");
  if (existingLqip && existingFull) {
    existingFull.style.backgroundImage = `url(${src})`;
    const probe = new Image();
    probe.onload = () => existingFull.classList.add("loaded");
    probe.onerror = () => {
      existingLqip.remove();
      existingFull.remove();
      applySilhouetteBg(el);
    };
    probe.src = src;
    return;
  }

  el.querySelectorAll(".card-img-lqip, .card-img-full").forEach(n => n.remove());

  // If we have a LQIP, show it blurred while the full image loads.
  // Both layers are child divs so overflow:hidden on the parent clips the blur cleanly.
  if (lqip) {
    const lqipLayer = document.createElement("div");
    lqipLayer.className = "card-img-lqip";
    lqipLayer.style.backgroundImage = `url(${lqip})`;
    el.appendChild(lqipLayer);

    const overlay = document.createElement("div");
    overlay.className = "card-img-full";
    overlay.style.backgroundImage = `url(${src})`;
    el.appendChild(overlay);

    const probe = new Image();
    probe.onload = () => overlay.classList.add("loaded");
    probe.onerror = () => {
      lqipLayer.remove();
      overlay.remove();
      applySilhouetteBg(el);
    };
    probe.src = src;
  } else {
    el.style.backgroundImage = `url(${src})`;
    el.style.backgroundSize = "cover";
    el.style.backgroundPosition = "center";
    if (SILHOUETTE_FALLBACK) {
      const probe = new Image();
      probe.onerror = () => applySilhouetteBg(el);
      probe.src = src;
    }
  }
}

function getLifeBarColor(percent) {
  if (percent <= 25) return "#c0320a";
  if (percent <= 45) return "#c07a10";
  if (percent <= 65) return "#b0a010";
  if (percent <= 80) return "#5a8a2a";
  return "#2d6a2d";
}

const RING_CIRCUMFERENCE = 131.95; // 2π × r21

const HABITAT_BADGE = {
  "ocean":      { icon: "🌊", label: "Ocean",       color: "#185aa8", bg: "rgba(24,90,168,0.1)"   },
  "coastal":    { icon: "🏖",  label: "Coastal",     color: "#136050", bg: "rgba(18,118,96,0.1)"   },
  "tropical":   { icon: "🌡",  label: "Tropical",    color: "#0a7640", bg: "rgba(10,138,72,0.1)"   },
  "pelagic":    { icon: "🌐",  label: "Pelagic",     color: "#28369a", bg: "rgba(56,76,180,0.1)"   },
  "freshwater": { icon: "💧",  label: "Freshwater",  color: "#106890", bg: "rgba(24,140,180,0.1)"  },
  "reef":       { icon: "🪸",  label: "Reef",        color: "#905010", bg: "rgba(200,100,20,0.1)"  },
};

const DIET_BADGE = {
  "carnivore":     { icon: "🦷", label: "Carnivore",     color: "#881818", bg: "rgba(160,40,40,0.1)"   },
  "filter-feeder": { icon: "💧", label: "Filter Feeder", color: "#185aa8", bg: "rgba(24,90,168,0.12)"  },
  "omnivore":      { icon: "🍽", label: "Omnivore",      color: "#604010", bg: "rgba(100,70,10,0.1)"   },
  "apex-predator": { icon: "⬆",  label: "Apex Predator", color: "#501460", bg: "rgba(80,20,100,0.1)"   },
};

const GEOGRAPHIC_REGION = {
  "tropical":      { icon: "🌴", label: "Tropical",      color: "#0a7640", bg: "rgba(10,138,72,0.1)"   },
  "temperate":     { icon: "🌊", label: "Temperate",      color: "#185aa8", bg: "rgba(24,90,168,0.1)"   },
  "mediterranean": { icon: "🏛",  label: "Mediterranean",  color: "#905010", bg: "rgba(200,100,20,0.1)"  },
};

const TAG_BADGE = {
  "migratory": { icon: "🧭", label: "Migratory", color: "#0e7c8a", bg: "rgba(14,124,138,0.12)" },
  "schooling":  { icon: "🐟", label: "Schooling", color: "#1a6e5c", bg: "rgba(26,110,92,0.12)"  },
  "solitary":   { icon: "🦈", label: "Solitary",  color: "#3d4f6e", bg: "rgba(61,79,110,0.12)"  },
  "nocturnal":  { icon: "🌙", label: "Nocturnal", color: "#4a1a6e", bg: "rgba(74,26,110,0.12)"  },
  "bycatch":    { icon: "🎣", label: "Bycatch",   color: "#7a4010", bg: "rgba(122,64,16,0.12)"  },
  "finning":    { icon: "✂️", label: "Finning",   color: "#7a1818", bg: "rgba(122,24,24,0.12)"  },
  "keystone":   { icon: "🔑", label: "Keystone",  color: "#7a6010", bg: "rgba(122,96,16,0.12)"  },
};

const DATA_TIER_BADGE = {
  "full":     { icon: "📊", label: "Full",     color: "#1a6e3c", bg: "rgba(26,110,60,0.12)"  },
  "standard": { icon: "📋", label: "Standard", color: "#185aa8", bg: "rgba(24,90,168,0.12)"  },
  "stub":     { icon: "📄", label: "Stub",     color: "#707070", bg: "rgba(112,112,112,0.12)" },
};

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

function getStatusAtYear(statusHistory, year) {
  if (!Array.isArray(statusHistory) || !statusHistory.length) return null;
  let result = null;
  for (const entry of statusHistory) {
    if (entry.year <= year) result = entry.status;
  }
  return result;
}

function getStatusColor(statusLabel) {
  const found = STATUS_ORDER.find((s) => s.label === statusLabel);
  return found ? found.color : null;
}

const COMPLETENESS_FIELDS = ["vitalSigns", "populationTrend", "healthMetrics", "actionItems"];

function isSpeciesIncomplete(species) {
  return COMPLETENESS_FIELDS.some((f) => !species[f] || (Array.isArray(species[f]) && species[f].length === 0));
}

function getSpeciesTier(species) {
  const hasAllFields = !isSpeciesIncomplete(species);
  if (hasAllFields && species.physicalScaleImage) return "full";
  if (hasAllFields) return "standard";
  return "stub";
}

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
  const manageBtn = document.getElementById("wiki-manage-favorites-btn");
  manageBtn.hidden = count === 0;
  manageBtn.classList.toggle("active", manageFavoritesMode);
}

// Species detail modal
const speciesModal   = document.getElementById("species-modal");
const kbHelpOverlay  = document.getElementById("kb-help-overlay");
let activeCard = null;
let tabPanelsScrollListener = null;
let unitMode = localStorage.getItem("wiki_unit_mode") || "metric";
let currentModalSpecies = null;
let suppressHistoryUpdate = false;
let currentFilteredSorted = [];
let currentModalIndex = -1;
let isNavAnimating = false;
const tabPanelCache = new Map();

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
    if (tabKey && tabKey !== "overview") {
      url.searchParams.set("tab", tabKey);
    } else {
      url.searchParams.delete("tab");
    }
    history.pushState({ speciesId: species.id }, "", url);
  }

  activeCard = cardEl;

  const imgArea = document.getElementById("species-modal-image");
  const firstPhoto = species.photos && species.photos[0];
  if (firstPhoto) {
    applyPhotoBg(imgArea, firstPhoto, species.lqip || null);
    document.getElementById("species-modal-emoji").style.display = "none";
  } else if (SILHOUETTE_FALLBACK) {
    applySilhouetteBg(imgArea);
    document.getElementById("species-modal-emoji").style.display = "none";
  } else {
    imgArea.style.backgroundImage = "";
    imgArea.style.background = "linear-gradient(135deg, #0a0a0a, var(--color-primary))";
    document.getElementById("species-modal-emoji").style.display = "";
    document.getElementById("species-modal-emoji").textContent = species.emoji || wikiProjectEmoji;
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
  document.getElementById("species-modal-incomplete").hidden = !isSpeciesIncomplete(species);

  const isFav = loadFavorites().includes(species.id);
  const modalStarBtn = document.getElementById("modal-star-btn");
  modalStarBtn.textContent = isFav ? "\u2605" : "\u2606";
  modalStarBtn.classList.toggle("favorited", isFav);
  modalStarBtn.setAttribute("aria-label", isFav ? `Unfavorite ${species.commonName}` : `Favorite ${species.commonName}`);

  currentModalSpecies = species;
  recordRecentlyViewed(species.id);
  currentModalIndex = currentFilteredSorted.findIndex((s) => s.id === species.id);
  updateModalNavState();

  // Preload adjacent species images for instant prev/next nav
  if (currentModalIndex >= 0 && currentFilteredSorted.length > 1) {
    const total = currentFilteredSorted.length;
    [-1, 1].forEach((offset) => {
      const adjSpecies = currentFilteredSorted[(currentModalIndex + offset + total) % total];
      const photo = adjSpecies?.photos?.[0];
      if (photo) {
        const img = new Image();
        img.src = photo;
      }
    });
  }
  activateTab(tabKey);
  const currentQ = wikiSearch.value.trim().toLowerCase();
  renderTabCached("tab-panel-overview", `overview:${species.id}`, () => renderOverview(species));
  animateOverviewBar();
  renderTabCached("tab-panel-vital",    `vital:${species.id}:${unitMode}`, () => renderVitalSigns(species));
  renderTabCached("tab-panel-health",   `health:${species.id}`, () => renderHealthMetrics(species));
  if (tabKey === "health") animateHealthChart();
  renderTabCached("tab-panel-threats",  `threats:${species.id}:${currentQ}`, () => renderThreats(species.threats, currentQ));
  renderTabCached("tab-panel-actions",  `actions:${species.id}:${currentQ}`, () => renderActionItems(species.actionItems, currentQ));

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
    // No card to morph from (deep link / surprise) — fade in with subtle scale-up
    modalContent.style.transition = "none";
    modalContent.style.transform = "scale(0.95)";
    speciesModal.classList.remove("hidden");
    modalContent.getBoundingClientRect(); // commit starting state
    modalContent.style.transition = "";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        modalContent.style.transform = "";
      });
    });
  }
}

function closeSpeciesModal() {
  if (!suppressHistoryUpdate) {
    const url = new URL(window.location);
    url.searchParams.delete("species");
    url.searchParams.delete("tab");
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

  if (returnToCompare) {
    returnToCompare = false;
    document.getElementById("compare-modal").classList.remove("hidden");
  }
}

function toTitleCase(str) {
  return str.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getFilterContextLabel() {
  const parts = [];
  const q = wikiSearch.value.trim();
  if (q) parts.push(`"${q}"`);
  if (showFavoritesOnly) parts.push("Favorites");
  if (activeStatusFilters.size === 1) parts.push([...activeStatusFilters][0]);
  else if (activeStatusFilters.size > 1) parts.push(`${activeStatusFilters.size} Statuses`);
  if (activeHabitatFilters.size === 1) parts.push(HABITAT_BADGE[[...activeHabitatFilters][0]]?.label ?? toTitleCase([...activeHabitatFilters][0]));
  else if (activeHabitatFilters.size > 1) parts.push(`${activeHabitatFilters.size} Habitats`);
  if (activeDietFilters.size === 1) parts.push(DIET_BADGE[[...activeDietFilters][0]]?.label ?? toTitleCase([...activeDietFilters][0]));
  else if (activeDietFilters.size > 1) parts.push(`${activeDietFilters.size} Diets`);
  if (activeRegionFilters.size === 1) parts.push(toTitleCase([...activeRegionFilters][0]));
  else if (activeRegionFilters.size > 1) parts.push(`${activeRegionFilters.size} Regions`);
  if (activeTagFilters.size === 1) parts.push(toTitleCase([...activeTagFilters][0]));
  else if (activeTagFilters.size > 1) parts.push(`${activeTagFilters.size} Tags`);
  if (activePhotoFilters.has("has-photos")) parts.push("With Photos");
  return parts.length > 0 ? parts.join(" · ") : null;
}

function updateModalNavState() {
  const prevBtn = document.getElementById("modal-prev");
  const nextBtn = document.getElementById("modal-next");
  const counter = document.getElementById("modal-counter");
  const filterLabel = document.getElementById("modal-filter-label");
  const total = currentFilteredSorted.length;
  const canNav = total > 1 && currentModalIndex >= 0;
  prevBtn.disabled = !canNav;
  nextBtn.disabled = !canNav;
  counter.textContent = currentModalIndex >= 0 ? `${currentModalIndex + 1} / ${total}` : "";
  if (filterLabel) {
    const label = getFilterContextLabel();
    if (label && currentModalIndex >= 0) {
      filterLabel.textContent = `Filtered by ${label}`;
      filterLabel.hidden = false;
    } else {
      filterLabel.hidden = true;
    }
  }
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

document.getElementById("modal-share-btn").addEventListener("click", () => {
  navigator.clipboard.writeText(window.location.href).then(() => {
    const btn = document.getElementById("modal-share-btn");
    const prev = btn.innerHTML;
    btn.innerHTML = "&#10003;";
    btn.classList.add("modal-share-copied");
    setTimeout(() => {
      btn.innerHTML = prev;
      btn.classList.remove("modal-share-copied");
    }, 1500);
  });
});

// ── Export / Print ────────────────────────────────────────────────────────────
(function () {
  const exportBtn = document.getElementById("modal-export-btn");

  // Wrap button in a position:relative anchor for the dropdown
  const wrap = document.createElement("div");
  wrap.className = "modal-export-wrap";
  exportBtn.parentNode.insertBefore(wrap, exportBtn);
  wrap.appendChild(exportBtn);

  // Build dropdown
  const dropdown = document.createElement("div");
  dropdown.className = "export-dropdown";
  dropdown.hidden = true;
  dropdown.innerHTML =
    '<div class="export-dropdown-header">Export species detail</div>' +
    '<button class="export-dropdown-option" id="export-opt-pdf">' +
      '<span class="export-dropdown-icon">📄</span>' +
      '<div><div class="export-dropdown-label">Save as PDF</div>' +
      '<div class="export-dropdown-sub">Download a full-detail PDF</div></div>' +
    '</button>' +
    '<button class="export-dropdown-option" id="export-opt-print">' +
      '<span class="export-dropdown-icon">🖨️</span>' +
      '<div><div class="export-dropdown-label">Print</div>' +
      '<div class="export-dropdown-sub">Open browser print dialog</div></div>' +
    '</button>';
  wrap.appendChild(dropdown);

  exportBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.hidden = !dropdown.hidden;
  });

  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) dropdown.hidden = true;
  });

  document.getElementById("export-opt-pdf").addEventListener("click", () => {
    dropdown.hidden = true;
    if (currentModalSpecies) openPrintWindow(currentModalSpecies);
  });

  document.getElementById("export-opt-print").addEventListener("click", () => {
    dropdown.hidden = true;
    if (currentModalSpecies) openPrintWindow(currentModalSpecies);
  });
})();

function openPrintWindow(species) {
  function esc(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const hColor = getLifeBarColor(species.lifePercent);
  const pColor = (wikiProject && wikiProject.color) || "#2d6a2d";

  // At-a-Glance stats (mirrors renderOverview logic)
  const allVitals = Array.isArray(species.vitalSigns) ? species.vitalSigns : [];
  const glanceItems = allVitals.filter((v) => v.glance).slice(0, 6);
  const statItems = glanceItems.length ? glanceItems : allVitals.slice(0, 6);
  const statsHTML = statItems.length
    ? '<div class="pp-stats-grid">' +
        statItems.map((v) =>
          '<div class="pp-stat-card">' +
            '<div class="pp-stat-label">' + esc(v.label) + "</div>" +
            '<div class="pp-stat-value">' + esc(v.metric || v.value) + "</div>" +
          "</div>"
        ).join("") +
      "</div>"
    : "";

  // Vital Signs rows (all items, metric preferred)
  const vitalsHTML = allVitals.length
    ? allVitals.map((v) =>
        '<div class="pp-row">' +
          '<span class="pp-row-name">' + esc(v.label) + "</span>" +
          '<span class="pp-row-val">' + esc(v.metric || v.value) + "</span>" +
        "</div>"
      ).join("")
    : '<p class="pp-empty">No vital sign data available.</p>';

  // Health Metrics rows
  const TREND_SYM = { up: " \u25b2", down: " \u25bc", stable: "" };
  const healthHTML = Array.isArray(species.healthMetrics) && species.healthMetrics.length
    ? species.healthMetrics.map((m) =>
        '<div class="pp-row">' +
          '<span class="pp-row-name">' + esc(m.label) + "</span>" +
          '<span class="pp-row-val">' + esc(m.value) + (TREND_SYM[m.trend] || "") + "</span>" +
        "</div>"
      ).join("")
    : '<p class="pp-empty">No health metric data available.</p>';

  // Threats (sorted by severity)
  const SEV_ORDER = ["critical", "high", "medium", "low"];
  const BADGE_CLS = { critical: "pp-badge-crit", high: "pp-badge-high", medium: "pp-badge-med", low: "pp-badge-low" };
  const threatsHTML = Array.isArray(species.threats) && species.threats.length
    ? species.threats.slice()
        .sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity))
        .map((t) =>
          '<div class="pp-threat-row">' +
            '<span class="pp-threat-badge ' + (BADGE_CLS[t.severity] || "pp-badge-low") + '">' + esc(t.severity) + "</span>" +
            '<span class="pp-threat-name">' + esc(t.name) + "</span>" +
            '<span class="pp-threat-desc">' + esc(t.description || "") + "</span>" +
          "</div>"
        ).join("")
    : '<p class="pp-empty">No threat data available.</p>';

  // Action Items
  const actionsHTML = Array.isArray(species.actionItems) && species.actionItems.length
    ? species.actionItems.map((a) =>
        '<div class="pp-action-row">' +
          '<div class="pp-action-title">' + esc(a.title) + "</div>" +
          (a.description ? '<div class="pp-action-desc">' + esc(a.description) + "</div>" : "") +
        "</div>"
      ).join("")
    : '<p class="pp-empty">No action item data available.</p>';

  // Sources
  const sources = Array.isArray(WIKI_DATA.sources) ? WIKI_DATA.sources : [];
  const sourcesText = sources.map((s) => esc(s.label)).join(" \u00b7 ") || "\u2014";

  const dateStr = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const descHTML = species.description
    ? '<p class="pp-body">' + esc(species.description) + "</p>"
    : "";

  const funFactHTML = species.funFact
    ? '<div class="pp-funfact"><span class="pp-funfact-label">Did you know?</span> ' + esc(species.funFact) + "</div>"
    : "";

  const html = "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n" +
    '<meta charset="UTF-8"/>\n' +
    "<title>" + esc(species.commonName) + " \u2014 Species Detail</title>\n" +
    "<style>\n" +
    "*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\n" +
    "@page { margin: 2cm 2.2cm; }\n" +
    "body { font-family: Georgia, 'Times New Roman', serif; font-size: 11pt; color: #111; background: white; line-height: 1.6; padding: 2rem 2.5rem; max-width: 760px; margin: 0 auto; print-color-adjust: exact; -webkit-print-color-adjust: exact; }\n" +
    ".pp-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid " + pColor + "; padding-bottom: 0.9rem; margin-bottom: 1.2rem; }\n" +
    ".pp-name { font-size: 1.5rem; font-weight: 700; color: " + pColor + "; line-height: 1.2; }\n" +
    ".pp-sci  { font-size: 0.95rem; font-style: italic; color: " + pColor + "aa; margin-top: 0.2rem; }\n" +
    ".pp-badge-col { display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; }\n" +
    ".pp-status-badge { font-family: -apple-system, Arial, sans-serif; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; border-radius: 4px; padding: 0.25rem 0.65rem; display: inline-block; }\n" +
    ".pp-health-row { display: flex; align-items: center; gap: 0.55rem; }\n" +
    ".pp-health-bar { width: 120px; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden; }\n" +
    ".pp-health-fill { height: 100%; border-radius: 4px; }\n" +
    ".pp-health-pct { font-family: -apple-system, Arial, sans-serif; font-size: 0.68rem; color: #6a6a6a; }\n" +
    ".pp-section { margin-top: 1.3rem; }\n" +
    ".pp-section-title { font-family: -apple-system, Arial, sans-serif; font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: " + pColor + "; border-bottom: 1px solid " + pColor + "44; padding-bottom: 0.25rem; margin-bottom: 0.65rem; }\n" +
    ".pp-body { font-size: 0.88rem; line-height: 1.7; color: #222; }\n" +
    ".pp-empty { font-size: 0.82rem; color: #888; font-style: italic; }\n" +
    ".pp-funfact { font-size: 0.84rem; font-style: italic; color: #444; margin-top: 0.6rem; padding: 0.5rem 0.75rem; background: " + pColor + "12; border-left: 3px solid " + pColor + "; border-radius: 0 4px 4px 0; }\n" +
    ".pp-funfact-label { font-weight: 700; font-style: normal; color: " + pColor + "; margin-right: 0.35rem; }\n" +
    ".pp-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-top: 0.55rem; }\n" +
    ".pp-stat-card { border: 1px solid " + pColor + "44; border-radius: 4px; padding: 0.4rem 0.55rem; background: " + pColor + "0e; }\n" +
    ".pp-stat-label { font-family: -apple-system, Arial, sans-serif; font-size: 0.58rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: " + pColor + "bb; }\n" +
    ".pp-stat-value { font-family: -apple-system, Arial, sans-serif; font-size: 0.83rem; font-weight: 600; color: #111; margin-top: 0.08rem; }\n" +
    ".pp-row { display: grid; grid-template-columns: 185px 1fr; gap: 0.5rem; padding: 0.38rem 0; border-bottom: 1px solid #eee; font-size: 0.85rem; align-items: baseline; }\n" +
    ".pp-row:last-child { border-bottom: none; }\n" +
    ".pp-row-name { font-weight: 700; color: #111; }\n" +
    ".pp-row-val { color: #444; }\n" +
    ".pp-threat-row { display: grid; grid-template-columns: 72px 155px 1fr; gap: 0.5rem; padding: 0.38rem 0; border-bottom: 1px solid #eee; font-size: 0.85rem; align-items: baseline; }\n" +
    ".pp-threat-row:last-child { border-bottom: none; }\n" +
    ".pp-threat-badge { font-family: -apple-system, Arial, sans-serif; font-size: 0.57rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; padding: 0.18rem 0.4rem; border-radius: 3px; display: inline-block; }\n" +
    ".pp-badge-crit { background: #fde8e8; color: #b91c1c; border: 1px solid #fca5a5; }\n" +
    ".pp-badge-high { background: #fef3e2; color: #b45309; border: 1px solid #fcd34d; }\n" +
    ".pp-badge-med  { background: #fefce8; color: #a16207; border: 1px solid #fde68a; }\n" +
    ".pp-badge-low  { background: #f0fdf4; color: #166534; border: 1px solid #86efac; }\n" +
    ".pp-threat-name { font-weight: 700; color: #111; }\n" +
    ".pp-threat-desc { color: #444; }\n" +
    ".pp-action-row { padding: 0.38rem 0; border-bottom: 1px solid #eee; font-size: 0.85rem; }\n" +
    ".pp-action-row:last-child { border-bottom: none; }\n" +
    ".pp-action-title { font-weight: 700; color: #111; }\n" +
    ".pp-action-desc  { color: #444; line-height: 1.5; margin-top: 0.12rem; }\n" +
    ".pp-footer { margin-top: 1.6rem; padding-top: 0.65rem; border-top: 1px solid #ccc; display: flex; justify-content: space-between; align-items: baseline; font-family: -apple-system, Arial, sans-serif; font-size: 0.65rem; color: #888; }\n" +
    ".pp-logo-text { font-weight: 700; color: " + pColor + "; }\n" +
    "@media print { body { padding: 0; } .pp-stats-grid { grid-template-columns: repeat(3, 1fr); } .pp-threat-row, .pp-action-row, .pp-row { page-break-inside: avoid; } }\n" +
    "</style>\n</head>\n<body>\n" +
    '<div class="pp-header">\n' +
      "<div>\n" +
        '<div class="pp-name">' + esc(species.commonName) + "</div>\n" +
        '<div class="pp-sci">' + esc(species.scientificName) + "</div>\n" +
      "</div>\n" +
      '<div class="pp-badge-col">\n' +
        '<span class="pp-status-badge" style="background:' + hColor + '30;color:' + hColor + ';border:2px solid ' + hColor + ';">' + esc(species.statusLabel) + "</span>\n" +
        '<div class="pp-health-row">\n' +
          '<div class="pp-health-bar"><div class="pp-health-fill" style="width:' + species.lifePercent + '%;background:' + hColor + '"></div></div>\n' +
          '<span class="pp-health-pct">' + species.lifePercent + "% health</span>\n" +
        "</div>\n" +
      "</div>\n" +
    "</div>\n" +
    '<div class="pp-section">\n' +
      '<div class="pp-section-title">Overview</div>\n' +
      descHTML + "\n" + funFactHTML + "\n" + statsHTML + "\n" +
    "</div>\n" +
    '<div class="pp-section">\n' +
      '<div class="pp-section-title">Vital Signs</div>\n' +
      vitalsHTML + "\n" +
    "</div>\n" +
    '<div class="pp-section">\n' +
      '<div class="pp-section-title">Health Metrics</div>\n' +
      healthHTML + "\n" +
    "</div>\n" +
    '<div class="pp-section">\n' +
      '<div class="pp-section-title">Threats</div>\n' +
      threatsHTML + "\n" +
    "</div>\n" +
    '<div class="pp-section">\n' +
      '<div class="pp-section-title">Action Items</div>\n' +
      actionsHTML + "\n" +
    "</div>\n" +
    '<div class="pp-footer">\n' +
      "<div><strong>Sources:</strong> " + sourcesText + "</div>\n" +
      "<div>Generated by <span class=\"pp-logo-text\">Sustainability Tracker</span><br/>" + dateStr + "</div>\n" +
    "</div>\n" +
    "</body>\n</html>";

  const blob = new Blob([html], { type: "text/html" });
  const url  = URL.createObjectURL(blob);

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;width:0;height:0;border:none;left:-9999px;top:-9999px;";
  iframe.src = url;
  document.body.appendChild(iframe);

  iframe.addEventListener("load", () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => {
      iframe.remove();
      URL.revokeObjectURL(url);
    }, 1000);
  });
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
      openSpeciesModal(species, cardEl, params.get("tab") || "overview");
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
  btn.addEventListener("click", () => {
    activateTab(btn.dataset.tab);
    if (btn.dataset.tab === "overview") animateOverviewBar();
    if (btn.dataset.tab === "health") animateHealthChart();
    if (currentModalSpecies) {
      const url = new URL(window.location);
      if (btn.dataset.tab && btn.dataset.tab !== "overview") {
        url.searchParams.set("tab", btn.dataset.tab);
      } else {
        url.searchParams.delete("tab");
      }
      history.replaceState(history.state, "", url);
    }
  });
});

function renderTabCached(panelId, cacheKey, renderFn) {
  const panel = document.getElementById(panelId);
  if (tabPanelCache.has(cacheKey)) {
    panel.innerHTML = tabPanelCache.get(cacheKey);
    return;
  }
  renderFn();
  tabPanelCache.set(cacheKey, panel.innerHTML);
}

document.getElementById("tab-panel-vital").addEventListener("click", (e) => {
  const btn = e.target.closest(".vital-unit-btn");
  if (!btn || !currentModalSpecies) return;
  unitMode = btn.dataset.unit;
  localStorage.setItem("wiki_unit_mode", unitMode);
  renderTabCached("tab-panel-vital", `vital:${currentModalSpecies.id}:${unitMode}`, () => renderVitalSigns(currentModalSpecies));
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

function getRelationshipTags(species, rel) {
  const tags = [];

  // Same taxonomic family
  if (species.taxonomy?.family && rel.taxonomy?.family === species.taxonomy.family) {
    tags.push({ icon: "🧬", label: species.taxonomy.family });
  }

  // Same diet type
  const dietLabels = {
    "apex-predator": "Apex predator",
    "filter-feeder": "Filter feeder",
    "carnivore":     "Carnivore",
    "omnivore":      "Omnivore",
  };
  if (rel.dietType && rel.dietType === species.dietType && dietLabels[rel.dietType]) {
    tags.push({ icon: "🍽️", label: dietLabels[rel.dietType] });
  }

  // Shared geographic region
  const regionLabels = {
    "tropical":      "Tropical waters",
    "temperate":     "Temperate waters",
    "arctic":        "Arctic waters",
    "mediterranean": "Mediterranean",
    "global":        "Global range",
  };
  const sharedRegion = (species.geographicRegions || []).find((r) =>
    (rel.geographicRegions || []).includes(r)
  );
  if (sharedRegion && regionLabels[sharedRegion]) {
    tags.push({ icon: "🌊", label: regionLabels[sharedRegion] });
  }

  // Shared habitat (only if no region match already)
  if (!sharedRegion) {
    const habitatLabels = {
      "ocean":     "Open ocean",
      "coastal":   "Coastal",
      "pelagic":   "Pelagic",
      "deep-sea":  "Deep sea",
      "freshwater":"Freshwater",
    };
    const sharedHabitat = (species.habitatTypes || []).find((h) =>
      (rel.habitatTypes || []).includes(h)
    );
    if (sharedHabitat && habitatLabels[sharedHabitat]) {
      tags.push({ icon: "🌊", label: habitatLabels[sharedHabitat] });
    }
  }

  // Shared primary threat
  const speciesThreatNames = (species.threats || []).map((t) => t.name);
  const sharedThreat = (rel.threats || []).find((t) => speciesThreatNames.includes(t.name));
  if (sharedThreat) {
    tags.push({ icon: "⚠️", label: sharedThreat.name });
  }

  return tags.slice(0, 3);
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
  fill.style.width = "0%";
  fill.style.background = barColor;
  fill.dataset.targetPct = species.lifePercent;

  const pctHint = document.createElement("div");
  pctHint.className = "overview-status-pct-hint";

  const pct = document.createElement("div");
  pct.className = "overview-status-pct";
  pct.textContent = "Population health: 0%";

  const infoBtn = document.createElement("button");
  infoBtn.className = "overview-status-info-btn";
  infoBtn.setAttribute("type", "button");
  infoBtn.setAttribute("aria-label", "About population health score");
  infoBtn.textContent = "\u24d8";

  const tooltip = document.createElement("div");
  tooltip.className = "overview-status-tooltip";
  tooltip.setAttribute("role", "tooltip");
  const tooltipTitle = document.createElement("strong");
  tooltipTitle.textContent = "Population health score";
  const tooltipBody = document.createElement("p");
  tooltipBody.textContent =
    "An estimate of how much of this species\u2019 historical population remains today, based on IUCN Red List assessments and long-term wildlife surveys.";
  tooltip.appendChild(tooltipTitle);
  tooltip.appendChild(tooltipBody);

  pctHint.appendChild(pct);
  pctHint.appendChild(infoBtn);
  pctHint.appendChild(tooltip);

  track.appendChild(fill);
  fillWrap.appendChild(track);
  fillWrap.appendChild(pctHint);
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
  if (species.habitatImage || species.geographicRangeDescription) {
    const box = createSectionBox("🗺️", "Habitat Distribution");
    const body = box.querySelector(".section-box-body");

    if (species.habitatImage) {
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
    }

    if (species.geographicRangeDescription) {
      const p = document.createElement("p");
      p.className = "overview-geographic-range";
      p.textContent = species.geographicRangeDescription;
      body.appendChild(p);
    }

    panel.appendChild(box);
  }

  // Related Species section
  if (Array.isArray(species.relatedSpecies) && species.relatedSpecies.length) {
    const related = species.relatedSpecies
      .map((id) => WIKI_DATA.items.find((s) => s.id === id))
      .filter(Boolean)
      .slice(0, 6);

    if (related.length) {
      const box = createSectionBox("🔗", "Related Species");
      const body = box.querySelector(".section-box-body");

      const row = document.createElement("div");
      row.className = "related-species-row";

      related.forEach((rel) => {
        const card = document.createElement("button");
        card.className = "related-species-card";
        card.type = "button";
        card.setAttribute("aria-label", `View ${rel.commonName}`);
        card.addEventListener("click", () => openSpeciesModal(rel, null));

        // Image header
        const thumb = document.createElement("div");
        thumb.className = "related-species-thumb";
        const firstPhoto = rel.photos && rel.photos[0];
        if (firstPhoto) {
          thumb.style.backgroundImage = `url("${firstPhoto}")`;
        } else {
          thumb.classList.add("related-species-thumb--emoji");
          thumb.textContent = rel.emoji || "🦈";
        }

        // Card body
        const cardBody = document.createElement("div");
        cardBody.className = "related-species-body";

        const name = document.createElement("div");
        name.className = "related-species-name";
        name.textContent = rel.commonName;

        const barColor = getLifeBarColor(rel.lifePercent);
        const statusBadge = document.createElement("div");
        statusBadge.className = "related-species-badge";
        statusBadge.textContent = rel.statusLabel;
        statusBadge.style.color = barColor;
        statusBadge.style.borderColor = barColor + "44";
        statusBadge.style.background = barColor + "11";

        // Relationship tags
        const relTags = getRelationshipTags(species, rel);
        const tagsRow = document.createElement("div");
        tagsRow.className = "related-species-tags";
        relTags.forEach(({ icon, label }) => {
          const tag = document.createElement("span");
          tag.className = "related-species-tag";
          tag.textContent = icon + "\u00a0" + label;
          tagsRow.appendChild(tag);
        });

        cardBody.appendChild(name);
        cardBody.appendChild(statusBadge);
        if (relTags.length) cardBody.appendChild(tagsRow);
        card.appendChild(thumb);
        card.appendChild(cardBody);
        row.appendChild(card);
      });

      body.appendChild(row);
      panel.appendChild(box);
    }
  }

  renderCredits(panel, species);
}

function renderCredits(panel, species) {
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

  if (species && species.lastUpdated) {
    const date = new Date(species.lastUpdated + "T00:00:00");
    const formatted = date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const updated = document.createElement("div");
    updated.className = "tab-credits-updated";
    updated.textContent = "Data last updated: " + formatted;
    credits.appendChild(updated);
  }

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

  // ── 🔬 Taxonomy / Classification section box ─────────────────
  if (species.taxonomy) {
    const tx = species.taxonomy;
    const RANKS = [
      { label: "Kingdom", key: "kingdom" },
      { label: "Phylum",  key: "phylum"  },
      { label: "Class",   key: "class"   },
      { label: "Order",   key: "order"   },
      { label: "Family",  key: "family"  },
      { label: "Genus",   key: "genus"   },
      { label: "Species", key: "species" },
    ];
    const taxBox = createSectionBox("🔬", "Classification");
    const txList = document.createElement("div");
    txList.className = "tab-vital-list";
    RANKS.forEach(({ label, key }) => {
      if (!tx[key]) return;
      const row = document.createElement("div");
      row.className = "tab-vital-row";
      const lbl = document.createElement("span");
      lbl.className = "tab-vital-label";
      lbl.textContent = label;
      const val = document.createElement("span");
      val.className = "tab-vital-value";
      const isItalic = key === "genus" || key === "species";
      if (isItalic) {
        const em = document.createElement("em");
        em.textContent = tx[key];
        val.appendChild(em);
      } else {
        val.textContent = tx[key];
      }
      row.appendChild(lbl);
      row.appendChild(val);
      txList.appendChild(row);
    });
    taxBox.querySelector(".section-box-body").appendChild(txList);
    panel.appendChild(taxBox);
  }

  renderCredits(panel);
}

function renderPopulationChart(container, data, statusHistory) {
  const PAD = { top: 14, right: 16, bottom: 46, left: 62 };
  const W = 480, H = 174;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const values = data.map((d) => d.value);
  const minVal = 0;
  const maxVal = Math.max(...values);
  const valRange = maxVal - minVal || 1;

  const scale     = maxVal >= 1_000_000 ? 1_000_000 : maxVal >= 1_000 ? 1_000 : 1;
  const scaleUnit = scale === 1_000_000 ? " (M)" : scale === 1_000 ? " (K)" : "";

  const xOf = (i) => PAD.left + (i / (data.length - 1)) * innerW;
  const yOf = (v) => PAD.top + innerH - ((v - minVal) / valRange) * innerH;

  // Precompute % change from previous data point
  const changes = data.map((d, i) =>
    i === 0 ? null : (d.value - data[i - 1].value) / data[i - 1].value * 100
  );

  const svgNS = "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("class", "health-chart-svg");

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
    gridLabel.setAttribute("class", "health-chart-value");
    gridLabel.textContent = "~" + (Math.round(minVal + t * valRange) / scale).toLocaleString();
    svg.appendChild(gridLabel);
  });

  // Y-axis label
  const yAxisLabel = document.createElementNS(svgNS, "text");
  yAxisLabel.setAttribute("transform", `translate(10, ${PAD.top + innerH / 2}) rotate(-90)`);
  yAxisLabel.setAttribute("text-anchor", "middle");
  yAxisLabel.setAttribute("font-size", "8");
  yAxisLabel.setAttribute("class", "health-chart-axis-label");
  yAxisLabel.textContent = "Individuals" + scaleUnit;
  svg.appendChild(yAxisLabel);

  // Vertical rule lines per data point — rendered below area fill so dots stay on top
  const rules = data.map((d, i) => {
    const rule = document.createElementNS(svgNS, "line");
    const cx = xOf(i), cy = yOf(d.value);
    rule.setAttribute("x1", cx);
    rule.setAttribute("x2", cx);
    rule.setAttribute("y1", cy);
    rule.setAttribute("y2", PAD.top + innerH);
    rule.setAttribute("stroke", "var(--color-primary)");
    rule.setAttribute("stroke-width", "1");
    rule.setAttribute("stroke-dasharray", "3,3");
    rule.setAttribute("class", "chart-rule");
    rule.style.opacity = "0";
    svg.appendChild(rule);
    return rule;
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

  // Precompute total polyline length; stored as data attr so animateHealthChart() can read it
  // from both fresh renders and cache-restored innerHTML.
  const pts = data.map((d, i) => ({ x: xOf(i), y: yOf(d.value) }));
  const lineLength = pts.slice(1).reduce((sum, pt, i) => {
    const dx = pt.x - pts[i].x, dy = pt.y - pts[i].y;
    return sum + Math.sqrt(dx * dx + dy * dy);
  }, 0);
  svg.dataset.chartLineLength = lineLength;

  // Initial invisible state — animation triggered externally by animateHealthChart()
  polyline.style.strokeDasharray = lineLength;
  polyline.style.strokeDashoffset = lineLength;
  area.style.opacity = "0";

  // Tooltip (created before the data loop so closures can reference it)
  container.appendChild(svg);
  const tooltip = document.createElement("div");
  tooltip.className = "chart-data-tooltip";
  const ttYear = document.createElement("div");
  ttYear.className = "chart-data-tooltip-value";
  const ttValue = document.createElement("div");
  ttValue.className = "chart-data-tooltip-year";
  const ttChange = document.createElement("div");
  ttChange.className = "chart-data-tooltip-change";
  tooltip.appendChild(ttValue);
  tooltip.appendChild(ttYear);
  tooltip.appendChild(ttChange);
  container.appendChild(tooltip);

  // Dots, year labels, and interactive hit targets
  const dots = [];
  data.forEach((d, i) => {
    const cx = xOf(i), cy = yOf(d.value);

    const statusAtYear = getStatusAtYear(statusHistory, d.year);
    const dotColor = statusAtYear ? getStatusColor(statusAtYear) : null;

    const dot = document.createElementNS(svgNS, "circle");
    dot.setAttribute("cx", cx);
    dot.setAttribute("cy", cy);
    dot.setAttribute("r", "3.5");
    dot.setAttribute("fill", dotColor || "var(--color-primary)");
    dot.setAttribute("class", "chart-dot");
    dot.style.opacity = "0";
    svg.appendChild(dot);
    dots.push(dot);

    const yearLabel = document.createElementNS(svgNS, "text");
    yearLabel.setAttribute("x", cx);
    yearLabel.setAttribute("y", PAD.top + innerH + 24);
    yearLabel.setAttribute("text-anchor", "middle");
    yearLabel.setAttribute("font-size", "9");
    yearLabel.setAttribute("class", "health-chart-year");
    yearLabel.textContent = d.year;
    svg.appendChild(yearLabel);

    // Larger transparent hit target for easier hover/tap
    const hit = document.createElementNS(svgNS, "circle");
    hit.setAttribute("cx", cx);
    hit.setAttribute("cy", cy);
    hit.setAttribute("r", "12");
    hit.setAttribute("fill", "transparent");
    svg.appendChild(hit);

    const show = () => {
      // Set content first so offsetWidth reflects the rendered size
      ttYear.textContent = d.year;
      ttValue.textContent = d.value.toLocaleString();
      const change = changes[i];
      if (change !== null) {
        ttChange.textContent = (change >= 0 ? "▲" : "▼") + " " + Math.abs(Math.round(change)) + "%";
        ttChange.dataset.dir = change >= 0 ? "up" : "down";
        ttChange.style.display = "";
      } else {
        ttChange.style.display = "none";
      }

      // Position with edge clamping so the card never clips outside the container
      const svgRect = svg.getBoundingClientRect();
      const wrapRect = container.getBoundingClientRect();
      const dotX = svgRect.left - wrapRect.left + cx * (svgRect.width / W);
      const dotY = svgRect.top - wrapRect.top + cy * (svgRect.height / H);
      const halfW = tooltip.offsetWidth / 2;
      const clampedCenter = Math.max(halfW, Math.min(dotX, wrapRect.width - halfW));
      tooltip.style.left = clampedCenter + "px";
      tooltip.style.top = dotY + "px";
      // Keep caret pointing at the actual dot even when the box has shifted
      tooltip.style.setProperty("--caret-x", (halfW + dotX - clampedCenter) + "px");

      tooltip.classList.add("visible");
      dot.classList.add("active");
      rules[i].style.opacity = "0.45";
    };

    const hide = () => {
      tooltip.classList.remove("visible");
      dot.classList.remove("active");
      rules[i].style.opacity = "0";
    };

    hit.addEventListener("mouseenter", show);
    hit.addEventListener("mouseleave", hide);
    hit.addEventListener("touchstart", (e) => { e.preventDefault(); show(); }, { passive: false });
    hit.addEventListener("touchend", () => { setTimeout(hide, 1500); });
  });

  // X-axis label
  const xAxisLabel = document.createElementNS(svgNS, "text");
  xAxisLabel.setAttribute("x", PAD.left + innerW / 2);
  xAxisLabel.setAttribute("y", PAD.top + innerH + 38);
  xAxisLabel.setAttribute("text-anchor", "middle");
  xAxisLabel.setAttribute("font-size", "8");
  xAxisLabel.setAttribute("class", "health-chart-axis-label");
  xAxisLabel.textContent = "Year";
  svg.appendChild(xAxisLabel);

  // Status history legend — only if multiple distinct statuses appear in the data range
  if (Array.isArray(statusHistory) && statusHistory.length) {
    const dataYears = data.map((d) => d.year);
    const minYear = Math.min(...dataYears);
    const maxYear = Math.max(...dataYears);
    const sorted = [...statusHistory].sort((a, b) => a.year - b.year);

    const entries = sorted
      .map((entry, idx) => ({
        status: entry.status,
        fromYear: entry.year,
        toYear: idx < sorted.length - 1 ? sorted[idx + 1].year : null,
      }))
      .filter((e) => e.fromYear <= maxYear && (e.toYear === null || e.toYear > minYear));

    const uniqueStatuses = new Set(entries.map((e) => e.status));
    if (uniqueStatuses.size > 1) {
      const legend = document.createElement("div");
      legend.className = "chart-status-legend";
      entries.forEach((e) => {
        const color = getStatusColor(e.status) || "var(--color-primary)";
        const yearRange = e.toYear ? `${e.fromYear}–${e.toYear}` : `${e.fromYear}–present`;
        const item = document.createElement("span");
        item.className = "chart-status-legend-item";
        item.innerHTML =
          `<span class="chart-status-dot" style="background:${color}"></span>` +
          `${e.status} <span class="chart-status-year">(${yearRange})</span>`;
        legend.appendChild(item);
      });
      container.appendChild(legend);
    }
  }
}

// Animates the population health bar in the overview tab.
// Called whenever the overview panel becomes visible (initial open or cache restore).
// Works on both freshly rendered and cache-restored DOMs via dataset.targetPct.
function animateOverviewBar() {
  const fill = document.querySelector("#tab-panel-overview .overview-status-fill");
  if (!fill) return;
  const target = +(fill.dataset.targetPct ?? 0);
  const pct = document.querySelector("#tab-panel-overview .overview-status-pct");
  fill.style.width = "0%";
  setTimeout(() => {
    const duration = 800;
    const start = performance.now();
    (function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      fill.style.width = (eased * target) + "%";
      if (pct) pct.textContent = "Population health: " + Math.round(eased * target) + "%";
      if (progress < 1) requestAnimationFrame(tick);
    })(performance.now());
  }, 280);
}

// Animates the population trend chart in the health tab.
// Called whenever the health panel becomes visible (tab click or initial open).
// Works on both freshly rendered and cache-restored DOMs because the initial
// invisible state is always stored in inline styles / data attributes.
function animateHealthChart() {
  const svg = document.querySelector("#tab-panel-health .health-chart-svg");
  if (!svg) return;
  const polyline = svg.querySelector("polyline");
  const area = svg.querySelector("polygon");
  const dots = [...svg.querySelectorAll(".chart-dot")];
  const lineLength = parseFloat(svg.dataset.chartLineLength) || 0;

  // Reset to initial invisible state (handles re-entry and cache restores)
  polyline.style.transition = "none";
  polyline.style.strokeDasharray = lineLength;
  polyline.style.strokeDashoffset = lineLength;
  area.style.transition = "none";
  area.style.opacity = "0";
  dots.forEach((dot) => { dot.style.transition = "none"; dot.style.opacity = "0"; });

  const DRAW_MS = 750;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    polyline.style.transition = `stroke-dashoffset ${DRAW_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    polyline.style.strokeDashoffset = "0";
    area.style.transition = `opacity ${Math.round(DRAW_MS * 0.8)}ms ease-out 80ms`;
    area.style.opacity = "1";
    dots.forEach((dot, i) => {
      const delay = Math.round((i / Math.max(dots.length - 1, 1)) * (DRAW_MS - 80));
      dot.style.transition = `opacity 0.18s ease ${delay}ms, transform 0.15s ease`;
      dot.style.opacity = "1";
    });
    // Remove inline transition after animation so CSS hover (transform) takes over cleanly
    setTimeout(() => {
      dots.forEach((dot) => { dot.style.transition = ""; dot.style.opacity = ""; });
    }, DRAW_MS + 250);
  }));
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

// STATUS_ORDER indices 0–6 are ranked (worse → better); 7–8 are unranked (DD, NE)
const STATUS_RANK_LIMIT = 7;

function getStatusRank(statusLabel) {
  const idx = STATUS_ORDER.findIndex((s) => s.label === statusLabel);
  return idx < STATUS_RANK_LIMIT ? idx : null; // null = unranked
}

function renderStatusHistory(container, statusHistory) {
  if (!Array.isArray(statusHistory) || statusHistory.length < 1) return;

  const sorted = [...statusHistory].sort((a, b) => a.year - b.year);
  const timeline = document.createElement("div");
  timeline.className = "status-timeline";

  sorted.forEach((entry, i) => {
    const isLast = i === sorted.length - 1;
    const statusMeta = STATUS_ORDER.find((s) => s.label === entry.status);
    const color = statusMeta ? statusMeta.color : "var(--color-text-muted)";
    const bg    = statusMeta ? statusMeta.bg    : "rgba(0,0,0,0.07)";

    // ── Entry row ──────────────────────────────────────────────
    const row = document.createElement("div");
    row.className = "timeline-entry";

    const rail = document.createElement("div");
    rail.className = "timeline-rail";

    const topLine = document.createElement("div");
    topLine.className = "timeline-rail-line" + (i === 0 ? " timeline-rail-line--hidden" : "");

    const node = document.createElement("div");
    node.className = "timeline-node";
    node.style.color = color;

    const botLine = document.createElement("div");
    botLine.className = "timeline-rail-line" + (isLast ? " timeline-rail-line--hidden" : "");

    rail.appendChild(topLine);
    rail.appendChild(node);
    rail.appendChild(botLine);

    const content = document.createElement("div");
    content.className = "timeline-content";

    const yearEl = document.createElement("div");
    yearEl.className = "timeline-year";
    yearEl.textContent = isLast ? `${entry.year} · current` : String(entry.year);

    const badge = document.createElement("span");
    badge.className = "timeline-badge";
    badge.style.color = color;
    badge.style.background = bg;
    badge.style.borderColor = color + "55";
    badge.textContent = entry.status;

    content.appendChild(yearEl);
    content.appendChild(badge);
    row.appendChild(rail);
    row.appendChild(content);
    timeline.appendChild(row);

    // ── Connector to next entry ─────────────────────────────────
    if (!isLast) {
      const next = sorted[i + 1];
      const currRank = getStatusRank(entry.status);
      const nextRank = getStatusRank(next.status);

      let direction, arrow, labelText;
      if (currRank === null || nextRank === null) {
        direction = "neutral";
        arrow = "→";
        labelText = currRank === null ? "First formal assessment" : "Reassessed";
      } else if (nextRank < currRank) {
        // lower index = more threatened = declined
        const steps = currRank - nextRank;
        direction = "decline";
        arrow = "↓";
        labelText = steps === 1 ? "Status declined" : `Status declined — ${steps} categories`;
      } else if (nextRank > currRank) {
        const steps = nextRank - currRank;
        direction = "improve";
        arrow = "↑";
        labelText = steps === 1 ? "Status improved" : `Status improved — ${steps} categories`;
      } else {
        direction = "neutral";
        arrow = "→";
        labelText = "Status unchanged";
      }

      const connector = document.createElement("div");
      connector.className = `timeline-connector timeline-connector--${direction}`;

      const connRail = document.createElement("div");
      connRail.className = "timeline-connector-rail";

      const lineTop = document.createElement("div");
      lineTop.className = "timeline-connector-line";
      const icon = document.createElement("div");
      icon.className = "timeline-connector-icon";
      icon.textContent = arrow;
      const lineBot = document.createElement("div");
      lineBot.className = "timeline-connector-line";

      connRail.appendChild(lineTop);
      connRail.appendChild(icon);
      connRail.appendChild(lineBot);

      const label = document.createElement("span");
      label.className = "timeline-connector-label";
      label.textContent = labelText;

      connector.appendChild(connRail);
      connector.appendChild(label);
      timeline.appendChild(connector);
    }
  });

  container.appendChild(timeline);
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
    renderPopulationChart(chartWrap, species.populationTrend, species.statusHistory);
    chartBody.appendChild(chartWrap);

    const meta = species.populationTrendMeta;
    if (meta) {
      const footer = document.createElement("div");
      footer.className = "chart-confidence-footer";

      const badge = document.createElement("span");
      badge.className = "chart-confidence-badge chart-confidence-badge--" + meta.confidence;
      badge.textContent = meta.confidence === "rough" ? "Rough estimate" : "Estimated";

      const noteEl = document.createElement("span");
      noteEl.className = "chart-confidence-note";
      noteEl.textContent = meta.note;

      footer.appendChild(badge);
      footer.appendChild(noteEl);
      chartBody.appendChild(footer);
    }

    panel.appendChild(box);
  }

  // ── Conservation History Timeline ──────────────────────────────
  if (Array.isArray(species.statusHistory) && species.statusHistory.length) {
    const histBox = createSectionBox("📋", "Conservation History");
    renderStatusHistory(histBox.querySelector(".section-box-body"), species.statusHistory);
    panel.appendChild(histBox);
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

function renderThreats(items, q) {
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
      applyHighlight(nameEl, name, q);

      const desc = document.createElement("div");
      desc.className = "tab-threat-desc";
      applyHighlight(desc, description, q);

      card.appendChild(nameEl);
      card.appendChild(desc);
      cards.appendChild(card);
    });

    groupEl.appendChild(cards);
    panel.appendChild(groupEl);
  });

  renderCredits(panel);
}

function renderActionItems(items, q) {
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
    applyHighlight(titleEl, title, q);

    const descEl = document.createElement("div");
    descEl.className = "tab-action-desc";
    applyHighlight(descEl, description, q);

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

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

let focusedCardIndex = -1;
let activeStatusFilters  = new Set();
let activeHabitatFilters = new Set();
let activeDietFilters    = new Set();
let activeRegionFilters  = new Set();
let activeTagFilters     = new Set();
let activePhotoFilters   = new Set();
let activeDataFilters    = new Set();
let sortMode = "default";
let wikiViewMode = localStorage.getItem("wiki-view-mode") || "grid";
let showFavoritesOnly = false;
let manageFavoritesMode = false;
let manageFavoritesSelected = new Set();
let compareMode = false;
let compareSelected = new Set();
let returnToCompare = false;
let filterPanelOpen = false;
let timelineMode = false;

const PAGE_SIZE = 24;
let _renderQueue = [];
let _renderOffset = 0;
let _renderMeta = { q: "", favIds: [] };

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

function createSpeciesCard(species, q, favIds) {
  const isFav = favIds.includes(species.id);

  const card = document.createElement("div");
  card.className = "species-card" + (manageFavoritesMode ? " manage-mode" : compareMode ? " compare-mode" : "");
  if (manageFavoritesMode && manageFavoritesSelected.has(species.id)) card.classList.add("manage-selected");
  if (compareMode && compareSelected.has(species.id)) card.classList.add("compare-selected");
  card.dataset.speciesId = species.id;
  card.tabIndex = 0;
  const tabMatch = q && !matchesPrimary(species, q) ? matchesTabContent(species, q) : null;
  card.addEventListener("click", () => {
    if (manageFavoritesMode) {
      const isSelected = manageFavoritesSelected.has(species.id);
      if (isSelected) {
        manageFavoritesSelected.delete(species.id);
        card.classList.remove("manage-selected");
        starBtn.textContent = "\u2610";
        starBtn.classList.remove("selected");
        starBtn.setAttribute("aria-label", `Select ${species.commonName}`);
      } else {
        manageFavoritesSelected.add(species.id);
        card.classList.add("manage-selected");
        starBtn.textContent = "\u2713";
        starBtn.classList.add("selected");
        starBtn.setAttribute("aria-label", `Deselect ${species.commonName}`);
      }
      updateManageToolbar();
    } else if (compareMode) {
      const isSelected = compareSelected.has(species.id);
      if (isSelected) {
        compareSelected.delete(species.id);
        card.classList.remove("compare-selected");
        starBtn.textContent = "\u2295";
        starBtn.classList.remove("selected");
        starBtn.setAttribute("aria-label", `Add ${species.commonName} to comparison`);
      } else if (compareSelected.size >= 3) {
        card.classList.add("compare-shake");
        setTimeout(() => card.classList.remove("compare-shake"), 400);
        return;
      } else {
        compareSelected.add(species.id);
        card.classList.add("compare-selected");
        starBtn.textContent = "\u2713";
        starBtn.classList.add("selected");
        starBtn.setAttribute("aria-label", `Remove ${species.commonName} from comparison`);
      }
      updateCompareToolbar();
    } else {
      openSpeciesModal(species, card, tabMatch || "overview");
    }
  });

  // Image area
  const imgArea = document.createElement("div");
  imgArea.className = "species-card-image";
  const cardPhoto = species.photos && species.photos[0];
  if (cardPhoto) {
    imgArea.dataset.lazySrc = cardPhoto;
    if (species.lqip) {
      // Render LQIP immediately — it's a tiny data URL, no network wait.
      // Silhouette stays as the bottom layer: visible during the LQIP fade-in
      // and as a fallback on slow/failed connections.
      if (SILHOUETTE_FALLBACK) applySilhouetteBg(imgArea);
      imgArea.dataset.lazyLqip = species.lqip;
      const lqipLayer = document.createElement("div");
      lqipLayer.className = "card-img-lqip";
      lqipLayer.style.backgroundImage = `url(${species.lqip})`;
      imgArea.appendChild(lqipLayer);
      const fullLayer = document.createElement("div");
      fullLayer.className = "card-img-full";
      imgArea.appendChild(fullLayer);
    } else if (SILHOUETTE_FALLBACK) {
      applySilhouetteBg(imgArea);
    } else {
      imgArea.textContent = species.emoji || wikiProjectEmoji;
      imgArea.style.background = "linear-gradient(135deg, #0a0a0a, var(--color-primary))";
    }
  } else if (SILHOUETTE_FALLBACK) {
    applySilhouetteBg(imgArea);
  } else {
    imgArea.textContent = species.emoji || wikiProjectEmoji;
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

  // Incomplete data icon (image overlay)
  if (isSpeciesIncomplete(species)) {
    const incompleteIcon = document.createElement("div");
    incompleteIcon.className = "card-incomplete-icon";
    incompleteIcon.title = "Incomplete data";
    incompleteIcon.setAttribute("aria-label", "Incomplete data");
    incompleteIcon.textContent = "⚠";
    imgArea.appendChild(incompleteIcon);
  }

  // "New" badge — shown for 30 days after addedDate
  if (species.addedDate) {
    const added = new Date(species.addedDate + "T00:00:00");
    const msPerDay = 86400000;
    if ((Date.now() - added.getTime()) / msPerDay <= 30) {
      const newBadge = document.createElement("div");
      newBadge.className = "card-new-badge";
      newBadge.textContent = "NEW";
      imgArea.appendChild(newBadge);
    }
  }

  // Favorite star button (or manage-mode selection indicator)
  const starBtn = document.createElement("button");
  if (manageFavoritesMode) {
    const isSelected = manageFavoritesSelected.has(species.id);
    starBtn.className = "species-card-star card-manage-check" + (isSelected ? " selected" : "");
    starBtn.textContent = isSelected ? "\u2713" : "\u2610";
    starBtn.setAttribute("aria-label", isSelected ? `Deselect ${species.commonName}` : `Select ${species.commonName}`);
  } else if (compareMode) {
    const isSelected = compareSelected.has(species.id);
    starBtn.className = "species-card-star card-compare-check" + (isSelected ? " selected" : "");
    starBtn.textContent = isSelected ? "\u2713" : "\u2295";
    starBtn.setAttribute("aria-label", isSelected ? `Remove ${species.commonName} from comparison` : `Add ${species.commonName} to comparison`);
  } else {
    starBtn.className = "species-card-star" + (isFav ? " favorited" : "");
    starBtn.textContent = isFav ? "★" : "☆";
    starBtn.setAttribute(
      "aria-label",
      isFav ? `Unfavorite ${species.commonName}` : `Favorite ${species.commonName}`
    );
  }
  // Unified click handler — checks mode at runtime so DOM-manipulated cards work correctly
  starBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (manageFavoritesMode || compareMode) {
      card.click();
    } else {
      const ids = loadFavorites();
      const idx = ids.indexOf(species.id);
      if (idx === -1) ids.push(species.id);
      else ids.splice(idx, 1);
      saveFavorites(ids);
      renderWikiGrid(wikiSearch.value);
    }
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
        data-target-pct="${species.lifePercent}"
        transform="rotate(-90,26,26)"/>
      <text class="ring-pct-txt" x="26" y="26">0%</text>
    </svg>
    <div class="card-ring-meta">
      <div class="card-ring-status"></div>
      <div class="card-ring-sub">Population health</div>
    </div>`;
  applyHighlight(ringWrap.querySelector(".card-ring-status"), species.statusLabel, q);

  body.appendChild(name);
  body.appendChild(sci);
  body.appendChild(badgeRow);
  if (threatBadge) body.appendChild(threatBadge);
  if (species.description) {
    const desc = document.createElement("div");
    desc.className = "card-desc";
    desc.textContent = species.description;
    body.appendChild(desc);
  }
  if (tabMatch) {
    const tabLabel = tabMatch === "threats" ? "Threats" : tabMatch === "actions" ? "Actions" : "Description";
    const matchBadge = document.createElement("div");
    matchBadge.className = "card-tab-match-badge";
    matchBadge.textContent = `Match in ${tabLabel}`;
    body.appendChild(matchBadge);
  }
  body.appendChild(ringWrap);
  card.appendChild(imgArea);
  card.appendChild(body);
  return card;
}

function createListHeader() {
  const hdr = document.createElement("div");
  hdr.className = "list-header-row";
  [
    { label: "",                   cls: "list-col-lbl--star" },
    { label: "Species",            cls: "list-col-lbl--species" },
    { label: "Habitat \u00b7 Diet",cls: "list-col-lbl--habdiet" },
    { label: "Key Stats",          cls: "list-col-lbl--stats" },
    { label: "Population Health",  cls: "list-col-lbl--health" },
    { label: "",                   cls: "list-col-lbl--chevron" },
  ].forEach(({ label, cls }) => {
    const col = document.createElement("span");
    col.className = `list-col-lbl ${cls}`;
    col.textContent = label;
    hdr.appendChild(col);
  });
  return hdr;
}

const THREAT_DOT_COLOR = { critical: "#dc2626", high: "#e67e22", medium: "#f59e0b", low: "#16a34a" };

function createListExtra(species) {
  const extra = document.createElement("div");
  extra.className = "list-extra";

  // Overview
  if (species.description) {
    const g = document.createElement("div");
    g.className = "list-extra-group list-extra-group--overview";
    const lbl = document.createElement("div");
    lbl.className = "list-extra-label";
    lbl.textContent = "Overview";
    const val = document.createElement("div");
    val.className = "list-extra-overview";
    val.textContent = species.description;
    g.appendChild(lbl);
    g.appendChild(val);
    extra.appendChild(g);
  }

  // Primary Threats
  if (species.threats && species.threats.length > 0) {
    const g = document.createElement("div");
    g.className = "list-extra-group";
    const lbl = document.createElement("div");
    lbl.className = "list-extra-label";
    lbl.textContent = "Primary Threats";
    const list = document.createElement("div");
    list.className = "list-extra-threats";
    species.threats.slice(0, 3).forEach((t) => {
      const item = document.createElement("div");
      item.className = "list-extra-threat-item";
      const dot = document.createElement("span");
      dot.className = "list-extra-threat-dot";
      dot.style.background = THREAT_DOT_COLOR[t.severity] || THREAT_DOT_COLOR.medium;
      const name = document.createTextNode(t.name);
      item.appendChild(dot);
      item.appendChild(name);
      list.appendChild(item);
    });
    g.appendChild(lbl);
    g.appendChild(list);
    extra.appendChild(g);
  }

  // Regions
  if (species.geographicRegions && species.geographicRegions.length > 0) {
    const g = document.createElement("div");
    g.className = "list-extra-group";
    const lbl = document.createElement("div");
    lbl.className = "list-extra-label";
    lbl.textContent = "Regions";
    const tags = document.createElement("div");
    tags.className = "list-extra-tags";
    species.geographicRegions.forEach((r) => {
      const tag = document.createElement("span");
      tag.className = "list-extra-tag";
      tag.textContent = r.charAt(0).toUpperCase() + r.slice(1);
      tags.appendChild(tag);
    });
    g.appendChild(lbl);
    g.appendChild(tags);
    extra.appendChild(g);
  }

  // Tags
  if (species.tags && species.tags.length > 0) {
    const g = document.createElement("div");
    g.className = "list-extra-group";
    const lbl = document.createElement("div");
    lbl.className = "list-extra-label";
    lbl.textContent = "Tags";
    const tags = document.createElement("div");
    tags.className = "list-extra-tags";
    species.tags.forEach((t) => {
      const tag = document.createElement("span");
      tag.className = "list-extra-tag";
      tag.textContent = t.charAt(0).toUpperCase() + t.slice(1);
      tags.appendChild(tag);
    });
    g.appendChild(lbl);
    g.appendChild(tags);
    extra.appendChild(g);
  }

  return extra;
}

function createListRow(species, q, favIds) {
  const isFav = favIds.includes(species.id);
  const tabMatch = q && !matchesPrimary(species, q) ? matchesTabContent(species, q) : null;

  const row = document.createElement("div");
  row.className = "list-row" + (manageFavoritesMode ? " manage-mode" : "");
  if (manageFavoritesMode && manageFavoritesSelected.has(species.id)) row.classList.add("manage-selected");
  row.dataset.speciesId = species.id;
  row.tabIndex = 0;

  // Star / manage-select button
  const starBtn = document.createElement("button");
  if (manageFavoritesMode) {
    const isSelected = manageFavoritesSelected.has(species.id);
    starBtn.className = "list-star" + (isSelected ? " selected" : "");
    starBtn.textContent = isSelected ? "\u2713" : "\u2610";
    starBtn.setAttribute("aria-label", isSelected ? `Deselect ${species.commonName}` : `Select ${species.commonName}`);
    starBtn.addEventListener("click", (e) => { e.stopPropagation(); row.click(); });
  } else {
    starBtn.className = "list-star" + (isFav ? " favorited" : "");
    starBtn.textContent = isFav ? "\u2605" : "\u2606";
    starBtn.setAttribute("aria-label", isFav ? `Unfavorite ${species.commonName}` : `Favorite ${species.commonName}`);
    starBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const ids = loadFavorites();
      const idx = ids.indexOf(species.id);
      if (idx === -1) ids.push(species.id);
      else ids.splice(idx, 1);
      saveFavorites(ids);
      renderWikiGrid(wikiSearch.value);
    });
  }

  // Row click — expand/collapse inline detail
  row.addEventListener("click", () => {
    if (manageFavoritesMode) {
      const isSelected = manageFavoritesSelected.has(species.id);
      if (isSelected) {
        manageFavoritesSelected.delete(species.id);
        row.classList.remove("manage-selected");
        starBtn.textContent = "\u2610";
        starBtn.classList.remove("selected");
        starBtn.setAttribute("aria-label", `Select ${species.commonName}`);
      } else {
        manageFavoritesSelected.add(species.id);
        row.classList.add("manage-selected");
        starBtn.textContent = "\u2713";
        starBtn.classList.add("selected");
        starBtn.setAttribute("aria-label", `Deselect ${species.commonName}`);
      }
      updateManageToolbar();
    } else {
      const isExpanded = row.classList.contains("list-row--expanded");
      if (isExpanded) {
        row.classList.remove("list-row--expanded");
        const extra = row.querySelector(".list-extra");
        if (extra) extra.remove();
      } else {
        row.classList.add("list-row--expanded");
        row.appendChild(createListExtra(species));
      }
    }
  });

  // Names
  const names = document.createElement("div");
  names.className = "list-names";
  const common = document.createElement("div");
  common.className = "list-common";
  applyHighlight(common, species.commonName, q);
  const sci = document.createElement("div");
  sci.className = "list-sci";
  applyHighlight(sci, species.scientificName, q);
  names.appendChild(common);
  names.appendChild(sci);

  // Middle: badges + description snippet
  const middle = document.createElement("div");
  middle.className = "list-middle";

  const badges = document.createElement("div");
  badges.className = "list-badges";
  (species.habitatTypes || []).forEach((type) => {
    const info = HABITAT_BADGE[type];
    if (!info) return;
    const b = document.createElement("span");
    b.className = `card-badge card-badge--habitat card-badge--${type}`;
    b.textContent = `${info.icon} ${info.label}`;
    badges.appendChild(b);
  });
  if (species.dietType) {
    const info = DIET_BADGE[species.dietType];
    if (info) {
      const b = document.createElement("span");
      b.className = `card-badge card-badge--diet card-badge--${species.dietType}`;
      b.textContent = `${info.icon} ${info.label}`;
      badges.appendChild(b);
    }
  }
  const maxSeverity = getMaxSeverityLabel(species);
  if (maxSeverity) {
    const b = document.createElement("span");
    b.className = `card-threat-badge tab-severity-badge tab-severity-badge--${maxSeverity}`;
    b.textContent = maxSeverity.charAt(0).toUpperCase() + maxSeverity.slice(1);
    badges.appendChild(b);
  }
  middle.appendChild(badges);

  // Key stats pills (glance vitalSigns)
  const allVitals = Array.isArray(species.vitalSigns) ? species.vitalSigns : [];
  const glanceVitals = allVitals.filter((v) => v.glance).slice(0, 3);
  const statItems = glanceVitals.length ? glanceVitals : allVitals.slice(0, 3);
  const stats = document.createElement("div");
  stats.className = "list-stats";
  statItems.forEach((v) => {
    const pill = document.createElement("span");
    pill.className = "list-stat";
    const val = unitMode === "metric" && v.metric ? v.metric :
                unitMode === "imperial" && v.imperial ? v.imperial : v.value;
    pill.textContent = `${v.label}: ${val}`;
    stats.appendChild(pill);
  });

  // Health bar
  const health = document.createElement("div");
  health.className = "list-health";
  const healthRow = document.createElement("div");
  healthRow.className = "list-health-row";
  const bar = document.createElement("div");
  bar.className = "list-health-bar";
  const fill = document.createElement("div");
  fill.className = "list-health-fill";
  fill.style.background = getLifeBarColor(species.lifePercent);
  fill.dataset.targetPct = species.lifePercent;
  bar.appendChild(fill);
  const pct = document.createElement("div");
  pct.className = "list-health-pct";
  pct.textContent = "0%";
  healthRow.appendChild(bar);
  healthRow.appendChild(pct);
  const statusEl = document.createElement("div");
  statusEl.className = "list-health-status";
  applyHighlight(statusEl, species.statusLabel, q);
  health.appendChild(healthRow);
  health.appendChild(statusEl);

  // Chevron — opens the species card
  const chevron = document.createElement("button");
  chevron.className = "list-chevron";
  chevron.innerHTML = `<svg class="list-chevron-icon" viewBox="0 0 10 22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,4 7,11 3,18"/></svg>`;
  chevron.title = "Open species card";
  chevron.setAttribute("aria-label", `Open ${species.commonName} card`);
  chevron.addEventListener("click", (e) => {
    e.stopPropagation();
    openSpeciesModal(species, row, tabMatch || "overview");
  });

  row.appendChild(starBtn);
  row.appendChild(names);
  row.appendChild(middle);
  row.appendChild(stats);
  row.appendChild(health);
  row.appendChild(chevron);

  return row;
}

function editDistance(a, b) {
  const m = a.length, n = b.length;
  const dp = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = [i];
    for (let j = 1; j <= n; j++) dp[i][j] = i === 0 ? j : 0;
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}

// Returns true if every token in query fuzzy-matches against text.
// Short tokens (1-2 chars) require exact inclusion; longer tokens allow 1 edit.
function fuzzyMatchText(text, query) {
  const t = text.toLowerCase();
  if (t.includes(query)) return true;
  const queryTokens = query.split(/\s+/).filter(Boolean);
  const textTokens = t.split(/\s+/);
  return queryTokens.every((qt) => {
    if (t.includes(qt)) return true;
    if (qt.length <= 2) return false;
    return textTokens.some((tt) => editDistance(qt, tt) <= 1);
  });
}

function matchesPrimary(s, q) {
  return (
    fuzzyMatchText(s.commonName, q) ||
    fuzzyMatchText(s.scientificName, q) ||
    s.statusLabel.toLowerCase().includes(q)
  );
}

function matchesTabContent(s, q) {
  if (s.description && s.description.toLowerCase().includes(q)) return "overview";
  if (s.threats && s.threats.some((t) =>
    t.name.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q)
  )) return "threats";
  if (s.actionItems && s.actionItems.some((a) =>
    a.title.toLowerCase().includes(q) ||
    a.description.toLowerCase().includes(q)
  )) return "actions";
  return null;
}

function createSeverityHeader(severity, count) {
  const header = document.createElement("div");
  header.className = `wiki-severity-header wiki-severity-header--${severity || "none"}`;
  const label = document.createElement("span");
  label.className = "wiki-severity-header-label";
  label.textContent = `${(severity || "No Threats").toUpperCase()} (${count})`;
  const rule = document.createElement("span");
  rule.className = "wiki-severity-header-rule";
  header.appendChild(label);
  header.appendChild(rule);
  return header;
}

function buildRenderQueue(sorted) {
  const queue = [];
  if (wikiViewMode === "list") {
    queue.push({ type: "list-header" });
  }
  if (sortMode === "threat-desc") {
    const severityGroups = [
      { severity: "critical", score: 4 },
      { severity: "high",     score: 3 },
      { severity: "medium",   score: 2 },
      { severity: "low",      score: 1 },
      { severity: null,       score: 0 },
    ];
    severityGroups.forEach(({ severity, score }) => {
      const group = sorted.filter((s) => getThreatSeverityScore(s) === score);
      if (group.length === 0) return;
      queue.push({ type: "severity-header", severity, count: group.length });
      group.forEach((species) => queue.push({ type: "card", species }));
    });
  } else {
    sorted.forEach((species) => queue.push({ type: "card", species }));
  }
  return queue;
}

function renderNextPage() {
  const grid = document.getElementById("wiki-grid");
  const sentinel = document.getElementById("wiki-page-sentinel");
  if (!sentinel) return;
  const { q, favIds } = _renderMeta;
  const fragment = document.createDocumentFragment();
  const newCards = [];
  let cardsRendered = 0;
  while (_renderOffset < _renderQueue.length && cardsRendered < PAGE_SIZE) {
    const item = _renderQueue[_renderOffset++];
    let el;
    if (item.type === "list-header") {
      el = createListHeader();
    } else if (item.type === "severity-header") {
      el = createSeverityHeader(item.severity, item.count);
    } else {
      el = wikiViewMode === "list"
        ? createListRow(item.species, q, favIds)
        : createSpeciesCard(item.species, q, favIds);
      cardsRendered++;
      newCards.push(el);
    }
    fragment.appendChild(el);
  }
  grid.insertBefore(fragment, sentinel);
  newCards.forEach((el) => {
    if (window._wikiLifeObserver) window._wikiLifeObserver.observe(el);
    const imgArea = el.querySelector(".species-card-image[data-lazy-src]");
    if (imgArea && window._wikiImageObserver) window._wikiImageObserver.observe(imgArea);
  });
  if (_renderOffset >= _renderQueue.length) {
    sentinel.remove();
    if (window._wikiSentinelObserver) window._wikiSentinelObserver.disconnect();
  }
}

function renderWikiGrid(query) {
  const grid = document.getElementById("wiki-grid");
  const q = query ? query.trim().toLowerCase() : "";
  let filtered = q
    ? WIKI_DATA.items.filter(
        (s) => matchesPrimary(s, q) || matchesTabContent(s, q) !== null
      )
    : [...WIKI_DATA.items];

  const favIds = loadFavorites();

  if (activeStatusFilters.size > 0) {
    filtered = filtered.filter((s) => activeStatusFilters.has(s.statusLabel));
  }

  if (activeHabitatFilters.size > 0) {
    filtered = filtered.filter((s) =>
      (s.habitatTypes || []).some((h) => activeHabitatFilters.has(h))
    );
  }

  if (activeDietFilters.size > 0) {
    filtered = filtered.filter((s) => activeDietFilters.has(s.dietType));
  }

  if (activeRegionFilters.size > 0) {
    filtered = filtered.filter((s) =>
      (s.geographicRegions || []).some((r) => activeRegionFilters.has(r))
    );
  }

  if (activeTagFilters.size > 0) {
    filtered = filtered.filter((s) =>
      (s.tags || []).some((t) => activeTagFilters.has(t))
    );
  }

  if (activePhotoFilters.has("has-photos")) {
    filtered = filtered.filter((s) => s.photos && s.photos.length > 0);
  }

  if (activeDataFilters.size > 0) {
    filtered = filtered.filter((s) => activeDataFilters.has(getSpeciesTier(s)));
  }

  if (showFavoritesOnly || manageFavoritesMode) {
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
  renderGlanceBar(sorted);
  if (currentModalSpecies && !speciesModal.classList.contains("hidden")) {
    currentModalIndex = currentFilteredSorted.findIndex((s) => s.id === currentModalSpecies.id);
    updateModalNavState();
  }

  grid.innerHTML = "";
  grid.className = "wiki-grid" +
    (wikiViewMode === "masonry" ? " wiki-grid--masonry" :
     wikiViewMode === "list"    ? " wiki-grid--list"    : "");
  focusedCardIndex = -1;

  if (sorted.length === 0) {
    const hasActiveFilters = activeStatusFilters.size > 0 || activeHabitatFilters.size > 0 || activeDietFilters.size > 0 || activeRegionFilters.size > 0 || activeTagFilters.size > 0 || activePhotoFilters.size > 0 || showFavoritesOnly || q !== "";
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

  // Set up life animation observer (cards are observed as each page is appended)
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
      // Progress ring (grid / masonry cards)
      // Both strokeDashoffset and text are driven by the same rAF loop with
      // identical easing so they stay perfectly in sync — no CSS transition involved.
      const ring = entry.target.querySelector(".ring-fill");
      if (ring) setTimeout(() => {
        const targetOffset = +ring.dataset.targetOffset;
        const targetPct    = +ring.dataset.targetPct;
        const txt          = entry.target.querySelector(".ring-pct-txt");
        const duration     = 650;
        const start        = performance.now();
        (function tick(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased    = 1 - Math.pow(1 - progress, 3); // cubic ease-out
          ring.style.strokeDashoffset = RING_CIRCUMFERENCE + (targetOffset - RING_CIRCUMFERENCE) * eased;
          if (txt) txt.textContent = Math.round(eased * targetPct) + "%";
          if (progress < 1) requestAnimationFrame(tick);
        })(performance.now());
      }, 160 + i * 50);
      // Health bar (list rows) — same approach: one loop drives width + counter.
      const fill = entry.target.querySelector(".list-health-fill");
      if (fill) setTimeout(() => {
        const targetPct = +fill.dataset.targetPct;
        const pctEl     = entry.target.querySelector(".list-health-pct");
        const duration  = 650;
        const start     = performance.now();
        (function tick(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased    = 1 - Math.pow(1 - progress, 3); // cubic ease-out
          fill.style.width = (eased * targetPct) + "%";
          if (pctEl) pctEl.textContent = Math.round(eased * targetPct) + "%";
          if (progress < 1) requestAnimationFrame(tick);
        })(performance.now());
      }, 160 + i * 50);
      window._wikiLifeObserver.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  if (window._wikiImageObserver) window._wikiImageObserver.disconnect();
  window._wikiImageObserver = new IntersectionObserver((entries) => {
    entries.filter(e => e.isIntersecting).forEach(entry => {
      const el = entry.target;
      applyPhotoBg(el, el.dataset.lazySrc, el.dataset.lazyLqip || null);
      delete el.dataset.lazySrc;
      delete el.dataset.lazyLqip;
      window._wikiImageObserver.unobserve(el);
    });
  }, { rootMargin: "200px" });

  // Build render queue and paginate via sentinel
  if (window._wikiSentinelObserver) window._wikiSentinelObserver.disconnect();
  _renderMeta = { q, favIds };
  _renderQueue = buildRenderQueue(sorted);
  _renderOffset = 0;

  const sentinel = document.createElement("div");
  sentinel.id = "wiki-page-sentinel";
  grid.appendChild(sentinel);

  renderNextPage();

  const activeSentinel = document.getElementById("wiki-page-sentinel");
  if (activeSentinel) {
    window._wikiSentinelObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) renderNextPage();
    }, { rootMargin: "800px" });
    window._wikiSentinelObserver.observe(activeSentinel);
  }

  updateClearFiltersVisibility();
  updateFavoritesToggleText();
}

// ── Autocomplete ─────────────────────────────────────────────────────────────
const autocompleteList = document.getElementById("wiki-autocomplete");
let acActiveIndex = -1;

function highlightMatchInline(text, query) {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(`(${escaped})`, "gi"), "<mark class='search-highlight'>$1</mark>");
}

function renderAutocomplete(q) {
  const query = q.trim();
  acActiveIndex = -1;
  if (!query) {
    autocompleteList.hidden = true;
    autocompleteList.innerHTML = "";
    return;
  }
  const ql = query.toLowerCase();
  const suggestions = WIKI_DATA.items
    .filter((s) => fuzzyMatchText(s.commonName, ql) || fuzzyMatchText(s.scientificName, ql))
    .slice(0, 5);
  if (!suggestions.length) {
    autocompleteList.hidden = true;
    autocompleteList.innerHTML = "";
    return;
  }
  autocompleteList.innerHTML = suggestions
    .map((s) => {
      const sciMatches = fuzzyMatchText(s.scientificName, ql);
      const sciHint = sciMatches
        ? `<span class="search-ac-sci">(${highlightMatchInline(s.scientificName, query)})</span>`
        : "";
      return (
        `<li class="search-ac-item" role="option" data-id="${s.id}">` +
        `<span class="search-ac-common">${highlightMatchInline(s.commonName, query)}</span>` +
        sciHint +
        `</li>`
      );
    })
    .join("");
  autocompleteList.querySelectorAll(".search-ac-item").forEach((item) => {
    item.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const species = WIKI_DATA.items.find((s) => s.id === item.dataset.id);
      if (species) {
        wikiSearch.value = species.commonName;
        renderWikiGrid(species.commonName);
        autocompleteList.hidden = true;
        autocompleteList.innerHTML = "";
        acActiveIndex = -1;
        wikiSearch.focus();
      }
    });
  });
  autocompleteList.hidden = false;
}

const debouncedSearchRender = debounce(() => {
  renderWikiGrid(wikiSearch.value);
  syncUrlFromState();
}, 150);

wikiSearch.addEventListener("input", () => {
  renderAutocomplete(wikiSearch.value);
  debouncedSearchRender();
});

wikiSearch.addEventListener("keydown", (e) => {
  if (autocompleteList.hidden) return;
  const items = autocompleteList.querySelectorAll(".search-ac-item");
  if (!items.length) return;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    acActiveIndex = Math.min(acActiveIndex + 1, items.length - 1);
    items.forEach((item, i) => item.classList.toggle("search-ac-item--active", i === acActiveIndex));
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    acActiveIndex = Math.max(acActiveIndex - 1, 0);
    items.forEach((item, i) => item.classList.toggle("search-ac-item--active", i === acActiveIndex));
  } else if (e.key === "Enter" && acActiveIndex >= 0) {
    e.preventDefault();
    items[acActiveIndex].dispatchEvent(new MouseEvent("mousedown"));
  } else if (e.key === "Escape") {
    autocompleteList.hidden = true;
    autocompleteList.innerHTML = "";
    acActiveIndex = -1;
  }
});

wikiSearch.addEventListener("blur", () => {
  setTimeout(() => {
    autocompleteList.hidden = true;
    autocompleteList.innerHTML = "";
    acActiveIndex = -1;
  }, 150);
});

wikiSearch.addEventListener("focus", () => {
  if (wikiSearch.value.trim()) renderAutocomplete(wikiSearch.value);
});

document.getElementById("wiki-sort").addEventListener("change", (e) => {
  sortMode = e.target.value;
  renderWikiGrid(wikiSearch.value);
  syncUrlFromState();
});

// ── View mode toggle ─────────────────────────────────────────────

function setViewMode(mode) {
  wikiViewMode = mode;
  localStorage.setItem("wiki-view-mode", mode);
  document.querySelectorAll(".wiki-view-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === mode);
  });
  renderWikiGrid(wikiSearch.value);
}

["wiki-view-grid", "wiki-view-masonry", "wiki-view-list"].forEach((id) => {
  const btn = document.getElementById(id);
  if (!btn) return;
  const mode = id.replace("wiki-view-", "");
  btn.dataset.view = mode;
  btn.classList.toggle("active", mode === wikiViewMode);
  btn.addEventListener("click", () => setViewMode(mode));
});

document.getElementById("wiki-favorites-toggle").addEventListener("click", () => {
  showFavoritesOnly = !showFavoritesOnly;
  const btn = document.getElementById("wiki-favorites-toggle");
  btn.classList.toggle("active", showFavoritesOnly);
  btn.setAttribute("aria-pressed", String(showFavoritesOnly));
  updateFavoritesToggleText();
  renderWikiGrid(wikiSearch.value);
  syncUrlFromState();
});

// ── Manage Favorites mode ───────────────────────────────────────

function syncManageFavoritesUrl() {
  const url = new URL(window.location);
  if (manageFavoritesMode) {
    url.searchParams.set("manageFavs", "1");
    if (manageFavoritesSelected.size > 0) {
      url.searchParams.set("manageFavsSelected", [...manageFavoritesSelected].join(","));
    } else {
      url.searchParams.delete("manageFavsSelected");
    }
  } else {
    url.searchParams.delete("manageFavs");
    url.searchParams.delete("manageFavsSelected");
  }
  history.replaceState({}, "", url);
}

function updateManageToolbar() {
  const total = loadFavorites().length;
  const count = manageFavoritesSelected.size;
  document.getElementById("wiki-manage-count").textContent =
    count === 0 ? "None selected" : count === 1 ? "1 selected" : `${count} selected`;
  document.getElementById("wiki-manage-remove-btn").disabled = count === 0;
  document.getElementById("wiki-manage-select-all").textContent =
    count === total && total > 0 ? "Deselect all" : "Select all";
  syncManageFavoritesUrl();
}

function enterManageFavoritesMode(skipClear = false) {
  manageFavoritesMode = true;
  if (!skipClear) manageFavoritesSelected.clear();
  document.getElementById("wiki-manage-toolbar").classList.remove("hidden");
  updateManageToolbar();
  renderWikiGrid(wikiSearch.value);
}

function exitManageFavoritesMode() {
  manageFavoritesMode = false;
  manageFavoritesSelected.clear();
  syncManageFavoritesUrl();
  document.getElementById("wiki-manage-toolbar").classList.add("hidden");
  updateFavoritesToggleText();
  renderWikiGrid(wikiSearch.value);
}

document.getElementById("wiki-manage-favorites-btn").addEventListener("click", () => {
  if (manageFavoritesMode) exitManageFavoritesMode();
  else enterManageFavoritesMode();
});
document.getElementById("wiki-manage-done-btn").addEventListener("click", exitManageFavoritesMode);

document.getElementById("wiki-manage-select-all").addEventListener("click", () => {
  const favIds = loadFavorites();
  if (manageFavoritesSelected.size === favIds.length) {
    manageFavoritesSelected.clear();
    document.querySelectorAll(".species-card.manage-mode").forEach((cardEl) => {
      cardEl.classList.remove("manage-selected");
      const btn = cardEl.querySelector(".card-manage-check");
      if (btn) { btn.textContent = "\u2610"; btn.classList.remove("selected"); btn.setAttribute("aria-label", `Select ${cardEl.dataset.speciesId}`); }
    });
  } else {
    favIds.forEach((id) => manageFavoritesSelected.add(id));
    document.querySelectorAll(".species-card.manage-mode").forEach((cardEl) => {
      const id = cardEl.dataset.speciesId;
      if (favIds.includes(id)) {
        cardEl.classList.add("manage-selected");
        const btn = cardEl.querySelector(".card-manage-check");
        if (btn) { btn.textContent = "\u2713"; btn.classList.add("selected"); btn.setAttribute("aria-label", `Deselect ${id}`); }
      }
    });
  }
  updateManageToolbar();
});

document.getElementById("wiki-manage-remove-btn").addEventListener("click", () => {
  if (manageFavoritesSelected.size === 0) return;
  const ids = loadFavorites().filter((id) => !manageFavoritesSelected.has(id));
  saveFavorites(ids);
  exitManageFavoritesMode();
});

// ── Compare mode ─────────────────────────────────────────────────

function syncCompareUrl() {
  const url = new URL(window.location);
  if (compareMode && compareSelected.size > 0) {
    url.searchParams.set("compare", [...compareSelected].join(","));
  } else {
    url.searchParams.delete("compare");
  }
  const panelOpen = !document.getElementById("compare-modal").classList.contains("hidden");
  if (panelOpen && compareSelected.size >= 2) {
    url.searchParams.set("compareOpen", "1");
  } else {
    url.searchParams.delete("compareOpen");
  }
  history.replaceState({}, "", url);
}

function updateCompareToolbar() {
  const count = compareSelected.size;
  document.getElementById("wiki-compare-count").textContent =
    count === 0 ? "Select 2\u20133 species" : count === 1 ? "1 selected" : `${count} selected`;
  document.getElementById("wiki-compare-go-btn").disabled = count < 2;
  syncCompareUrl();
}

function enterCompareMode(skipSync = false) {
  compareMode = true;
  if (!skipSync) compareSelected.clear();
  document.getElementById("wiki-compare-toolbar").classList.add("visible");
  document.getElementById("wiki-compare-btn").classList.add("active");
  updateCompareToolbar();

  if (wikiViewMode === "list") {
    // List rows don't have the card image area; switch to grid so checkboxes appear
    setViewMode("grid");
    return;
  }

  // Transform existing cards in place — no full re-render.
  // Pattern: disable transitions → swap content (invisible) → single reflow → re-enable → fade in.
  // This prevents the background-color transition from racing the opacity fade-in.
  const enterCards = Array.from(document.querySelectorAll(".species-card"));
  enterCards.forEach((card) => {
    card.classList.add("compare-mode");
    const starBtn = card.querySelector(".species-card-star");
    if (!starBtn) return;
    const id = card.dataset.speciesId;
    const sp = WIKI_DATA.items.find((s) => s.id === id);
    starBtn.style.transition = "none";
    starBtn.style.opacity = "0";
    starBtn.className = "species-card-star card-compare-check";
    starBtn.textContent = "\u2295";
    starBtn.setAttribute("aria-label", `Add ${sp ? sp.commonName : id} to comparison`);
  });
  // Single reflow commits all the above changes before re-enabling transitions
  void document.getElementById("wiki-grid").offsetHeight;
  enterCards.forEach((card) => {
    const starBtn = card.querySelector(".species-card-star");
    if (starBtn) { starBtn.style.transition = ""; starBtn.style.opacity = ""; }
  });
}

function exitCompareMode() {
  compareMode = false;
  compareSelected.clear();
  syncCompareUrl();
  closeComparePanel();
  document.getElementById("wiki-compare-toolbar").classList.remove("visible");
  document.getElementById("wiki-compare-btn").classList.remove("active");

  const favIds = loadFavorites();
  const exitCards = Array.from(document.querySelectorAll(".species-card"));
  exitCards.forEach((card) => {
    card.classList.remove("compare-mode", "compare-selected", "compare-shake");
    const starBtn = card.querySelector(".species-card-star");
    if (!starBtn) return;
    const id = card.dataset.speciesId;
    const sp = WIKI_DATA.items.find((s) => s.id === id);
    const isFav = favIds.includes(id);
    starBtn.style.transition = "none";
    starBtn.style.opacity = "0";
    starBtn.className = "species-card-star" + (isFav ? " favorited" : "");
    starBtn.textContent = isFav ? "\u2605" : "\u2606";
    starBtn.setAttribute(
      "aria-label",
      isFav ? `Unfavorite ${sp ? sp.commonName : id}` : `Favorite ${sp ? sp.commonName : id}`
    );
  });
  void document.getElementById("wiki-grid").offsetHeight;
  exitCards.forEach((card) => {
    const starBtn = card.querySelector(".species-card-star");
    if (starBtn) { starBtn.style.transition = ""; starBtn.style.opacity = ""; }
  });
}

function openComparePanel() {
  renderComparePanel();
  document.getElementById("compare-modal").classList.remove("hidden");
  syncCompareUrl();
}

function closeComparePanel() {
  document.getElementById("compare-modal").classList.add("hidden");
  syncCompareUrl();
}

function renderComparePanel() {
  const species = [...compareSelected]
    .map((id) => WIKI_DATA.items.find((s) => s.id === id))
    .filter(Boolean);
  const n = species.length;

  const wrap = document.getElementById("compare-modal-body");
  wrap.innerHTML = "";
  wrap.style.setProperty("--compare-cols", n);

  const inner = document.createElement("div");
  inner.className = "compare-table-inner";
  wrap.appendChild(inner);

  function makeSection(title) {
    const sec = document.createElement("div");
    sec.className = "compare-section-header";
    sec.textContent = title;
    inner.appendChild(sec);
  }

  function makeRow(labelText, cellFn, extraClass) {
    const row = document.createElement("div");
    row.className = "compare-row" + (extraClass ? " " + extraClass : "");
    const label = document.createElement("div");
    label.className = "compare-cell compare-cell--label";
    label.textContent = labelText;
    row.appendChild(label);
    species.forEach((sp) => {
      const cell = document.createElement("div");
      cell.className = "compare-cell compare-cell--data";
      cellFn(cell, sp);
      row.appendChild(cell);
    });
    inner.appendChild(row);
  }

  // ── Species header row ─────────────────────────────────────────
  const headerRow = document.createElement("div");
  headerRow.className = "compare-row compare-row--header";
  const spacer = document.createElement("div");
  spacer.className = "compare-cell compare-cell--label compare-cell--header-spacer";
  headerRow.appendChild(spacer);
  species.forEach((sp) => {
    const cell = document.createElement("div");
    cell.className = "compare-cell compare-cell--species-header";

    const imgEl = document.createElement("div");
    imgEl.className = "compare-species-img";
    const photo = sp.photos && sp.photos[0];
    if (photo) {
      imgEl.style.backgroundImage = `url(${photo})`;
      imgEl.style.backgroundSize = "cover";
      imgEl.style.backgroundPosition = "center";
    } else if (SILHOUETTE_FALLBACK) {
      imgEl.style.backgroundImage = `url(${SILHOUETTE_FALLBACK})`;
      imgEl.style.backgroundSize = "cover";
      imgEl.style.backgroundPosition = "center";
    } else {
      imgEl.textContent = sp.emoji || wikiProjectEmoji;
      imgEl.style.background = "linear-gradient(135deg, #0a0a0a, var(--color-primary))";
    }

    const info = document.createElement("div");
    info.className = "compare-species-info";
    const nameEl = document.createElement("div");
    nameEl.className = "compare-species-name";
    nameEl.textContent = sp.commonName;
    const sciEl = document.createElement("div");
    sciEl.className = "compare-species-sci";
    sciEl.textContent = sp.scientificName;
    const viewBtn = document.createElement("button");
    viewBtn.className = "compare-view-btn";
    viewBtn.textContent = "View details \u2192";
    viewBtn.addEventListener("click", () => {
      returnToCompare = true;
      document.getElementById("compare-modal").classList.add("hidden");
      openSpeciesModal(sp, null);
    });
    info.appendChild(nameEl);
    info.appendChild(sciEl);
    info.appendChild(viewBtn);

    cell.appendChild(imgEl);
    cell.appendChild(info);
    headerRow.appendChild(cell);
  });
  inner.appendChild(headerRow);

  // ── Status & Health ────────────────────────────────────────────
  makeSection("Status \u0026 Health");

  // ── IUCN Status ────────────────────────────────────────────────
  makeRow("IUCN Status", (cell, sp) => {
    const meta = STATUS_ORDER.find((s) => s.label === sp.statusLabel);
    if (meta) {
      const badge = document.createElement("span");
      badge.className = "compare-status-badge";
      badge.style.color = meta.color;
      badge.style.background = meta.bg;
      badge.textContent = sp.statusLabel;
      cell.appendChild(badge);
    } else {
      cell.textContent = sp.statusLabel || "\u2014";
    }
  });

  // ── Health Score ───────────────────────────────────────────────
  makeRow("Health Score", (cell, sp) => {
    if (sp.lifePercent == null) { cell.textContent = "\u2014"; return; }
    const color = getLifeBarColor(sp.lifePercent);
    const barWrap = document.createElement("div");
    barWrap.className = "compare-health-bar-wrap";
    const bar = document.createElement("div");
    bar.className = "compare-health-bar";
    bar.style.width = sp.lifePercent + "%";
    bar.style.background = color;
    barWrap.appendChild(bar);
    const pct = document.createElement("span");
    pct.className = "compare-health-pct";
    pct.style.color = color;
    pct.textContent = sp.lifePercent + "%";
    cell.appendChild(barWrap);
    cell.appendChild(pct);
  });

  // ── Population Trend ───────────────────────────────────────────
  makeRow("Pop. Trend", (cell, sp) => {
    const metric = sp.healthMetrics && sp.healthMetrics.find((m) => m.label === "Population Trend");
    const pts = sp.populationTrend && sp.populationTrend.length >= 2 ? sp.populationTrend : null;

    const TREND_WORD = { down: "Decreasing", up: "Increasing", stable: "Stable" };
    let dir = metric ? metric.trend : null;
    if (!dir && pts) {
      const pct = Math.round((pts[pts.length - 1].value - pts[0].value) / pts[0].value * 100);
      dir = pct < -5 ? "down" : pct > 5 ? "up" : "stable";
    }
    const label = TREND_WORD[dir] || null;
    if (!label) { cell.textContent = "\u2014"; return; }

    const sym = dir === "down" ? " \u25bc" : dir === "up" ? " \u25b2" : "";
    const main = document.createElement("span");
    main.className = `compare-trend-text compare-trend-text--${dir || "unknown"}`;
    main.textContent = label + sym;
    cell.appendChild(main);

    if (pts) {
      const pct = Math.round((pts[pts.length - 1].value - pts[0].value) / pts[0].value * 100);
      const sub = document.createElement("span");
      sub.className = "compare-trend-sub";
      sub.textContent = (pct > 0 ? "+" : "") + pct + "% since " + pts[0].year;
      cell.appendChild(sub);
    }
  });

  // ── Vital Stats ────────────────────────────────────────────────
  makeSection("Vital Stats");

  // ── Max Length ─────────────────────────────────────────────────
  makeRow("Max Length", (cell, sp) => {
    const vs = sp.vitalSigns && sp.vitalSigns.find((v) => /max.*length/i.test(v.label));
    if (vs) {
      cell.textContent = vs.metric || vs.value;
    } else if (sp.size) {
      // Pull first semicolon-delimited segment or first sentence
      const seg = sp.size.split(";").pop().trim();
      const clean = seg.match(/^[^.!?]+[.!?]/)?.[0] || seg.slice(0, 80);
      cell.textContent = clean;
    } else {
      cell.textContent = "\u2014";
    }
  });

  // ── Lifespan ───────────────────────────────────────────────────
  makeRow("Lifespan", (cell, sp) => {
    const vs = sp.vitalSigns && sp.vitalSigns.find((v) => /lifespan/i.test(v.label));
    cell.textContent = vs ? vs.value : "\u2014";
  });

  // ── Ecology ────────────────────────────────────────────────────
  makeSection("Ecology");

  // ── Diet ───────────────────────────────────────────────────────
  makeRow("Diet", (cell, sp) => {
    if (sp.dietType) {
      const info = DIET_BADGE[sp.dietType];
      if (info) {
        const badge = document.createElement("span");
        badge.className = `card-badge card-badge--diet card-badge--${sp.dietType}`;
        badge.textContent = `${info.icon} ${info.label}`;
        cell.appendChild(badge);
      }
    }
    if (sp.diet) {
      const text = document.createElement("div");
      text.className = "compare-cell-text";
      const raw = sp.diet.match(/^[^.!?]+[.!?]/)?.[0] || sp.diet.slice(0, 90);
      text.textContent = raw.length > 90 ? raw.slice(0, 87) + "\u2026" : raw;
      cell.appendChild(text);
    } else if (!sp.dietType) {
      cell.textContent = "\u2014";
    }
  });

  // ── Habitat ────────────────────────────────────────────────────
  makeRow("Habitat", (cell, sp) => {
    if (sp.habitatTypes && sp.habitatTypes.length) {
      sp.habitatTypes.forEach((type) => {
        const info = HABITAT_BADGE[type];
        if (!info) return;
        const badge = document.createElement("span");
        badge.className = `card-badge card-badge--habitat card-badge--${type}`;
        badge.textContent = `${info.icon} ${info.label}`;
        cell.appendChild(badge);
      });
    } else {
      cell.textContent = "\u2014";
    }
  });

  // ── Top Threats ────────────────────────────────────────────────
  makeRow("Top Threats", (cell, sp) => {
    if (!sp.threats || sp.threats.length === 0) { cell.textContent = "\u2014"; return; }
    const top = sp.threats
      .slice()
      .sort((a, b) => (SEVERITY_SCORE[b.severity] || 0) - (SEVERITY_SCORE[a.severity] || 0))
      .slice(0, 3);
    top.forEach((threat) => {
      const item = document.createElement("div");
      item.className = "compare-threat-item";
      const badge = document.createElement("span");
      badge.className = `tab-severity-badge tab-severity-badge--${threat.severity}`;
      badge.textContent = threat.severity.charAt(0).toUpperCase() + threat.severity.slice(1);
      const name = document.createElement("span");
      name.className = "compare-threat-name";
      name.textContent = threat.name;
      item.appendChild(badge);
      item.appendChild(name);
      cell.appendChild(item);
    });
  }, "compare-row--last");
}

document.getElementById("wiki-compare-btn").addEventListener("click", () => {
  if (compareMode) exitCompareMode();
  else enterCompareMode();
});
document.getElementById("wiki-compare-go-btn").addEventListener("click", openComparePanel);
document.getElementById("wiki-compare-cancel-btn").addEventListener("click", exitCompareMode);
document.getElementById("compare-modal-close").addEventListener("click", closeComparePanel);
document.getElementById("compare-modal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("compare-modal")) closeComparePanel();
});

function updateClearFiltersVisibility() {
  const hasFilters =
    wikiSearch.value.trim() !== "" ||
    activeStatusFilters.size > 0 ||
    activeHabitatFilters.size > 0 ||
    activeDietFilters.size > 0 ||
    activeRegionFilters.size > 0 ||
    activeTagFilters.size > 0 ||
    activePhotoFilters.size > 0 ||
    activeDataFilters.size > 0 ||
    sortMode !== "default" ||
    showFavoritesOnly;
  document.getElementById("wiki-clear-filters").hidden = !hasFilters;
}

function syncUrlFromState() {
  const url = new URL(window.location);

  const q = wikiSearch.value.trim();
  if (q) url.searchParams.set("q", q);
  else url.searchParams.delete("q");

  if (sortMode !== "default") url.searchParams.set("sort", sortMode);
  else url.searchParams.delete("sort");

  if (activeStatusFilters.size > 0) url.searchParams.set("status", [...activeStatusFilters].join(","));
  else url.searchParams.delete("status");

  if (activeHabitatFilters.size > 0) url.searchParams.set("habitat", [...activeHabitatFilters].join(","));
  else url.searchParams.delete("habitat");

  if (activeDietFilters.size > 0) url.searchParams.set("diet", [...activeDietFilters].join(","));
  else url.searchParams.delete("diet");

  if (activeRegionFilters.size > 0) url.searchParams.set("region", [...activeRegionFilters].join(","));
  else url.searchParams.delete("region");

  if (activeTagFilters.size > 0) url.searchParams.set("tag", [...activeTagFilters].join(","));
  else url.searchParams.delete("tag");

  if (activePhotoFilters.size > 0) url.searchParams.set("photos", [...activePhotoFilters].join(","));
  else url.searchParams.delete("photos");

  if (activeDataFilters.size > 0) url.searchParams.set("data", [...activeDataFilters].join(","));
  else url.searchParams.delete("data");

  if (showFavoritesOnly) url.searchParams.set("fav", "1");
  else url.searchParams.delete("fav");

  history.replaceState(history.state, "", url);
}

document.getElementById("wiki-clear-filters").addEventListener("click", () => {
  if (manageFavoritesMode) exitManageFavoritesMode();
  wikiSearch.value = "";
  activeStatusFilters.clear();
  activeHabitatFilters.clear();
  activeDietFilters.clear();
  activeRegionFilters.clear();
  activeTagFilters.clear();
  activePhotoFilters.clear();
  activeDataFilters.clear();
  sortMode = "default";
  showFavoritesOnly = false;
  document.getElementById("wiki-sort").value = "default";
  const favBtn = document.getElementById("wiki-favorites-toggle");
  favBtn.classList.remove("active");
  favBtn.setAttribute("aria-pressed", "false");
  updateFavoritesToggleText();
  document.querySelectorAll(".wiki-filter-chip").forEach((chip) => {
    chip.classList.remove("active");
    chip.setAttribute("aria-pressed", "false");
  });
  updateFilterBtnState();
  renderWikiGrid("");
  syncUrlFromState();
});

document.getElementById("wiki-surprise-btn").addEventListener("click", () => {
  const items = WIKI_DATA.items;
  if (!items || items.length === 0) return;
  const randomSpecies = items[Math.floor(Math.random() * items.length)];
  openSpeciesModal(randomSpecies, null);
});

// ── At-a-glance timeline toggle ────────────────────────────────

document.getElementById("wiki-glance").addEventListener("click", () => {
  if (timelineMode) exitTimelineMode(); else enterTimelineMode();
});
document.getElementById("wiki-glance").addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    if (timelineMode) exitTimelineMode(); else enterTimelineMode();
  }
});

// ── About this wiki modal ──────────────────────────────────────

const wikiAboutModal = document.getElementById("wiki-about-modal");
document.getElementById("wiki-about-btn").addEventListener("click", () => wikiAboutModal.classList.remove("hidden"));
document.getElementById("wiki-about-modal-close").addEventListener("click", () => wikiAboutModal.classList.add("hidden"));
wikiAboutModal.addEventListener("click", (e) => { if (e.target === wikiAboutModal) wikiAboutModal.classList.add("hidden"); });

// ── Keyboard shortcut help overlay ────────────────────────────

function openKbHelp()  { kbHelpOverlay.classList.remove("hidden"); }
function closeKbHelp() { kbHelpOverlay.classList.add("hidden"); }

document.getElementById("kb-help-close").addEventListener("click", closeKbHelp);
kbHelpOverlay.addEventListener("click", (e) => { if (e.target === kbHelpOverlay) closeKbHelp(); });

// ── Keyboard navigation ────────────────────────────────────────

function getVisibleCards() {
  return Array.from(document.querySelectorAll(".species-card, .list-row"));
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
  const kbHelpOpen = !kbHelpOverlay.classList.contains("hidden");
  if (kbHelpOpen) {
    if (e.key === "Escape" || e.key === "?") { e.preventDefault(); closeKbHelp(); }
    return;
  }

  const galleryOpen = !galleryOverlay.classList.contains("hidden");
  if (galleryOpen) {
    if (e.key === "Escape") { e.preventDefault(); closeGallery(); return; }
    if (e.key === "ArrowLeft")  { e.preventDefault(); navigateGallery(-1); return; }
    if (e.key === "ArrowRight") { e.preventDefault(); navigateGallery(1);  return; }
    return;
  }

  const compareModalOpen = !document.getElementById("compare-modal").classList.contains("hidden");
  if (compareModalOpen) {
    if (e.key === "Escape") { e.preventDefault(); closeComparePanel(); }
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
  if (e.key === "?") { e.preventDefault(); openKbHelp(); return; }
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
    card.click();
    return;
  }
});

// ── At-a-glance status bar ─────────────────────────────────────

function updateFilterBtnState() {
  const btn = document.getElementById("wiki-filter-btn");
  if (!btn) return;
  const count = activeStatusFilters.size + activeHabitatFilters.size + activeDietFilters.size + activeRegionFilters.size + activeTagFilters.size + activePhotoFilters.size + activeDataFilters.size;
  btn.classList.toggle("active", count > 0);
  const arrow = filterPanelOpen ? "▴" : "▾";
  btn.textContent = count > 0 ? `Filter (${count}) ${arrow}` : `Filter ${arrow}`;
}

function renderFilterPanel() {
  const panel = document.getElementById("wiki-filter-panel");
  if (!panel) return;

  panel.innerHTML = "";

  let chipIndex = 0;

  function makeFilterChip(key, text, color, bg, activeSet, count) {
    const chip = document.createElement("button");
    chip.className = "wiki-filter-chip";
    chip.style.animationDelay = `${chipIndex++ * 25}ms`;
    chip.style.setProperty("--chip-color", color);
    chip.style.setProperty("--chip-bg", bg);
    chip.setAttribute("aria-pressed", String(activeSet.has(key)));
    if (activeSet.has(key)) chip.classList.add("active");
    if (count !== undefined) {
      const countEl = document.createElement("span");
      countEl.className = "chip-count";
      countEl.textContent = count;
      const labelEl = document.createElement("span");
      labelEl.className = "chip-label";
      labelEl.textContent = text;
      chip.appendChild(countEl);
      chip.appendChild(labelEl);
    } else {
      chip.textContent = text;
    }
    chip.addEventListener("click", () => {
      if (activeSet.has(key)) {
        activeSet.delete(key);
        chip.classList.remove("active");
        chip.setAttribute("aria-pressed", "false");
      } else {
        activeSet.add(key);
        chip.classList.add("active");
        chip.setAttribute("aria-pressed", "true");
      }
      updateFilterBtnState();
      renderWikiGrid(wikiSearch.value);
      updateClearFiltersVisibility();
      syncUrlFromState();
    });
    return chip;
  }

  function makeGroup(labelText, chips) {
    if (chips.length === 0) return;
    const group = document.createElement("div");
    group.className = "wiki-filter-group";
    const lbl = document.createElement("span");
    lbl.className = "wiki-filter-group-label";
    lbl.textContent = labelText;
    group.appendChild(lbl);
    chips.forEach((chip) => group.appendChild(chip));
    panel.appendChild(group);
  }

  // Status group
  const statusCounts = {};
  WIKI_DATA.items.forEach((s) => { statusCounts[s.statusLabel] = (statusCounts[s.statusLabel] || 0) + 1; });
  const statusChips = [];
  STATUS_ORDER.forEach(({ label, color, bg }) => {
    if (!statusCounts[label]) return;
    statusChips.push(makeFilterChip(label, label, color, bg, activeStatusFilters, statusCounts[label]));
  });
  Object.keys(statusCounts).forEach((label) => {
    if (STATUS_ORDER.find((s) => s.label === label)) return;
    statusChips.push(makeFilterChip(label, label, "#707070", "rgba(112,112,112,0.13)", activeStatusFilters, statusCounts[label]));
  });
  makeGroup("Status", statusChips);

  // Habitat group
  makeGroup("Habitat", Object.keys(HABITAT_BADGE)
    .filter((k) => WIKI_DATA.items.some((s) => (s.habitatTypes || []).includes(k)))
    .map((k) => makeFilterChip(k, `${HABITAT_BADGE[k].icon} ${HABITAT_BADGE[k].label}`, HABITAT_BADGE[k].color, HABITAT_BADGE[k].bg, activeHabitatFilters)));

  // Diet group
  makeGroup("Diet", Object.keys(DIET_BADGE)
    .filter((k) => WIKI_DATA.items.some((s) => s.dietType === k))
    .map((k) => makeFilterChip(k, `${DIET_BADGE[k].icon} ${DIET_BADGE[k].label}`, DIET_BADGE[k].color, DIET_BADGE[k].bg, activeDietFilters)));

  // Region group
  makeGroup("Region", Object.keys(GEOGRAPHIC_REGION)
    .filter((k) => WIKI_DATA.items.some((s) => (s.geographicRegions || []).includes(k)))
    .map((k) => makeFilterChip(k, `${GEOGRAPHIC_REGION[k].icon} ${GEOGRAPHIC_REGION[k].label}`, GEOGRAPHIC_REGION[k].color, GEOGRAPHIC_REGION[k].bg, activeRegionFilters)));

  // Tags group
  makeGroup("Tags", Object.keys(TAG_BADGE)
    .filter((k) => WIKI_DATA.items.some((s) => (s.tags || []).includes(k)))
    .map((k) => makeFilterChip(k, `${TAG_BADGE[k].icon} ${TAG_BADGE[k].label}`, TAG_BADGE[k].color, TAG_BADGE[k].bg, activeTagFilters)));

  // Photos group
  const photoCount = WIKI_DATA.items.filter((s) => s.photos && s.photos.length > 0).length;
  if (photoCount > 0) {
    makeGroup("Photos", [
      makeFilterChip("has-photos", "📷 Has Photos", "#2d5f8a", "rgba(45,95,138,0.12)", activePhotoFilters, photoCount),
    ]);
  }

  // Data completeness group
  const tierCounts = { full: 0, standard: 0, stub: 0 };
  WIKI_DATA.items.forEach((s) => { tierCounts[getSpeciesTier(s)]++; });
  makeGroup("Data", ["full", "standard", "stub"]
    .filter((k) => tierCounts[k] > 0)
    .map((k) => makeFilterChip(k, `${DATA_TIER_BADGE[k].icon} ${DATA_TIER_BADGE[k].label}`, DATA_TIER_BADGE[k].color, DATA_TIER_BADGE[k].bg, activeDataFilters, tierCounts[k])));
}

document.getElementById("wiki-filter-btn").addEventListener("click", () => {
  filterPanelOpen = !filterPanelOpen;
  const panel = document.getElementById("wiki-filter-panel");
  if (filterPanelOpen) renderFilterPanel();
  panel.classList.toggle("hidden", !filterPanelOpen);
  updateFilterBtnState();
});

function renderGlanceBar(items) {
  const el = document.getElementById("wiki-glance");
  if (!el) return;

  const src = items ?? WIKI_DATA.items;
  const avg = src.length
    ? Math.round(src.reduce((sum, s) => sum + (s.lifePercent || 0), 0) / src.length)
    : null;
  const color   = avg !== null ? getLifeBarColor(avg) : "var(--color-text-muted)";
  // Build DOM once; update in-place on subsequent calls
  let barFill = el.querySelector(".wiki-glance-bar-fill");
  const isFirst = !barFill;

  if (isFirst) {
    el.innerHTML = "";

    const label = document.createElement("span");
    label.className = "wiki-glance-label";
    label.textContent = "At a glance";
    el.appendChild(label);

    const barWrap = document.createElement("div");
    barWrap.className = "wiki-glance-bar-wrap";
    barFill = document.createElement("div");
    barFill.className = "wiki-glance-bar-fill";
    barFill.style.transform = "scaleX(0)"; // collapsed; CSS transition animates to target
    barFill.style.background = color;
    barWrap.appendChild(barFill);
    el.appendChild(barWrap);

    const pct = document.createElement("span");
    pct.className = "wiki-glance-pct";
    pct.style.color = color;
    pct.textContent = avg !== null ? "0%" : "—";
    el.appendChild(pct);

    const sub = document.createElement("span");
    sub.className = "wiki-glance-sub";
    sub.textContent = "avg. health";
    el.appendChild(sub);

    const chevron = document.createElement("span");
    chevron.className = "wiki-glance-chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.textContent = "▾";
    el.appendChild(chevron);

    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.setAttribute("aria-label", "At a glance — click to view status history timeline");
    el.setAttribute("aria-expanded", "false");

    if (avg !== null) {
      const runAnim = () => {
        const duration = 550;
        const start = performance.now();
        requestAnimationFrame(function tick(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          barFill.style.transform = `scaleX(${(eased * avg) / 100})`;
          pct.textContent = Math.round(eased * avg) + "%";
          if (progress < 1) requestAnimationFrame(tick);
        });
      };
      if (typeof requestIdleCallback !== "undefined") {
        requestIdleCallback(runAnim, { timeout: 1000 });
      } else {
        setTimeout(runAnim, 200);
      }
    }
    return;
  }

  // Subsequent updates (filter/sort changes).
  barFill.style.background = color;
  const pctEl = el.querySelector(".wiki-glance-pct");
  pctEl.style.color = color;

  if (avg !== null) {
    const fromScale = parseFloat(barFill.style.transform.replace(/[^0-9.]/g, "")) || 0;
    const fromVal   = parseInt(pctEl.textContent) || 0;
    const duration  = 400;
    const start     = performance.now();
    requestAnimationFrame(function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      barFill.style.transform = `scaleX(${fromScale + (avg / 100 - fromScale) * eased})`;
      pctEl.textContent = Math.round(fromVal + eased * (avg - fromVal)) + "%";
      if (progress < 1) requestAnimationFrame(tick);
    });
  } else {
    barFill.style.transform = "scaleX(0)";
    pctEl.textContent = "—";
  }
}

// ── Status history timeline view ───────────────────────────────

function enterTimelineMode() {
  if (timelineMode) return;
  timelineMode = true;
  if (filterPanelOpen) {
    filterPanelOpen = false;
    document.getElementById("wiki-filter-panel").classList.add("hidden");
    updateFilterBtnState();
  }

  // FLIP: snapshot glance position before layout change
  const statusBar = document.getElementById("wiki-status-bar");
  const beforeRect = statusBar.getBoundingClientRect();

  document.body.classList.add("wiki-timeline-mode");
  renderTimeline();

  const chevron = document.querySelector(".wiki-glance-chevron");
  if (chevron) chevron.classList.add("wiki-glance-chevron--open");
  document.getElementById("wiki-glance").setAttribute("aria-expanded", "true");

  // FLIP: animate status bar from old position (play the inverse delta)
  const afterRect = statusBar.getBoundingClientRect();
  const dy = beforeRect.top - afterRect.top;
  if (dy > 0) {
    statusBar.animate(
      [{ transform: `translateY(${dy}px)` }, { transform: "translateY(0)" }],
      { duration: 420, easing: "cubic-bezier(0.4, 0, 0.2, 1)" }
    );
  }

  // Timeline content slides down from bar and fades in
  const timeline = document.getElementById("wiki-timeline");
  timeline.animate(
    [
      { opacity: 0, transform: "translateY(-16px)" },
      { opacity: 1, transform: "translateY(0)" },
    ],
    { duration: 380, delay: 60, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "both" }
  );
}

function exitTimelineMode() {
  if (!timelineMode) return;
  timelineMode = false;
  const chevron = document.querySelector(".wiki-glance-chevron");
  if (chevron) chevron.classList.remove("wiki-glance-chevron--open");
  document.getElementById("wiki-glance").setAttribute("aria-expanded", "false");

  const statusBar = document.getElementById("wiki-status-bar");
  const timeline = document.getElementById("wiki-timeline");
  const grid = document.getElementById("wiki-grid");

  // Keep timeline visible during its exit animation — inline display:block overrides
  // the CSS display:none that fires when wiki-timeline-mode is removed
  timeline.style.display = "block";

  // Step 1: fade the timeline out first
  const fadeOut = timeline.animate(
    [
      { opacity: 1, transform: "translateY(0)" },
      { opacity: 0, transform: "translateY(-20px)" },
    ],
    { duration: 300, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" }
  );

  fadeOut.onfinish = () => {
    // Step 2: measure bar position while still in timeline layout
    const beforeRect = statusBar.getBoundingClientRect();

    // Step 3: add fade-in class BEFORE layout restore so the CSS animation's backwards
    // fill (opacity:0) is already applied when the grid first becomes display:block
    grid.classList.add("wiki-grid--fade-in");

    // Force a style recalc so the browser commits the animation's from-state (opacity:0)
    // before the next step makes the grid visible
    grid.getBoundingClientRect();

    // Step 4: restore layout (search bar reappears, grid shows, CSS display:none takes timeline)
    timeline.style.display = "";
    document.body.classList.remove("wiki-timeline-mode");

    // Step 5: measure bar's new position and FLIP it down
    const afterRect = statusBar.getBoundingClientRect();
    const dy = afterRect.top - beforeRect.top;
    if (dy > 0) {
      statusBar.animate(
        [{ transform: `translateY(${-dy}px)` }, { transform: "translateY(0)" }],
        { duration: 400, easing: "cubic-bezier(0.4, 0, 0.2, 1)" }
      );
    }

    // Step 6: remove the fade class once the animation has finished
    setTimeout(() => grid.classList.remove("wiki-grid--fade-in"), 420);
  };
}

function renderTimeline() {
  const container = document.getElementById("wiki-timeline");
  container.innerHTML = "";

  const MIN_YEAR = 1970;
  const MAX_YEAR = 2025;
  const TOTAL_YEARS = MAX_YEAR - MIN_YEAR;
  const TICK_YEARS = [1970, 1980, 1990, 2000, 2010, 2020];

  const species = WIKI_DATA.items
    .filter((s) => Array.isArray(s.statusHistory) && s.statusHistory.length > 0)
    .sort((a, b) => {
      const rA = STATUS_ORDER.findIndex((x) => x.label === a.statusLabel);
      const rB = STATUS_ORDER.findIndex((x) => x.label === b.statusLabel);
      return (rA === -1 ? 99 : rA) - (rB === -1 ? 99 : rB);
    });

  // ── Legend (first) ────────────────────────────────────────────
  const legend = document.createElement("div");
  legend.className = "tl-legend";
  ["Critically Endangered", "Endangered", "Vulnerable", "Near Threatened", "Least Concern", "Not Evaluated"].forEach((lbl) => {
    const meta = STATUS_ORDER.find((x) => x.label === lbl);
    if (!meta) return;
    const item = document.createElement("span");
    item.className = "tl-legend-item";
    const swatch = document.createElement("span");
    swatch.className = "tl-legend-swatch";
    swatch.style.background = meta.color;
    item.appendChild(swatch);
    item.appendChild(document.createTextNode(lbl));
    legend.appendChild(item);
  });
  container.appendChild(legend);

  // ── Body: year overlay + rows ─────────────────────────────────
  const body = document.createElement("div");
  body.className = "tl-body";

  // Year overlay — vertical lines + labels, positioned over the tracks area
  const yearOverlay = document.createElement("div");
  yearOverlay.className = "tl-year-overlay";
  TICK_YEARS.forEach((y) => {
    const line = document.createElement("div");
    line.className = "tl-year-line";
    line.style.left = (((y - MIN_YEAR) / TOTAL_YEARS) * 100) + "%";
    const label = document.createElement("span");
    label.className = "tl-year-label";
    label.textContent = y;
    line.appendChild(label);
    yearOverlay.appendChild(line);
  });
  body.appendChild(yearOverlay);

  // ── Rows ──────────────────────────────────────────────────────
  species.forEach((s, rowIdx) => {
    const hist = [...s.statusHistory].sort((a, b) => a.year - b.year);

    const row = document.createElement("div");
    row.className = "tl-row";
    row.style.animationDelay = `${rowIdx * 20}ms`;
    row.setAttribute("role", "button");
    row.setAttribute("tabindex", "0");
    row.addEventListener("click", () => openSpeciesModal(s, row));
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openSpeciesModal(s, row); }
    });

    // Label column
    const labelEl = document.createElement("div");
    labelEl.className = "tl-row-label";

    const nameEl = document.createElement("span");
    nameEl.className = "tl-row-name";
    nameEl.textContent = s.commonName;
    labelEl.appendChild(nameEl);

    const statusMeta = STATUS_ORDER.find((x) => x.label === s.statusLabel);
    if (statusMeta) {
      const badge = document.createElement("span");
      badge.className = "tl-row-badge";
      badge.style.color = statusMeta.color;
      badge.style.background = statusMeta.bg;
      badge.textContent = s.statusLabel;
      labelEl.appendChild(badge);
    }
    row.appendChild(labelEl);

    // Bands
    const bandsEl = document.createElement("div");
    bandsEl.className = "tl-row-bands";

    hist.forEach((entry, i) => {
      const startYear = Math.max(entry.year, MIN_YEAR);
      const endYear   = i < hist.length - 1 ? hist[i + 1].year : MAX_YEAR;
      const leftPct   = ((startYear - MIN_YEAR) / TOTAL_YEARS) * 100;
      const widthPct  = ((endYear   - startYear) / TOTAL_YEARS) * 100;
      const sMeta     = STATUS_ORDER.find((x) => x.label === entry.status);
      const color     = sMeta ? sMeta.color : "#888888";

      const band = document.createElement("div");
      band.className = "tl-band";
      band.style.left       = leftPct  + "%";
      band.style.width      = widthPct + "%";
      band.style.background = color + "55";
      band.style.borderLeft = `3px solid ${color}`;
      band.title = `${entry.status} · ${startYear}–${endYear === MAX_YEAR ? "present" : endYear}`;
      bandsEl.appendChild(band);
    });

    row.appendChild(bandsEl);
    body.appendChild(row);
  });

  container.appendChild(body);
}

// Restore search/sort/filter state from URL params (supports shareable filtered views)
(function initStateFromUrl() {
  const params = new URLSearchParams(window.location.search);

  const q = params.get("q");
  if (q) wikiSearch.value = q;

  const sort = params.get("sort");
  if (sort) {
    sortMode = sort;
    document.getElementById("wiki-sort").value = sort;
  }

  const status = params.get("status");
  if (status) status.split(",").forEach((v) => { if (v.trim()) activeStatusFilters.add(v.trim()); });

  const habitat = params.get("habitat");
  if (habitat) habitat.split(",").forEach((v) => { if (v.trim()) activeHabitatFilters.add(v.trim()); });

  const diet = params.get("diet");
  if (diet) diet.split(",").forEach((v) => { if (v.trim()) activeDietFilters.add(v.trim()); });

  const region = params.get("region");
  if (region) region.split(",").forEach((v) => { if (v.trim()) activeRegionFilters.add(v.trim()); });

  const tag = params.get("tag");
  if (tag) tag.split(",").forEach((v) => { if (v.trim()) activeTagFilters.add(v.trim()); });

  const photos = params.get("photos");
  if (photos) photos.split(",").forEach((v) => { if (v.trim()) activePhotoFilters.add(v.trim()); });

  const data = params.get("data");
  if (data) data.split(",").forEach((v) => { if (v.trim()) activeDataFilters.add(v.trim()); });

  if (params.get("fav") === "1") {
    showFavoritesOnly = true;
    const btn = document.getElementById("wiki-favorites-toggle");
    btn.classList.add("active");
    btn.setAttribute("aria-pressed", "true");
    updateFavoritesToggleText();
  }
})();

renderWikiGrid(wikiSearch.value);
renderFilterPanel();
updateFilterBtnState();
updateClearFiltersVisibility();

// Open modal directly if species is specified in the URL (deep link / bookmark)
const initParams = new URLSearchParams(window.location.search);
const initSpeciesId = initParams.get("species");
if (initSpeciesId) {
  const initSpecies = WIKI_DATA.items.find((s) => s.id === initSpeciesId);
  if (initSpecies) {
    suppressHistoryUpdate = true;
    openSpeciesModal(initSpecies, null, initParams.get("tab") || "overview"); // always fade in on deep link (card not visually established yet)
    suppressHistoryUpdate = false;
  }
}

// Restore compare state from URL
const initCompareIds = initParams.get("compare");
if (initCompareIds) {
  const ids = initCompareIds.split(",").filter((id) => WIKI_DATA.items.find((s) => s.id === id));
  if (ids.length >= 1) {
    ids.forEach((id) => compareSelected.add(id));
    enterCompareMode(true);
    // Mark already-selected cards
    ids.forEach((id) => {
      const card = document.querySelector(`[data-species-id="${id}"]`);
      if (card) card.classList.add("compare-selected");
      const starBtn = card && card.querySelector(".species-card-star");
      if (starBtn) starBtn.classList.add("selected");
    });
    if (initParams.get("compareOpen") === "1" && ids.length >= 2) {
      openComparePanel();
    }
  }
}

// Restore manage favorites state from URL
if (initParams.get("manageFavs") === "1") {
  const selectedParam = initParams.get("manageFavsSelected");
  if (selectedParam) {
    const favIds = loadFavorites();
    selectedParam.split(",").filter((id) => favIds.includes(id)).forEach((id) => manageFavoritesSelected.add(id));
  }
  enterManageFavoritesMode(true);
}

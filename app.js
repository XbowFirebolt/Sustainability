console.log("Sustainability Tracker running");

// Project catalog
const PROJECT_CATALOG = [
  { id: "reforestation", name: "Reforestation Initiative", description: "Restore native forests and wildlife corridors by planting millions of trees in deforested regions.", color: "#2d6a2d", emoji: "🌳" },
  { id: "ocean-cleanup", name: "Ocean Cleanup Project", description: "Deploy floating barriers and river interceptors to remove plastic waste from the world's oceans.", color: "#1a6080", emoji: "🌊" },
  { id: "urban-solar", name: "Urban Solar Grid", description: "Equip city rooftops and public infrastructure with solar panels to accelerate the clean energy transition.", color: "#b07a10", emoji: "☀️" },
  { id: "coral-restore", name: "Coral Reef Restoration", description: "Grow and transplant heat-resistant coral fragments to rebuild damaged reef ecosystems.", color: "#c0440a", emoji: "🪸" },
  { id: "food-waste", name: "Food Waste Reduction", description: "Partner with grocers and restaurants to redirect surplus food to communities in need.", color: "#7a5a1a", emoji: "♻️" },
  { id: "clean-water", name: "Clean Water Access", description: "Install filtration systems and wells in regions lacking safe drinking water.", color: "#2060a0", emoji: "💧" },
  { id: "rewilding", name: "Rewilding Project", description: "Reintroduce keystone species and remove invasive plants to restore natural ecosystem balance.", color: "#4a7a2a", emoji: "🐺" },
  { id: "urban-green", name: "Urban Green Spaces", description: "Transform vacant lots and rooftops into community gardens and pocket parks.", color: "#3a7a3a", emoji: "🌿" },
];

// Account data
const DEFAULT_ACCOUNT = {
  username: "eco_user",
  email: "eco@example.com",
  password: "mypassword123",
  favoriteProjects: [
    "Reforestation Initiative",
    "Ocean Cleanup Project",
    "Urban Solar Grid",
  ],
};

function loadAccount() {
  const stored = localStorage.getItem("account");
  if (stored) return JSON.parse(stored);
  localStorage.setItem("account", JSON.stringify(DEFAULT_ACCOUNT));
  return DEFAULT_ACCOUNT;
}

function saveAccount(account) {
  localStorage.setItem("account", JSON.stringify(account));
}

function populateModal(account) {
  document.getElementById("account-username").textContent = account.username;
  document.getElementById("account-email").textContent = account.email;
  const projectsList = document.getElementById("account-projects");
  projectsList.innerHTML = "";
  account.favoriteProjects.forEach((project) => {
    const li = document.createElement("li");
    li.textContent = project;
    projectsList.appendChild(li);
  });
}

// Modal open/close
const modal = document.getElementById("account-modal");
const accountBtn = document.getElementById("account-btn");
const closeBtn = document.getElementById("close-modal");

accountBtn.addEventListener("click", () => {
  const account = loadAccount();
  populateModal(account);
  modal.classList.remove("hidden");
});

closeBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
});

modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.classList.add("hidden");
});

// Project Dock (infinite wheel)
const DOCK_WINDOW_HALF = 2;
let dockActiveIndex = 0;
let dockAnimating = false;

function shortenProjectName(name) {
  const words = name.trim().split(/\s+/);
  return words.slice(0, 2).join(" ");
}

function getDockDistanceClass(distance) {
  if (distance === 0) return "";
  if (distance === 1) return "dock-item--d1";
  if (distance === 2) return "dock-item--d2";
  return "dock-item--d3";
}

// Render a window of 2*DOCK_WINDOW_HALF+1 items centered on dockActiveIndex
function renderDockWindow(projects, trackEl) {
  trackEl.innerHTML = "";
  const n = projects.length;
  const itemEls = [];
  for (let offset = -DOCK_WINDOW_HALF; offset <= DOCK_WINDOW_HALF; offset++) {
    const projectIdx = ((dockActiveIndex + offset) % n + n) % n;
    const btn = document.createElement("button");
    btn.className = "dock-item";
    const distance = Math.abs(offset);
    const cls = getDockDistanceClass(distance);
    if (cls) btn.classList.add(cls);
    btn.textContent = shortenProjectName(projects[projectIdx]);
    btn.setAttribute("aria-label", projects[projectIdx]);
    btn.setAttribute("aria-current", offset === 0 ? "page" : "false");
    btn.dataset.offset = offset;
    trackEl.appendChild(btn);
    itemEls.push(btn);
  }
  return itemEls;
}

// Compute translateX to center the item at itemEls[itemIndex]
function computeTranslateToItem(itemEls, itemIndex) {
  let offset = 0;
  for (let i = 0; i < itemIndex; i++) {
    offset += itemEls[i].getBoundingClientRect().width;
  }
  offset += itemEls[itemIndex].getBoundingClientRect().width / 2;
  return -offset;
}

function attachDockClickHandlers(itemEls, projects, trackEl) {
  itemEls.forEach((btn) => {
    const offset = parseInt(btn.dataset.offset, 10);
    if (offset === 0) return;
    btn.addEventListener("click", () => {
      if (dockAnimating) return;
      dockAnimating = true;

      const direction = Math.sign(offset);
      const absOffset = Math.abs(offset);
      const n = projects.length;

      // Pre-add the item(s) about to slide in from the leading edge so they
      // move with the track instead of appearing abruptly after re-render.
      const extraBtns = [];
      for (let k = 1; k <= absOffset; k++) {
        const leadingOffset = direction * (DOCK_WINDOW_HALF + k);
        const projectIdx = ((dockActiveIndex + leadingOffset) % n + n) % n;
        const extra = document.createElement("button");
        extra.className = "dock-item";
        const dist = k + DOCK_WINDOW_HALF - absOffset; // distance from new center after slide
        const cls = getDockDistanceClass(dist);
        if (cls) extra.classList.add(cls);
        extra.textContent = shortenProjectName(projects[projectIdx]);
        extra.setAttribute("aria-label", projects[projectIdx]);
        extra.setAttribute("aria-current", "false");
        extra.dataset.offset = String(leadingOffset);
        extraBtns.push(extra);
      }

      let adjustedItemEls;
      if (direction > 0) {
        extraBtns.forEach(e => trackEl.appendChild(e));
        adjustedItemEls = [...itemEls, ...extraBtns];
      } else {
        // Prepend in reverse order so the closest-to-center item is last (rightmost of the prepended group)
        const toPrepend = [...extraBtns].reverse();
        toPrepend.forEach(e => trackEl.insertBefore(e, trackEl.firstChild));
        adjustedItemEls = [...toPrepend, ...itemEls];

        // Prepending shifts all existing items right — compensate immediately so nothing jumps
        trackEl.style.transition = "none";
        const extraWidth = toPrepend.reduce((sum, e) => sum + e.getBoundingClientRect().width, 0);
        const cur = parseFloat(trackEl.style.transform.match(/translateX\((-?[\d.]+)px\)/)?.[1] ?? "0");
        trackEl.style.transform = `translateX(${cur - extraWidth}px)`;
        trackEl.getBoundingClientRect(); // force reflow before re-enabling transition
        trackEl.style.transition = "";
      }

      // Compute what class each item will have in its final state.
      // Trailing items (newDist > DOCK_WINDOW_HALF) slide off-screen; skip them.
      const distClassNames = ["dock-item--d1", "dock-item--d2", "dock-item--d3"];
      const finalClassData = adjustedItemEls.map((el) => {
        const elOffset = parseInt(el.dataset.offset, 10);
        const newDist = Math.abs(elOffset - offset);
        if (newDist > DOCK_WINDOW_HALF) return null;
        return { newDist, newCls: getDockDistanceClass(newDist) };
      });

      // Save each item's current distance classes so we can restore them after measuring.
      const savedClasses = adjustedItemEls.map(el =>
        distClassNames.filter(c => el.classList.contains(c))
      );

      // Apply final classes without transition to measure the target widths accurately.
      // Items change font-size between distance classes, so using pre-animation widths
      // would cause the track to land in the wrong spot and snap on re-render.
      adjustedItemEls.forEach(el => { el.style.transition = "none"; });
      adjustedItemEls.forEach((el, i) => {
        if (finalClassData[i] === null) return;
        el.classList.remove(...distClassNames);
        if (finalClassData[i].newCls) el.classList.add(finalClassData[i].newCls);
      });
      trackEl.getBoundingClientRect(); // force reflow so widths reflect final classes

      const targetIndex = adjustedItemEls.indexOf(btn);
      const targetTranslate = computeTranslateToItem(adjustedItemEls, targetIndex);

      // Restore original classes before starting the visible animation.
      adjustedItemEls.forEach((el, i) => {
        el.classList.remove(...distClassNames);
        savedClasses[i].forEach(c => el.classList.add(c));
      });

      // Re-enable transitions; force reflow so the browser registers the from-state.
      adjustedItemEls.forEach(el => { el.style.transition = ""; });
      trackEl.getBoundingClientRect();

      // Apply final classes — items animate smoothly from old to new.
      adjustedItemEls.forEach((el, i) => {
        if (finalClassData[i] === null) return;
        el.classList.remove(...distClassNames);
        if (finalClassData[i].newCls) el.classList.add(finalClassData[i].newCls);
        el.setAttribute("aria-current", finalClassData[i].newDist === 0 ? "page" : "false");
      });

      // Slide the track to the final position (computed with final widths, so no snap on re-render).
      trackEl.style.transform = `translateX(${targetTranslate}px)`;

      // Wait for the track's own transform transition only.
      // transitionend bubbles from child elements too, so filter by target and property
      // to avoid a premature re-render triggered by an item's font-size/opacity transition.
      function onTrackTransitionEnd(e) {
        if (e.target !== trackEl || e.propertyName !== "transform") return;
        trackEl.removeEventListener("transitionend", onTrackTransitionEnd);

        dockActiveIndex = ((dockActiveIndex + offset) % n + n) % n;

        // Silent re-render with new active at center
        trackEl.style.transition = "none";
        const newItemEls = renderDockWindow(projects, trackEl);
        requestAnimationFrame(() => {
          trackEl.style.transform = `translateX(${computeTranslateToItem(newItemEls, DOCK_WINDOW_HALF)}px)`;
          requestAnimationFrame(() => {
            trackEl.style.transition = "";
            dockAnimating = false;
            attachDockClickHandlers(newItemEls, projects, trackEl);
          });
        });
      }
      trackEl.addEventListener("transitionend", onTrackTransitionEnd);
    });
  });
}

function buildDock(projects) {
  const dockEl = document.getElementById("project-dock");
  const trackEl = document.getElementById("dock-track");

  if (!projects || projects.length === 0) {
    dockEl.classList.add("dock--hidden");
    return;
  }
  dockEl.classList.remove("dock--hidden");

  const halfDock = dockEl.getBoundingClientRect().width / 2;
  trackEl.style.paddingLeft = `${halfDock}px`;
  trackEl.style.paddingRight = `${halfDock}px`;

  dockActiveIndex = 0;
  const itemEls = renderDockWindow(projects, trackEl);

  // Initial position without animation
  trackEl.style.transition = "none";
  requestAnimationFrame(() => {
    trackEl.style.transform = `translateX(${computeTranslateToItem(itemEls, DOCK_WINDOW_HALF)}px)`;
    requestAnimationFrame(() => {
      trackEl.style.transition = "";
      attachDockClickHandlers(itemEls, projects, trackEl);
    });
  });
}

(function initDock() {
  const account = loadAccount();
  buildDock(account.favoriteProjects);
})();

// Discover panel
const discoverOverlay = document.getElementById("discover-overlay");
const discoverBtn = document.getElementById("discover-btn");
const discoverClose = document.getElementById("discover-close");
const discoverSearch = document.getElementById("discover-search");
const discoverGrid = document.getElementById("discover-grid");

function renderDiscoverGrid(query) {
  const account = loadAccount();
  const q = query.trim().toLowerCase();
  const filtered = q
    ? PROJECT_CATALOG.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      )
    : PROJECT_CATALOG;

  discoverGrid.innerHTML = "";

  if (filtered.length === 0) {
    const empty = document.createElement("p");
    empty.className = "discover-empty";
    empty.textContent = "No projects match your search.";
    discoverGrid.appendChild(empty);
    return;
  }

  filtered.forEach((project) => {
    const isFav = account.favoriteProjects.includes(project.name);

    const card = document.createElement("div");
    card.className = "project-card";

    const imgArea = document.createElement("div");
    imgArea.className = "project-card-image";
    imgArea.style.backgroundColor = project.color;
    imgArea.textContent = project.emoji;

    const starBtn = document.createElement("button");
    starBtn.className = "project-card-star" + (isFav ? " favorited" : "");
    starBtn.textContent = isFav ? "★" : "☆";
    starBtn.setAttribute(
      "aria-label",
      isFav ? `Unfavorite ${project.name}` : `Favorite ${project.name}`
    );
    starBtn.addEventListener("click", () => {
      const acc = loadAccount();
      const idx = acc.favoriteProjects.indexOf(project.name);
      if (idx === -1) {
        acc.favoriteProjects.push(project.name);
      } else {
        acc.favoriteProjects.splice(idx, 1);
      }
      saveAccount(acc);
      buildDock(acc.favoriteProjects);
      const nowFav = acc.favoriteProjects.includes(project.name);
      starBtn.textContent = nowFav ? "★" : "☆";
      starBtn.className = "project-card-star" + (nowFav ? " favorited" : "");
      starBtn.setAttribute(
        "aria-label",
        nowFav ? `Unfavorite ${project.name}` : `Favorite ${project.name}`
      );
    });

    imgArea.appendChild(starBtn);

    const body = document.createElement("div");
    body.className = "project-card-body";

    const name = document.createElement("div");
    name.className = "project-card-name";
    name.textContent = project.name;

    const desc = document.createElement("div");
    desc.className = "project-card-desc";
    desc.textContent = project.description;

    body.appendChild(name);
    body.appendChild(desc);
    card.appendChild(imgArea);
    card.appendChild(body);
    discoverGrid.appendChild(card);
  });
}

discoverBtn.addEventListener("click", () => {
  discoverSearch.value = "";
  renderDiscoverGrid("");
  discoverOverlay.classList.remove("hidden");
  discoverSearch.focus();
});

discoverClose.addEventListener("click", () => {
  discoverOverlay.classList.add("hidden");
});

discoverOverlay.addEventListener("click", (e) => {
  if (e.target === discoverOverlay) discoverOverlay.classList.add("hidden");
});

discoverSearch.addEventListener("input", () => {
  renderDiscoverGrid(discoverSearch.value);
});

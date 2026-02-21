// Project catalog
const PROJECT_CATALOG = [
  { id: "reforestation", name: "Reforestation Initiative", description: "Restore native forests and wildlife corridors by planting millions of trees in deforested regions.", color: "#2d6a2d", emoji: "🌳", map: "map.png" },
  { id: "ocean-cleanup", name: "Ocean Cleanup Project", description: "Deploy floating barriers and river interceptors to remove plastic waste from the world's oceans.", color: "#1a6080", emoji: "🌊", map: "map.png" },
  { id: "urban-solar", name: "Urban Solar Grid", description: "Equip city rooftops and public infrastructure with solar panels to accelerate the clean energy transition.", color: "#b07a10", emoji: "☀️", map: "map.png" },
  { id: "coral-restore", name: "Coral Reef Restoration", description: "Grow and transplant heat-resistant coral fragments to rebuild damaged reef ecosystems.", color: "#c0440a", emoji: "🪸", map: "map.png" },
  { id: "food-waste", name: "Food Waste Reduction", description: "Partner with grocers and restaurants to redirect surplus food to communities in need.", color: "#7a5a1a", emoji: "♻️", map: "map.png" },
  { id: "clean-water", name: "Clean Water Access", description: "Install filtration systems and wells in regions lacking safe drinking water.", color: "#2060a0", emoji: "💧", map: "map.png" },
  { id: "rewilding", name: "Rewilding Project", description: "Reintroduce keystone species and remove invasive plants to restore natural ecosystem balance.", color: "#4a7a2a", emoji: "🐺", map: "map.png" },
  { id: "urban-green", name: "Urban Green Spaces", description: "Transform vacant lots and rooftops into community gardens and pocket parks.", color: "#3a7a3a", emoji: "🌿", map: "map.png" },
];

// Theme utilities
function hexToHsl(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function applyProjectTheme(project) {
  if (!project) return;
  localStorage.setItem("activeProject", project.name);
  const [h, s] = hexToHsl(project.color);
  const pr = parseInt(project.color.slice(1, 3), 16);
  const pg = parseInt(project.color.slice(3, 5), 16);
  const pb = parseInt(project.color.slice(5, 7), 16);
  const sat = Math.min(s, 25);
  const root = document.documentElement;
  root.style.setProperty("--color-primary",      project.color);
  root.style.setProperty("--color-primary-rgb",  `${pr}, ${pg}, ${pb}`);
  root.style.setProperty("--color-bg",           `hsl(${h}, ${sat}%, 96%)`);
  root.style.setProperty("--color-text",         `hsl(${h}, ${Math.min(s, 30)}%, 12%)`);
  root.style.setProperty("--color-text-muted",   `hsl(${h}, ${sat}%, 42%)`);
  root.style.setProperty("--color-text-dim",     `hsl(${h}, ${sat}%, 37%)`);
  root.style.setProperty("--color-border",       `hsl(${h}, ${sat}%, 88%)`);
  root.style.setProperty("--color-input-border", `hsl(${h}, ${Math.min(s, 35)}%, 76%)`);
  if (!document.body.classList.contains("no-map")) {
    document.body.style.backgroundImage = `url('./${project.map}')`;
  }
}

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

// Account modal
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

      const newActiveIdx = ((dockActiveIndex + offset) % n + n) % n;
      applyProjectTheme(PROJECT_CATALOG.find(p => p.name === projects[newActiveIdx]));

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

  if (!dockEl || !trackEl) return;

  if (!projects || projects.length === 0) {
    dockEl.classList.add("dock--hidden");
    return;
  }
  dockEl.classList.remove("dock--hidden");

  const halfDock = dockEl.getBoundingClientRect().width / 2;
  trackEl.style.paddingLeft = `${halfDock}px`;
  trackEl.style.paddingRight = `${halfDock}px`;

  const savedName = localStorage.getItem("activeProject");
  const savedIdx = savedName ? projects.indexOf(savedName) : -1;
  dockActiveIndex = savedIdx !== -1 ? savedIdx : 0;
  applyProjectTheme(PROJECT_CATALOG.find(p => p.name === projects[dockActiveIndex]));
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

function initPage() {
  dockAnimating = false;
  const account = loadAccount();
  buildDock(account.favoriteProjects);

  if (!document.getElementById("project-dock")) {
    const savedName = localStorage.getItem("activeProject");
    const project = savedName && PROJECT_CATALOG.find(p => p.name === savedName);
    if (project) applyProjectTheme(project);
  }
}

initPage();

window.addEventListener("pageshow", (e) => {
  if (e.persisted) initPage();
});

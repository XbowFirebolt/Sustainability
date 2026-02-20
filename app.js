console.log("Sustainability Tracker running");

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
  itemEls.forEach((btn, i) => {
    const offset = parseInt(btn.dataset.offset, 10);
    if (offset === 0) return;
    btn.addEventListener("click", () => {
      if (dockAnimating) return;
      dockAnimating = true;

      // Animate track to center the clicked item
      trackEl.style.transform = `translateX(${computeTranslateToItem(itemEls, i)}px)`;

      trackEl.addEventListener("transitionend", () => {
        const n = projects.length;
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
      }, { once: true });
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

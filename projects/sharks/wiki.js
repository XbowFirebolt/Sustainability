const SHARK_SPECIES = [
  {
    id: "great-white",
    commonName: "Great White Shark",
    scientificName: "Carcharodon carcharias",
    statusLabel: "Vulnerable",
    lifePercent: 55,
    photo: null, // future: "images/great-white.jpg"
    funFact: "Great white sharks can detect a single drop of blood diluted across 25 gallons of water, and sense the faint electrical fields produced by beating hearts.",
  },
  {
    id: "scalloped-hammerhead",
    commonName: "Scalloped Hammerhead",
    scientificName: "Sphyrna lewini",
    statusLabel: "Critically Endangered",
    lifePercent: 18,
    photo: null,
    funFact: "Their wide-set eyes grant 360° vertical vision — they can see directly above and below simultaneously, giving them an almost complete view of their surroundings.",
  },
  {
    id: "whale-shark",
    commonName: "Whale Shark",
    scientificName: "Rhincodon typus",
    statusLabel: "Endangered",
    lifePercent: 38,
    photo: null,
    funFact: "The world's largest fish — up to 40 feet long — the whale shark feeds entirely on plankton and small fish, filtering thousands of gallons of water each hour.",
  },
  {
    id: "bull-shark",
    commonName: "Bull Shark",
    scientificName: "Carcharhinus leucas",
    statusLabel: "Near Threatened",
    lifePercent: 72,
    photo: null,
    funFact: "Bull sharks can survive in both salt and fresh water, and have been found more than 2,500 miles up the Amazon River — far from any ocean.",
  },
  {
    id: "tiger-shark",
    commonName: "Tiger Shark",
    scientificName: "Galeocerdo cuvier",
    statusLabel: "Near Threatened",
    lifePercent: 68,
    photo: null,
    funFact: "Tiger sharks have serrated, cockscomb-shaped teeth that can cut through sea turtle shells — one of the only predators capable of cracking that armor.",
  },
];

function getLifeBarColor(percent) {
  if (percent <= 25) return "#c0320a";
  if (percent <= 45) return "#c07a10";
  if (percent <= 65) return "#b0a010";
  if (percent <= 80) return "#5a8a2a";
  return "#2d6a2d";
}

function loadNotifications() {
  return JSON.parse(localStorage.getItem("sharkNotifications") || "[]");
}

function saveNotifications(ids) {
  localStorage.setItem("sharkNotifications", JSON.stringify(ids));
}

function renderWikiGrid(query) {
  const grid = document.getElementById("wiki-grid");
  const q = query ? query.trim().toLowerCase() : "";
  const filtered = q
    ? SHARK_SPECIES.filter(
        (s) =>
          s.commonName.toLowerCase().includes(q) ||
          s.scientificName.toLowerCase().includes(q) ||
          s.statusLabel.toLowerCase().includes(q)
      )
    : SHARK_SPECIES;

  grid.innerHTML = "";

  if (filtered.length === 0) {
    const empty = document.createElement("p");
    empty.className = "discover-empty";
    empty.textContent = "No species match your search.";
    grid.appendChild(empty);
    return;
  }

  filtered.forEach((species) => {
    const isNotified = loadNotifications().includes(species.id);

    const card = document.createElement("div");
    card.className = "species-card";

    // Image area
    const imgArea = document.createElement("div");
    imgArea.className = "species-card-image";
    if (species.photo) {
      imgArea.style.backgroundImage = `url(${species.photo})`;
      imgArea.style.backgroundSize = "cover";
      imgArea.style.backgroundPosition = "center";
    } else {
      imgArea.textContent = "🦈";
      imgArea.style.background = "linear-gradient(135deg, #0a1525, #1a3a6a)";
    }

    // Notification bell button
    const bellBtn = document.createElement("button");
    bellBtn.className = "species-card-notify" + (isNotified ? " notified" : "");
    bellBtn.textContent = "🔔";
    bellBtn.setAttribute(
      "aria-label",
      isNotified ? `Unsubscribe from ${species.commonName}` : `Subscribe to ${species.commonName}`
    );
    bellBtn.addEventListener("click", () => {
      const ids = loadNotifications();
      const idx = ids.indexOf(species.id);
      if (idx === -1) {
        ids.push(species.id);
      } else {
        ids.splice(idx, 1);
      }
      saveNotifications(ids);
      renderWikiGrid(wikiSearch.value);
    });
    imgArea.appendChild(bellBtn);

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

// Force shark project theme on this page
const sharkProject = PROJECT_CATALOG.find((p) => p.id === "shark-populations");
applyProjectTheme(sharkProject);

const wikiSearch = document.getElementById("wiki-search");
wikiSearch.addEventListener("input", () => renderWikiGrid(wikiSearch.value));

renderWikiGrid("");

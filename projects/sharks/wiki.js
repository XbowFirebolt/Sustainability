const SHARK_SPECIES = [
  {
    id: "great-white",
    commonName: "Great White Shark",
    scientificName: "Carcharodon carcharias",
    statusLabel: "Vulnerable",
    lifePercent: 55,
    photo: null,
    funFact: "Great white sharks can detect a single drop of blood diluted across 25 gallons of water, and sense the faint electrical fields produced by beating hearts.",
    description: "The great white shark is the world's largest predatory fish, found in cool coastal and offshore waters across the globe. Despite their fearsome reputation, attacks on humans are rare and typically cases of mistaken identity — they strongly prefer fat-rich marine mammals over people.",
    habitat: "Cool coastal and offshore waters globally; common off South Africa, Australia, and California",
    diet: "Marine mammals (seals, sea lions), large fish, rays, and occasionally sea turtles",
    size: "Up to 6 m (20 ft); females larger than males",
    threats: "Bycatch in commercial fisheries, targeted poaching for jaws and fins, habitat degradation, and prey depletion",
  },
  {
    id: "scalloped-hammerhead",
    commonName: "Scalloped Hammerhead",
    scientificName: "Sphyrna lewini",
    statusLabel: "Critically Endangered",
    lifePercent: 18,
    photo: null,
    funFact: "Their wide-set eyes grant 360° vertical vision — they can see directly above and below simultaneously, giving them an almost complete view of their surroundings.",
    description: "Named for the scalloped front edge of its distinctive hammer-shaped head (cephalofoil), this species aggregates in huge schools during the day — a rare social behavior among sharks. Their populations have collapsed by over 80% in recent decades, driven almost entirely by the fin trade.",
    habitat: "Tropical and warm temperate seas worldwide; coastal, estuarine, and semi-oceanic",
    diet: "Fish, squid, octopus, and crustaceans",
    size: "Up to 4.3 m (14 ft)",
    threats: "Highly prized fins in the shark fin trade, bycatch in tuna and swordfish longline fisheries, coastal habitat loss",
  },
  {
    id: "whale-shark",
    commonName: "Whale Shark",
    scientificName: "Rhincodon typus",
    statusLabel: "Endangered",
    lifePercent: 38,
    photo: null,
    funFact: "The world's largest fish — up to 40 feet long — the whale shark feeds entirely on plankton and small fish, filtering thousands of gallons of water each hour.",
    description: "The whale shark is a slow-moving filter feeder and the largest known fish species on Earth. Each individual has a unique pattern of spots and stripes — like a fingerprint — which researchers use to identify and track them across ocean basins. They are known to peacefully interact with divers.",
    habitat: "Tropical and warm temperate seas worldwide; open ocean and productive coastal areas, especially near upwelling zones",
    diet: "Plankton, fish eggs, krill, small fish, and squid",
    size: "Up to 12 m (40 ft); possibly larger",
    threats: "Ship strikes, entanglement in fishing gear, tourism pressure, plastic ingestion, and climate-driven changes to plankton availability",
  },
  {
    id: "bull-shark",
    commonName: "Bull Shark",
    scientificName: "Carcharhinus leucas",
    statusLabel: "Near Threatened",
    lifePercent: 72,
    photo: null,
    funFact: "Bull sharks can survive in both salt and fresh water, and have been found more than 2,500 miles up the Amazon River — far from any ocean.",
    description: "Bull sharks are among the most adaptable sharks on Earth, capable of osmoregulating between salt and fresh water. This brings them into frequent contact with humans in rivers and shallow coastal bays. They are considered one of the most dangerous sharks, not because they target people, but because of this habitat overlap.",
    habitat: "Tropical and subtropical coastal waters, river mouths, estuaries, and freshwater river systems worldwide",
    diet: "Fish, rays, sea turtles, dolphins, birds, and other sharks",
    size: "Up to 3.4 m (11 ft); females larger",
    threats: "Targeted fishing for meat and fins, habitat loss in river systems from dams and pollution, water quality degradation",
  },
  {
    id: "tiger-shark",
    commonName: "Tiger Shark",
    scientificName: "Galeocerdo cuvier",
    statusLabel: "Near Threatened",
    lifePercent: 68,
    photo: null,
    funFact: "Tiger sharks have serrated, cockscomb-shaped teeth that can cut through sea turtle shells — one of the only predators capable of cracking that armor.",
    description: "Tiger sharks are apex predators and critically important for maintaining the health of seagrass meadows and coral reef ecosystems. By preying on sea turtles, they prevent overgrazing of seagrass beds. They are notably indiscriminate feeders — their stomachs have been found to contain license plates, tires, and boat parts.",
    habitat: "Tropical and subtropical waters worldwide; coastal, reef, and open ocean environments",
    diet: "Sea turtles, fish, marine mammals, seabirds, rays, and almost any other prey item",
    size: "Up to 5.5 m (18 ft)",
    threats: "Targeted fishing for fins and liver oil, bycatch, and lethal culling programs in Australia and Hawaii",
  },
];

function getLifeBarColor(percent) {
  if (percent <= 25) return "#c0320a";
  if (percent <= 45) return "#c07a10";
  if (percent <= 65) return "#b0a010";
  if (percent <= 80) return "#5a8a2a";
  return "#2d6a2d";
}

function loadFavorites() {
  return JSON.parse(localStorage.getItem("sharkFavorites") || "[]");
}

function saveFavorites(ids) {
  localStorage.setItem("sharkFavorites", JSON.stringify(ids));
}

// Species detail modal
const speciesModal = document.getElementById("species-modal");
let activeCard = null;

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
    imgArea.style.background = "linear-gradient(135deg, #0a1525, #1a3a6a)";
    document.getElementById("species-modal-emoji").style.display = "";
  }

  document.getElementById("species-modal-name").textContent = species.commonName;
  document.getElementById("species-modal-sci").textContent = species.scientificName;

  const fill = document.getElementById("species-modal-fill");
  fill.style.width = `${species.lifePercent}%`;
  fill.style.background = getLifeBarColor(species.lifePercent);
  document.getElementById("species-modal-status").textContent = species.statusLabel;

  document.getElementById("species-modal-desc").textContent = species.description;
  document.getElementById("species-modal-habitat").textContent = species.habitat;
  document.getElementById("species-modal-diet").textContent = species.diet;
  document.getElementById("species-modal-size").textContent = species.size;
  document.getElementById("species-modal-threats").textContent = species.threats;
  document.getElementById("species-modal-funfact").textContent = species.funFact;

  const modalContent = speciesModal.querySelector('.species-modal');
  const cardRect = cardEl.getBoundingClientRect();

  // Disable transition and show overlay (starts its opacity fade)
  modalContent.style.transition = 'none';
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
  modalContent.style.transition = '';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      modalContent.style.transform = '';
    });
  });
}

function closeSpeciesModal() {
  const modalContent = speciesModal.querySelector('.species-modal');

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
      modalContent.style.transform = '';
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
      imgArea.textContent = "🦈";
      imgArea.style.background = "linear-gradient(135deg, #0a1525, #1a3a6a)";
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

// Force shark project theme on this page
const sharkProject = PROJECT_CATALOG.find((p) => p.id === "shark-populations");
applyProjectTheme(sharkProject);

const wikiSearch = document.getElementById("wiki-search");
wikiSearch.addEventListener("input", () => renderWikiGrid(wikiSearch.value));

renderWikiGrid("");

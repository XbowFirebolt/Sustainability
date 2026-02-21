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

  const sorted = [
    ...filtered.filter(p => account.favoriteProjects.includes(p.name)),
    ...filtered.filter(p => !account.favoriteProjects.includes(p.name)),
  ];

  discoverGrid.innerHTML = "";

  if (sorted.length === 0) {
    const empty = document.createElement("p");
    empty.className = "discover-empty";
    empty.textContent = "No projects match your search.";
    discoverGrid.appendChild(empty);
    return;
  }

  sorted.forEach((project) => {
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
      renderDiscoverGrid(discoverSearch.value);
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

discoverSearch.addEventListener("input", () => {
  renderDiscoverGrid(discoverSearch.value);
});

renderDiscoverGrid("");

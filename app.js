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

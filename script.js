
let projects = [];
let selectedCategory = "All";

const STORAGE_KEY = "oscSavedRepositories";

let savedProjects = [];

try {
    savedProjects = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    if (!Array.isArray(savedProjects)) {
        savedProjects = [];
    }
} catch {
    savedProjects = [];
}

// HTML elements
const projectGrid = document.getElementById("projectGrid");
const savedGrid = document.getElementById("savedGrid");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter-btn");

const issueGrid = document.getElementById("issueGrid");
const issueLanguage = document.getElementById("issueLanguage");
const findIssuesBtn = document.getElementById("findIssuesBtn");
const issueStatus = document.getElementById("issueStatus");

const projectModal = document.getElementById("projectModal");
const closeModalButton = document.getElementById("closeModal");

// ---------------- SECURITY HELPER ----------------

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

// ---------------- PROJECT SEARCH ----------------

function createCard(repo) {
    const isSaved = savedProjects.some(item => item.id === repo.id);

    const name = escapeHTML(repo.full_name);
    const description = escapeHTML(
        repo.description || "No description available."
    );
    const language = escapeHTML(repo.language || "Not specified");
    const stars = Number(repo.stargazers_count || 0).toLocaleString();

    return `
        <div class="project-card">
            <span class="category">${language}</span>

            <h3>${name}</h3>
            <p>${description}</p>
            <p><strong>⭐ Stars:</strong> ${stars}</p>

            <div class="card-actions">
                <button class="primary-btn"
                    onclick="openProjectDetails(${Number(repo.id)})">
                    View Details →
                </button>

                <button class="save-btn"
                    onclick="toggleSave(${Number(repo.id)})">
                    ${isSaved ? "♥ Saved" : "♡ Save"}
                </button>
            </div>
        </div>
    `;
}

function displayProjects() {
    projectGrid.innerHTML = projects.length
        ? projects.map(createCard).join("")
        : '<p class="empty-message">No projects found.</p>';

    displaySavedProjects();
}

function displaySavedProjects() {
    savedGrid.innerHTML = savedProjects.length
        ? savedProjects.map(createCard).join("")
        : '<p class="empty-message">You have not saved any projects yet.</p>';
}

function toggleSave(id) {
    const alreadySaved = savedProjects.some(repo => repo.id === id);

    if (alreadySaved) {
        savedProjects = savedProjects.filter(repo => repo.id !== id);
    } else {
        const repo = projects.find(item => item.id === id);

        if (repo) {
            savedProjects.push(repo);
        }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedProjects));

    displayProjects();
}

async function fetchProjects() {
    projectGrid.innerHTML =
        '<p class="empty-message">Loading projects from GitHub...</p>';

    const searchText = searchInput.value.trim();
    const queryParts = [];

    if (searchText) {
        queryParts.push(searchText);
    }

    if (selectedCategory === "Python") {
        queryParts.push("language:Python");
    } else if (selectedCategory === "Java") {
        queryParts.push("language:Java");
    } else if (selectedCategory === "Web") {
        queryParts.push("language:JavaScript");
    }

    if (queryParts.length === 0) {
        queryParts.push("stars:>0");
    }

    queryParts.push("fork:false");

    const query = queryParts.join(" ");

    const apiURL =
        `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=12`;

    try {
        const response = await fetch(apiURL, {
            headers: {
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28"
            }
        });

        if (!response.ok) {
            throw new Error(
                response.status === 403 || response.status === 429
                    ? "GitHub search limit reached. Please wait and try again."
                    : "Unable to fetch GitHub projects."
            );
        }

        const data = await response.json();

        projects = data.items || [];

        displayProjects();

    } catch (error) {
        projectGrid.innerHTML =
            `<p class="empty-message">${escapeHTML(error.message)}</p>`;
    }
}

searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        fetchProjects();
    }
});

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        filterButtons.forEach(btn => btn.classList.remove("active"));

        button.classList.add("active");

        selectedCategory = button.dataset.category;

        fetchProjects();
    });
});

// ---------------- BEGINNER ISSUE FINDER ----------------

function createIssueCard(issue) {
    const title = escapeHTML(issue.title);

    const repoName = escapeHTML(
        issue.repository_url.split("/").slice(-2).join("/")
    );

    const issueUrl = typeof issue.html_url === "string" &&
        issue.html_url.startsWith("https://github.com/")
        ? escapeHTML(issue.html_url)
        : "#";

    const labels = (issue.labels || [])
        .slice(0, 4)
        .map(label =>
            `<span class="issue-label">${escapeHTML(label.name)}</span>`
        )
        .join("");

    return `
        <div class="issue-card">
            <span class="category">Open Issue</span>

            <h3>${title}</h3>

            <p><strong>Repository:</strong> ${repoName}</p>
            <p><strong>Comments:</strong> ${Number(issue.comments || 0)}</p>

            <div>${labels}</div>

            <a href="${issueUrl}" target="_blank"
               rel="noopener noreferrer">View Issue →</a>
        </div>
    `;
}

async function fetchBeginnerIssues() {
    const language = issueLanguage.value;

    issueGrid.innerHTML = "";
    issueStatus.textContent =
        "Searching GitHub for beginner-friendly issues...";

    findIssuesBtn.disabled = true;
    findIssuesBtn.textContent = "Searching...";

    let query = 'label:"good first issue" is:issue is:open';

    if (language !== "All") {
        query += ` language:${language}`;
    }

    const apiURL =
        `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=12`;

    try {
        const response = await fetch(apiURL, {
            headers: {
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28"
            }
        });

        if (!response.ok) {
            throw new Error(
                response.status === 403 || response.status === 429
                    ? "GitHub search limit reached. Please wait and try again."
                    : "Unable to fetch beginner issues."
            );
        }

        const data = await response.json();

        const issues = (data.items || [])
            .filter(issue => !issue.pull_request);

        if (issues.length === 0) {
            issueStatus.textContent =
                "No matching issues found. Try another language.";
            return;
        }

        issueGrid.innerHTML = issues.map(createIssueCard).join("");

        issueStatus.textContent =
            `Found ${issues.length} beginner-friendly issues on GitHub.`;

    } catch (error) {
        issueStatus.textContent = error.message;
    } finally {
        findIssuesBtn.disabled = false;
        findIssuesBtn.textContent = "Find Issues";
    }
}

findIssuesBtn.addEventListener("click", fetchBeginnerIssues);

// ---------------- PROJECT DETAILS ----------------

function openProjectDetails(id) {
    const repo = [...projects, ...savedProjects]
        .find(item => item.id === id);

    if (!repo) {
        alert("Project information not found. Please search again.");
        return;
    }

    const repoURL = repo.html_url;

    if (!repoURL || !repoURL.startsWith("https://github.com/")) {
        alert("GitHub repository link is unavailable.");
        return;
    }

    const branch = encodeURIComponent(repo.default_branch || "main");

    document.getElementById("detailName").textContent =
        repo.full_name || "Project";

    document.getElementById("detailDescription").textContent =
        repo.description || "No description available.";

    document.getElementById("detailLanguage").textContent =
        repo.language || "Not specified";

    document.getElementById("detailStars").textContent =
        Number(repo.stargazers_count || 0).toLocaleString();

    document.getElementById("detailIssues").textContent =
        Number(repo.open_issues_count || 0).toLocaleString();

    document.getElementById("readmeLink").href =
        `${repoURL}/blob/${branch}/README.md`;

    document.getElementById("contributionLink").href =
        `${repoURL}/blob/${branch}/CONTRIBUTING.md`;

    document.getElementById("issuesLink").href =
        `${repoURL}/issues`;

    document.getElementById("pullRequestsLink").href =
        `${repoURL}/pulls`;

    document.getElementById("mainRepoLink").href = repoURL;

    projectModal.classList.add("show");
    projectModal.setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";
}

function closeProjectDetails() {
    projectModal.classList.remove("show");
    projectModal.setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";
}

closeModalButton.addEventListener("click", closeProjectDetails);

projectModal.addEventListener("click", event => {
    if (event.target === projectModal) {
        closeProjectDetails();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && projectModal.classList.contains("show")) {
        closeProjectDetails();
    }
});

// ---------------- INITIAL LOADING ----------------

fetchProjects();
displaySavedProjects();

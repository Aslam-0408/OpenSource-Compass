
let projects = [];
let selectedCategory = "All";

const STORAGE_KEY = "oscSavedRepositories";

let savedProjects = [];

try {
    savedProjects = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    if (!Array.isArray(savedProjects)) savedProjects = [];
} catch {
    savedProjects = [];
}

const projectGrid = document.getElementById("projectGrid");
const savedGrid = document.getElementById("savedGrid");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter-btn");

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function createCard(repo) {
    const isSaved = savedProjects.some(item => item.id === repo.id);

    const name = escapeHTML(repo.full_name);
    const description = escapeHTML(
        repo.description || "No description available."
    );
    const language = escapeHTML(repo.language || "Not specified");
    const stars = Number(repo.stargazers_count || 0).toLocaleString();

    const repoUrl = typeof repo.html_url === "string" &&
        repo.html_url.startsWith("https://github.com/")
        ? escapeHTML(repo.html_url)
        : "#";

    return `
        <div class="project-card">
            <span class="category">${language}</span>

            <h3>${name}</h3>

            <p>${description}</p>

            <p><strong>⭐ Stars:</strong> ${stars}</p>

            <div class="card-actions">
                <a href="${repoUrl}"
                   target="_blank"
                   rel="noopener noreferrer">
                    View Project →
                </a>

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

    let queryParts = [];

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

        if (response.status === 403 || response.status === 429) {
            throw new Error(
                "GitHub search limit reached. Please wait before searching again."
            );
        }

        if (!response.ok) {
            throw new Error("Unable to fetch GitHub projects.");
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

fetchProjects();

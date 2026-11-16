
const projects = [
    {
        id: 1,
        name: "First Contributions",
        category: "Web",
        description: "Learn how to make your first contribution to an open-source project.",
        technology: "HTML, Git",
        link: "https://github.com/firstcontributions/first-contributions"
    },
    {
        id: 2,
        name: "30 Days of Python",
        category: "Python",
        description: "Learn Python through practical exercises and challenges.",
        technology: "Python",
        link: "https://github.com/Asabeneh/30-Days-Of-Python"
    },
    {
        id: 3,
        name: "Java Design Patterns",
        category: "Java",
        description: "Explore common software design patterns using Java.",
        technology: "Java",
        link: "https://github.com/iluwatar/java-design-patterns"
    },
    {
        id: 4,
        name: "Awesome Python",
        category: "Python",
        description: "Discover useful Python frameworks, libraries and resources.",
        technology: "Python",
        link: "https://github.com/vinta/awesome-python"
    },
    {
        id: 5,
        name: "Public APIs",
        category: "Web",
        description: "Explore a collection of free public APIs for developers.",
        technology: "JavaScript, APIs",
        link: "https://github.com/public-apis/public-apis"
    },
    {
        id: 6,
        name: "Java Algorithms",
        category: "Java",
        description: "Explore algorithms and data structures implemented in Java.",
        technology: "Java, DSA",
        link: "https://github.com/TheAlgorithms/Java"
    }
];

let selectedCategory = "All";
let savedProjects = JSON.parse(localStorage.getItem("savedProjects")) || [];

const projectGrid = document.getElementById("projectGrid");
const savedGrid = document.getElementById("savedGrid");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter-btn");

function createCard(project) {
    const isSaved = savedProjects.includes(project.id);

    return `
        <div class="project-card">
            <span class="category">${project.category}</span>
            <h3>${project.name}</h3>
            <p>${project.description}</p>
            <p><strong>Technology:</strong> ${project.technology}</p>

            <div class="card-actions">
                <a href="${project.link}" target="_blank" rel="noopener noreferrer">
                    View Project →
                </a>

                <button class="save-btn" onclick="toggleSave(${project.id})">
                    ${isSaved ? "♥ Saved" : "♡ Save"}
                </button>
            </div>
        </div>
    `;
}

function displayProjects() {
    const searchText = searchInput.value.toLowerCase();

    const filteredProjects = projects.filter(project => {
        const matchesCategory =
            selectedCategory === "All" ||
            project.category === selectedCategory;

        const matchesSearch =
            project.name.toLowerCase().includes(searchText) ||
            project.description.toLowerCase().includes(searchText) ||
            project.technology.toLowerCase().includes(searchText);

        return matchesCategory && matchesSearch;
    });

    projectGrid.innerHTML = filteredProjects.length
        ? filteredProjects.map(createCard).join("")
        : '<p class="empty-message">No projects found.</p>';

    displaySavedProjects();
}

function displaySavedProjects() {
    const saved = projects.filter(project =>
        savedProjects.includes(project.id)
    );

    savedGrid.innerHTML = saved.length
        ? saved.map(createCard).join("")
        : '<p class="empty-message">You have not saved any projects yet.</p>';
}

function toggleSave(id) {
    if (savedProjects.includes(id)) {
        savedProjects = savedProjects.filter(projectId => projectId !== id);
    } else {
        savedProjects.push(id);
    }

    localStorage.setItem("savedProjects", JSON.stringify(savedProjects));

    displayProjects();
}

searchInput.addEventListener("input", displayProjects);

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        filterButtons.forEach(btn => btn.classList.remove("active"));

        button.classList.add("active");
        selectedCategory = button.dataset.category;

        displayProjects();
    });
});

displayProjects();

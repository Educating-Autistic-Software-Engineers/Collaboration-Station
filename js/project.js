// Get the email from the URL parameters
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get('email');
const targetEmail = roomId;

let roomList = [];
let roomDict = {};

// Check if the user is logged in
if (sessionStorage.getItem('email') == null) {
    window.location.href = 'index.html';
}

// Main function to load data and initialize the dashboard
async function load() {
    await fetchRooms();
    await fetchUserProjects();
    displayProjects();
    setupEventListeners();
}

// Fetch all rooms from the API
async function fetchRooms() {
    try {
        const response = await fetch("https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/roomDB");
        const roomsData = await response.json();
        const rooms = roomsData.requests;
        for (let room of rooms) {
            roomDict[room.room_id] = room;
        }
    } catch (error) {
        console.error('Error fetching rooms:', error);
    }
}

// Fetch user's projects from the API
async function fetchUserProjects() {
    try {
        const response = await fetch(`https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/register?email=${targetEmail}`);
        const data = await response.json();
        roomList = data.projects.split(", ");
    } catch (error) {
        console.error('Error fetching user projects:', error);
    }
}

// Display projects in the dashboard
function displayProjects() {
    const pastProjectsContainer = document.getElementById('past-projects');
    const classProjectsContainer = document.getElementById('class-projects');
    
    pastProjectsContainer.innerHTML = '';
    classProjectsContainer.innerHTML = '';

    roomList.forEach(roomId => {
        if (roomId in roomDict && roomId !== "" && roomId !== " " && roomDict[roomId].name) {
            const projectElement = createProjectElement(roomDict[roomId]);
            pastProjectsContainer.appendChild(projectElement);
        }
    });

    // Add "New Project" card
    const newProjectCard = createNewProjectCard();
    pastProjectsContainer.appendChild(newProjectCard);

    // For demonstration, we'll add some class projects
    // In a real scenario, you might want to fetch these from another API endpoint
    for (let i = 0; i < 5; i++) {
        const dummyProject = { room_id: `class_${i}`, name: `Class Project ${i + 1}` };
        const projectElement = createProjectElement(dummyProject);
        classProjectsContainer.appendChild(projectElement);
    }

    // Select the first project by default
    if (roomList.length > 0) {
        selectProject(roomList[0]);
    }
}

// Create a project element
function createProjectElement(project) {
    const projectCard = document.createElement('div');
    projectCard.className = 'project-thumbnail';
    projectCard.textContent = project.name;
    projectCard.onclick = () => selectProject(project.room_id);
    
    // Fetch and set background image
    fetch(`https://d3pl0tx5n82s71.cloudfront.net/${project.room_id}.png`)
        .then(response => {
            if (response.ok) {
                projectCard.style.backgroundImage = `url(https://d3pl0tx5n82s71.cloudfront.net/${project.room_id}.png)`;
                projectCard.style.backgroundSize = 'cover';
                projectCard.style.backgroundPosition = 'center';
            } else {
                projectCard.style.backgroundColor = 'purple';
            }
        })
        .catch(error => {
            console.error('Error fetching image:', error);
            projectCard.style.backgroundColor = 'purple';
        });

    return projectCard;
}

// Create the "New Project" card
function createNewProjectCard() {
    const newProjectCard = document.createElement('div');
    newProjectCard.className = 'project-thumbnail';
    newProjectCard.textContent = '+ New Project';
    newProjectCard.onclick = addProject;
    newProjectCard.style.backgroundColor = 'purple';
    return newProjectCard;
}

// Select a project and update the main display
function selectProject(projectId) {
    const selectedProjectContent = document.getElementById('selected-project');
    const project = roomDict[projectId];
    
    selectedProjectContent.innerHTML = `
        <img src="https://d3pl0tx5n82s71.cloudfront.net/${projectId}.png" alt="${project.name}" onerror="this.src='path/to/fallback/image.png';">
        <div class="project-info">
            <h3>${project.name}</h3>
            <p>Last edited: ${project.lastEdited || 'N/A'}</p>
            <button class="launch-btn" onclick="openProject('${projectId}')">Launch Project</button>
        </div>
    `;
}

// Add a new project
async function addProject() {
    let projectName = prompt('Enter your project name');
    if (projectName == null || projectName == "") {
        return;
    }

    try {
        const response = await fetch('https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/roomDB?method=new', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "name": projectName, 
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create new project');
        }
        
        const data = await response.json();
        const newRoomId = data.Item;

        // Update roomDict and roomList
        roomDict[newRoomId] = { room_id: newRoomId, name: projectName, icon: "default" };
        roomList.push(newRoomId);

        // Update user's projects
        await updateUserProjects(newRoomId);

        // Refresh the project display
        displayProjects();
        selectProject(newRoomId);

    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while creating a new project.');
    }
}

// Update user's projects in the database
async function updateUserProjects(newRoomId) {
    try {
        const response = await fetch('https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/register', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: roomId,
                projects: newRoomId,
            }) 
        });

        if (!response.ok) {
            throw new Error('Failed to update user projects');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while updating user projects.');
    }
}

// Open a project
function openProject(projectId) {
    window.location.href = `room.html?project=${projectId}`;
}

// Set up event listeners for scroll buttons
function setupEventListeners() {
    setupScroll('past-projects', 'scroll-left', 'scroll-right');
    setupScroll('class-projects', 'scroll-left-class', 'scroll-right-class');
}

// Set up scroll functionality for a container
function setupScroll(containerId, leftBtnId, rightBtnId) {
    const container = document.getElementById(containerId);
    const scrollLeft = document.getElementById(leftBtnId);
    const scrollRight = document.getElementById(rightBtnId);

    scrollLeft.onclick = () => {
        container.scrollBy({ left: -220, behavior: 'smooth' });
    };

    scrollRight.onclick = () => {
        container.scrollBy({ left: 220, behavior: 'smooth' });
    };
}

// Initialize the dashboard
load();
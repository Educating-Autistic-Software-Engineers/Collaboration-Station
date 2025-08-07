// Get the email from the URL parameters
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get('email');
const targetEmail = roomId;

let roomList = [];
let roomDict = {};

// Check if the user is logged in
if (sessionStorage.getItem('email') == null) {
    console.log("User not logged in... returning");
    window.location.href = 'index.html';
}

// Main function to load data and initialize the dashboard
async function load() {
    await fetchRooms();
    await fetchUserProjects();
    displayProjects();
    await populateUsernames();
    setupEventListeners();
    await ping();
}

// Fetch all rooms from the API
async function fetchRooms() {
    try {
        const response = await fetch("https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/roomDB");
        const roomsData = await response.json();
        const rooms = roomsData.requests;
        for (let room of rooms) {
            roomDict[room.room_id] = room;
        }
        console.log(rooms)
    } catch (error) {
        console.error('Error fetching rooms:', error);
    }
}

// Fetch user's projects from the API
async function fetchUserProjects() {
    try {
        const response = await fetch(`https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/register?email=${targetEmail}`);
        const data = await response.json();
        roomList = data.projects.split(", ");
    } catch (error) {
        console.error('Error fetching user projects:', error);
        roomList = [];
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
            isOwner = true;
            if ("editors" in roomDict[roomId] && roomDict[roomId].editors.indexOf(sessionStorage.getItem('email')) != 0) {
                isOwner = false;
            }
            const projectElement = createProjectElement(roomDict[roomId]);
            if (isOwner) {
                pastProjectsContainer.appendChild(projectElement);
            } else {
                classProjectsContainer.appendChild(projectElement);
            }
        }
    });

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

function createNewProjectCard() {
    const newProjectCard = document.createElement('div');
    newProjectCard.className = 'project-thumbnail';
    newProjectCard.textContent = '+ New Project';
    newProjectCard.onclick = addProject;
    newProjectCard.style.backgroundColor = 'purple';
    return newProjectCard;
}

function selectProject(projectId) {
    const selectedProjectContent = document.getElementById('selected-project');
    var project;
    try {
        project = roomDict[projectId];
    } catch (error) {
        console.error('Error selecting project:', error);
        return;
    }
    
    project.lastEdited = "Jan 2, 2025";
    
    let collaboratorCount = 0;
    let collaboratorHTML = '';
    
    if (project.editors && Array.isArray(project.editors)) {
        project.editors = project.editors.filter(editor => editor !== sessionStorage.getItem('email'));

        collaboratorCount = project.editors.length;
        
        // project.editors.slice(0, 4).forEach(editor => {
        //     const initial = editor.charAt(0).toUpperCase();
        //     collaboratorHTML += `<div class="collaborator" title="${editor.split('@')[0]}">${initial}</div>`;
        // });
    }
    
    selectedProjectContent.innerHTML = `
        <img src="https://d3pl0tx5n82s71.cloudfront.net/${projectId}.png" alt="${project.name}" onerror="this.src='https://thumbs.dreamstime.com/b/transparent-seamless-pattern-background-checkered-simulation-alpha-channel-png-wallpaper-empty-gird-grid-vector-illustration-308566526.jpg';">
        <div class="project-info">
            
            <h3>${project.name}</h3>
            <div class="project-actions">
                <button class="launch-btn" onclick="openProject('${projectId}')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14"></path>
                        <path d="M12 5l7 7-7 7"></path>
                    </svg>
                    Launch Project
                </button>
                <button class="action-btn" onclick="shareProject('${projectId}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                        <polyline points="16 6 12 2 8 6"></polyline>
                        <line x1="12" y1="2" x2="12" y2="15"></line>
                    </svg>
                    Share
                </button>
            </div>
            <div class="collaborators">
                ${collaboratorHTML}
            </div>
            <div style="display: flex; gap: 5px; margin-top: 10px;">
            <div class="project-meta">
                <div class="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    Last edited: ${project.lastEdited || 'Jan 1, 1970'}
                </div>
                <div class="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    ${collaboratorCount} collaborator${collaboratorCount !== 1 ? 's' : ''}
                </div>
            </div>

        </div>
        
    `;
}

function shareProject(projectId) {
    alert(`Copied link to clipboard`);
    const url = `https://collaborationstation.dev/room.html?project=${projectId}`; // Replace with your actual URL
    navigator.clipboard.writeText(url).then(() => {
        console.log('Link copied to clipboard:', url);
    }).catch(err => {
        console.error('Error copying link:', err);
    });
}

// Add a new project
async function addProject() {
    let projectName = prompt('Enter your project name');
    if (projectName == null || projectName == "") {
        return;
    }

    try {
        const response = await fetch('https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/roomDB?method=new', {
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
        roomDict[newRoomId] = { room_id: newRoomId, name: projectName, icon: "default", editors: [ sessionStorage.getItem("email") ] };
        roomList.push(newRoomId);

        await fetch('https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/roomDB', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "roomID": newRoomId,
                "user": sessionStorage.getItem('email') 
            })
        })

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

async function ping() {
    // return
    try {
        console.log('Pinging metadata');
        console.log(sessionStorage.getItem('email'));
        const response = await fetch(`https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/ping`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: sessionStorage.getItem('email')
            })
        });
        const resp = await response.json();
        console.log(resp);
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while pinging metadata');
    }
}

// Update user's projects in the database
async function updateUserProjects(newRoomId) {

    try {
        const response = await fetch('https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/register', {
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

async function openProject(projectId) {
    // modify editor permissions
    await fetch('https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/roomDB', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "roomID": projectId,
            "user": sessionStorage.getItem('email') 
        })
    })
    window.location.href = `room.html?project=${projectId}`;
}

function setupEventListeners() {
    setupScroll('past-projects', 'scroll-left', 'scroll-right');
    setupScroll('class-projects', 'scroll-left-class', 'scroll-right-class');
}

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


function createProjectElement(project) {
    const projectCard = document.createElement('div');
    projectCard.className = 'project-thumbnail';
    projectCard.onclick = () => selectProject(project.room_id);
    
    const titleElement = document.createElement('div');
    titleElement.className = 'project-title';
    titleElement.textContent = project.name;
    projectCard.appendChild(titleElement);
    
    const userBar = document.createElement('div');
    userBar.className = 'project-user-bar';
    
    if (roomDict[project.room_id] && "editors" in roomDict[project.room_id]) {
        const connectedUsers = roomDict[project.room_id].editors;

        connectedUsers.slice(0, 4).forEach(user => {

            if (user === sessionStorage.getItem('email')) {
                return;
            }

            const userIcon = document.createElement('div');
            userIcon.className = 'project-user-icon';
            userIcon.textContent = user.charAt(0).toUpperCase();
            userIcon.title = user.split('@')[0];
            userBar.appendChild(userIcon);
        });
        
        if (connectedUsers.length > 3) {
            const moreUsers = document.createElement('div');
            moreUsers.className = 'project-more-users';
            moreUsers.textContent = `+${connectedUsers.length - 3}`;
            userBar.appendChild(moreUsers);
        }
        
        projectCard.appendChild(userBar);
    }
    
    fetch(`https://d3pl0tx5n82s71.cloudfront.net/${project.room_id}.png`)
        .then(response => {
            if (response.ok) {
                projectCard.style.backgroundImage = `url(https://d3pl0tx5n82s71.cloudfront.net/${project.room_id}.png)`;
                projectCard.style.backgroundSize = 'cover';
                projectCard.style.backgroundPosition = 'center';
            }
        })
        .catch(error => {
            console.error('Error fetching image:', error);
        });

    return projectCard;
}


function populateUsernames() {
    fetch("https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/getAllItems")
        .then(response => response.json())
        .then(data => {
            const users = data.requests;
            const container = document.getElementById('user-list');

            
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '2px';
            container.style.padding = '5px';
            
            users.forEach(user => {
                const statusRow = document.createElement('div');
                statusRow.className = 'status-row';
                
                const userIcon = document.createElement('div');
                userIcon.className = 'user-icon';
                userIcon.textContent = user.name.charAt(0).toUpperCase();
                
                const userInfo = document.createElement('div');
                userInfo.className = 'user-info';
                
                const userName = document.createElement('div');
                userName.className = 'user-name';
                userName.textContent = user.name;
                
                var lastActiveTime = new Date("2025/01/01");
                if ("lastActive" in user) {
                    lastActiveTime = new Date( user.lastActive*1000 );
                    console.log(lastActiveTime, user.lastActive);
                }
                const timeAgo = (new Date()) - lastActiveTime;
                var timeString = "Last active: ";
                var minutesAgo = Math.floor(timeAgo / (1000 * 60));
                var hoursAgo = Math.floor(minutesAgo / 60);
                var daysAgo = Math.floor(hoursAgo / 24);
                var yearsAgo = Math.floor(daysAgo / 365);
                if (minutesAgo < 2) {
                    statusRow.className = 'active-row';
                    timeString += "Just now";
                } else if (daysAgo > 365) {
                    timeString += yearsAgo + " year" + (yearsAgo == 1 ? "" : "s") + " ago";
                } else if (daysAgo > 0) {
                    timeString += daysAgo + " day" + (daysAgo == 1 ? "" : "s") + " ago";
                } else if (hoursAgo > 0) {
                    timeString += hoursAgo + " hour" + (hoursAgo == 1 ? "" : "s") + " ago";
                } else {
                    timeString += minutesAgo + " minute" + (minutesAgo == 1 ? "" : "s") + " ago";
                }

                const lastActive = document.createElement('div');
                lastActive.className = 'last-active';
                lastActive.textContent = timeString;
                
                const chatBtn = document.createElement('button');
                chatBtn.className = 'chat-btn';
                chatBtn.textContent = 'Chat';
                chatBtn.onclick = (e) => {
                    e.stopPropagation();
                    // Add chat functionality here
                };
                
                userInfo.appendChild(userName);
                userInfo.appendChild(lastActive);
                
                statusRow.appendChild(userIcon);
                statusRow.appendChild(userInfo);
                // statusRow.appendChild(chatBtn);
                
                // statusRow.onclick = () => {
                //     window.location.href = `projects.html?email=${user.email}`;
                // };
                
                container.appendChild(statusRow);
            });
        });
}

load();
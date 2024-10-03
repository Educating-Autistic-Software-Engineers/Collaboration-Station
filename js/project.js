const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get('email');
const targetEmail = roomId;

let roomList = [];
let roomDict = {};

if (sessionStorage.getItem('email') == null) {
    window.location.href = 'index.html';
}

async function load() {
    const datresp = await fetch("https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/roomDB");
    const roomsj = await datresp.json();
    const rooms = roomsj.requests;
    for (let room of rooms) {
        roomDict[room.room_id] = room;
    }

    try {
        const response = await fetch(`https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/register?email=${targetEmail}`);
        const data = await response.json();
        roomList = data.projects.split(", ");
    } catch (error) {
        console.error('Error checking email:', error);
    }
    displayProjects();
}

async function displayProjects() {
    const projectList = document.getElementById('project-list');
    projectList.innerHTML = ''; // Clear existing content

    for (let room of roomList) {
        if (room in roomDict && room !== "" && room !== " " && roomDict[room].name) {
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';
            
            // Create a container for the text to ensure it's visible over the background
            const textContainer = document.createElement('div');
            textContainer.className = 'project-card-text';
            textContainer.textContent = roomDict[room].name.replace(/([A-Z])/g, ' $1').trim();
            projectCard.appendChild(textContainer);

            projectCard.onclick = () => selectProject(room);
            
            // Fetch the image
            try {
                const imageResponse = await fetch(`https://d3pl0tx5n82s71.cloudfront.net/${room}.png`);
                console.log(imageResponse)
                if (imageResponse.ok) {
                    projectCard.style.backgroundImage = `url(https://d3pl0tx5n82s71.cloudfront.net/${room}.png)`;
                    projectCard.style.backgroundSize = 'cover';
                    projectCard.style.backgroundPosition = 'center';
                    textContainer.style.color = '#ffffff'
                    textContainer.style.backgroundColor = '#00000090'
                } else {
                    // If no image, keep the default purple background
                    projectCard.style.backgroundColor = 'purple';
                }
            } catch (error) {
                console.error('Error fetching image:', error);
                projectCard.style.backgroundColor = 'purple';
            }

            projectList.appendChild(projectCard);
        }
    }

    // Add "New Project" card
    const newProjectCard = document.createElement('div');
    newProjectCard.className = 'project-card';
    newProjectCard.textContent = '+ New Project';
    newProjectCard.onclick = addProject;
    newProjectCard.style.backgroundColor = 'purple'; // Ensure this card always has a purple background
    projectList.appendChild(newProjectCard);

    // Select the first project by default
    if (roomList.length > 0) {
        selectProject(roomList[0]);
    }
}

function selectProject(projectId) {
    const selectedProjectContent = document.getElementById('selected-project-content');
    selectedProjectContent.textContent = roomDict[projectId].name;

    const launchButton = document.getElementById('launch-project');
    launchButton.onclick = () => openProject(projectId);
}

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
            alert('Failed to create new project.');
            return;
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

function openProject(projectId) {
    window.location.href = `room.html?project=${projectId}`;
}

// Scroll functionality
const scrollLeft = document.getElementById('scroll-left');
const scrollRight = document.getElementById('scroll-right');
const projectList = document.getElementById('project-list');

scrollLeft.onclick = () => {
    projectList.scrollBy({ left: -220, behavior: 'smooth' });
};

scrollRight.onclick = () => {
    console.log(projectList)
    projectList.style.left += 22
    projectList.scrollBy({ left: 220, behavior: 'smooth' });
};

// Initialize
load();
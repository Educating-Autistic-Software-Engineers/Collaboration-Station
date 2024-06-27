let rooms = [];

document.addEventListener('DOMContentLoaded', async () => {
    const rest = await fetch('https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/getAllItems');
    const res = await rest.json();
    let requests= res.requests;

    const datresp = await fetch("https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/roomDB");
    const roomsj = await datresp.json();
    rooms = roomsj.requests;
    roomDict = {}
    for (let room of rooms) {
        roomDict[String(room.room_id)] = room;
    }
    
    const table = document.getElementById('projectTable');
    const saveProjectsBtn = document.getElementById('saveProjectsBtn');
    const addRowBtn = document.getElementById('addRowBtn');
    const addProjectBtn = document.getElementById('addProjectBtn')
    const projectList = document.getElementById('projectList')
    const saveRoomsBtn = document.getElementById('saveRoomsBtn')

    for (let room of rooms) {
        let row = addProject(false);
        row.innerHTML = room.name;
    }

    console.log(roomDict, requests)
    
    for (let person of requests) {
        let row = createNewRow();
        row.querySelector('#name-input').value = person.name;
        row.querySelector('#email-input').value = person.email;
        if (person.projects == '') {
            continue;
        }
        row.querySelector('.projects').innerText = person.projects.split(', ').map(projectID => {
            return roomDict[String(projectID)].name;
        }).join(", ");
    }

    table.addEventListener('change', (e) => {
        if (e.target.classList.contains('project-select')) {
            const row = e.target.closest('tr');
            const selectedProject = e.target.value.replace("<button></button>", "");
            const projectsCell = row.querySelector('.projects');

            console.log(projectsCell.innerText, selectedProject);
            if (selectedProject && !projectsCell.innerText.includes(selectedProject)) {
                projectsCell.innerText += projectsCell.innerText ? `, ${selectedProject}` : selectedProject;
            }
        }
        else if (e.target.classList.contains('project-remove')) {
            const removeProject = e.target.value.replace("<button></button>", "");
            const row = e.target.closest('tr');
            const projectsCell = row.querySelector('.projects');
            if (removeProject && projectsCell.innerText.includes(removeProject)) {
                const projectsArray = projectsCell.innerText.split(', ').filter(Boolean);
                const updatedProjectsArray = projectsArray.filter(project => project !== removeProject);
                projectsCell.innerText = updatedProjectsArray.join(', ');
            }
        }
    });


    addRowBtn.addEventListener('click', createNewRow);
    addProjectBtn.addEventListener('click', addProject);

    function createNewRow() {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
        <td><input type="text" id="name-input" placeholder="Enter name"></td>
        <td><input type="email" id="email-input" placeholder="Enter email"></td>
        <td id="projects" class="projects"></td>
        <td>
            <select class="project-select" id="project-select">
                <option value="">Select a project</option>
            </select>
        </td>
        <td>
            <select class="project-remove" id="project-remove">
                <option value="">Select a project</option>
            </select>
        </td>
        `;
        projectTable.querySelector('tbody').appendChild(newRow);

        newRow.querySelector('#name-input').value = '';
        newRow.querySelector('#email-input').value = '';

        console.log(rooms)
        for (let room of rooms) {
            const roomName = room.name.replace("Delete", '');
            newRow.querySelector('.project-select').innerHTML += `<option value="${roomName}">${roomName}</option>`;
            newRow.querySelector('.project-remove').innerHTML += `<option value="${roomName}">${roomName}</option>`;
        }

        return newRow;
    }

    function addProject(createNewEntry=true) {
        const newProjectLi = document.createElement('li');
        const deleteButton = document.createElement('button');
        // make deleteButton display to the right of newProjectLi
        deleteButton.innerHTML = 'Delete';
        deleteButton.onclick = () => {
            projectList.removeChild(newProjectLi);
            rooms = rooms.filter(room => room.name !== newProjectLi.innerHTML);
        }

        let name = document.getElementById('projectName').value
        newProjectLi.innerHTML = name;
        newProjectLi.appendChild(deleteButton);
        projectList.appendChild(newProjectLi);

        if (createNewEntry) {
            let maxRoomId = 530425233;
            for (let room of rooms) {
                if ( Number(room.room_id) > maxRoomId) {
                    maxRoomId = Number(room.room_id);
                }
            }
            rooms.push({ room_id: String(Number(maxRoomId)+1), name: name });
        }
        return newProjectLi;
    }

    saveRoomsBtn.addEventListener('click', async () => {

        try {
            const response = await fetch('https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/roomDB', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(rooms) 
            });

            if (!response.ok) {
                alert('Failed to save rooms.');
                return
            }
            
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while saving rooms.');
        }
        //refresh page
        location.reload();

    })

    saveProjectsBtn.addEventListener('click', async () => {
        const rows = table.querySelectorAll('tbody tr');
        const data = Array.from(rows).map(row => {
            // console.log(document.getElementById('name-input').value);
            // const name = row.cells[0].innerText;
            // const email = row.cells[1].innerText;
            // const projects = row.cells[2].innerText;
            // const projects = row.cells[2].innerText.split(',').filter(Boolean);
        
            const name = row.querySelector('#name-input').value;
            console.log(name);
            const email = row.querySelector('#email-input').value;
            //console.log(row.querySelectorAll('#project-select'));
            console.log(row.querySelector('#projects').innerHTML, getRoomIDbyNames(row.querySelector('#projects').innerHTML))
            const projects = getRoomIDbyNames(row.querySelector('#projects').innerHTML);
            return { name, email, projects };
        });

        try {
            const response = await fetch('https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data) 
            });

            console.log(response);

            if (response.ok) {
                alert('Projects saved successfully!');
            } else {
                alert('Failed to save projects.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while saving.');
        }
    });
});

function getRoomIDbyNames(names) {
    let roomIDs = [];
    names = names.split(', ');
    for (let name of names) {
        for (let room of rooms) {
            if (room.name === name) {
                roomIDs.push(room.room_id);
            }
        }
    }
    return roomIDs.join(", ");
}


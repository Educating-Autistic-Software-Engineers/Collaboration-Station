let rooms = [];

console.log("HISDF")
document.addEventListener('DOMContentLoaded', async () => {
    const rest = await fetch('https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/getAllItems');
    const res = await rest.json();
    let requests= res.requests;

    const datresp = await fetch("https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/roomDB");
    const roomsj = await datresp.json();
    rooms = roomsj.requests;
    const roomsd = JSON.parse(JSON.stringify(rooms));
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

    for (let room of roomsd) {
        console.log(room)
        // let row = addProject(room.room_id);
        // row.innerHTML = room.name;
    }

    console.log(roomDict, requests)
    
    for (let person of requests) {
        console.log(person);
        let row = createNewRow();
        row.querySelector('#name-input').value = person.name;
        row.querySelector('#email-input').value = person.email;
        row.querySelector('#role').value = person.role;
        sessionStorage.setItem("role",row.querySelector('#role').value);
        
        if (person.projects == '') {
            continue;
        }

        try {
            row.querySelector('.projects').innerText = person.projects.split(', ').map(projectID => {
                return roomDict[projectID].name;
            }).join(", ");
        } catch (error) {
            console.log("PERSON UNDEFINED", error, person)
            continue
        }
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
        <td><input type="text" id="name-input" placeholder="Enter name" disabled></td>
        <td><input type="email" id="email-input" placeholder="Enter email" disabled></td>
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
        <td><input type="text" id="role" placeholder="Enter role" disabled></td>
        `;
        projectTable.querySelector('tbody').appendChild(newRow);

        newRow.querySelector('#name-input').value = '';
        newRow.querySelector('#email-input').value = '';

        console.log(rooms)
        for (let room of rooms) {
            try {
                const f = room.name.replace("Delete", '');
            } catch (error) {
                continue;
            }
            const roomName = room.name.replace("Delete", '');
            newRow.querySelector('.project-select').innerHTML += `<option value="${roomName}">${roomName}</option>`;
            newRow.querySelector('.project-remove').innerHTML += `<option value="${roomName}">${roomName}</option>`;
        }

        return newRow;
    }

    function addProject(roomId) {

        console.log(roomId)

        if (roomId === undefined) {
            alert("Please create a project through the 'Rooms' tab.")
            return
        }
        
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

        rooms.push({ room_id: String(roomId) , name: name });
        return newProjectLi;
    }

    saveRoomsBtn.addEventListener('click', async () => {

        try {
            const response = await fetch('https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/roomDB', {
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
            const role = row.querySelector('#role').value;
            console.log(role);
            return { name, email, projects,role };
        });

        try {
            const response = await fetch('https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/register', {
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


// let form = document.getElementById('lobby__form')

// let displayName = sessionStorage.getItem('display_name')
// if(displayName){
//     form.name.value = displayName
// }

// form.addEventListener('submit', (e) => {
//     e.preventDefault()

//     sessionStorage.setItem('display_name', e.target.name.value)

//     let inviteCode = e.target.room.value
//     if(!inviteCode){
//         inviteCode = String(Math.floor(Math.random() * 10000))
//     }
//     window.location = `room.html?room=${inviteCode}`
// })

const queryString = window.location.search
console.log(queryString);
const urlParams = new URLSearchParams(queryString)
console.log(urlParams);
let roomId = urlParams.get('email')
const targetEmail = roomId;

let roomList = [];

if (sessionStorage.getItem('email') == null) {
    window.location.href = 'index.html';
}

roomDict = {}

async function load() {
    const datresp = await fetch("https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/roomDB");
    const roomsj = await datresp.json();
    rooms = roomsj.requests;
    for (let room of rooms) {
        roomDict[room.room_id] = room;
    }

    try {
        const response = await fetch(`https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/register?email=${targetEmail}`);
        console.log(response);
        console.log(response.ok);
        const data = await response.json();
        roomList = data.projects.split(", ");
    } catch (error) {
        console.error('Error checking email:', error);
    }
    displayTiles()
}
load()

// Function to create and display tiles based on the room list
function displayTiles() {
    console.log("og", roomList)
    const tileContainer = document.getElementById('tileContainer');
    roomList.forEach(room => {
        console.log(room, roomDict)
        // check if room is in roomDict:
        if (!(room in roomDict)) {
            return;
        }
        if (room == "" || room == " " || !roomDict[room].name) {
            return;
        }
        const tile = document.createElement('div');
        const img = document.createElement('img');
        tile.className = 'tile';
        tile.innerHTML = `<p style="text-align: center;">${roomDict[room].name.replace(/([A-Z])/g, ' $1').trim()}</p>`; // Format room name
        tile.onclick = () => openProject(room);
        tileContainer.appendChild(tile);
        tile.appendChild(img);
        //tileContainer.innerHTML += `<p>${roomDict[room].name}</p>`;
        // img.src = 'images/draw.png';
        // img.id = 'draw_image';
    });
    const addProjectBtn = document.createElement('div');
    addProjectBtn.className = 'tile';
    console.log("addProjectBtn", addProjectBtn)
    tileContainer.appendChild(addProjectBtn);
    addProjectBtn.innerHTML = `
        <b style="font-size:99px;">+</b>
    `
    addProjectBtn.onclick = () => {
        // remove add project button
        tileContainer.removeChild(addProjectBtn);
        addProject().then(() =>
            tileContainer.appendChild(addProjectBtn)
        );
    };
}

async function readStreamAsString(stream) {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let result = '';
    let done = false;

    while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
            result += decoder.decode(value, { stream: !done });
        }
    }

    return result;
}

async function addProject(){
    
    var newRoomId;
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
            alert('Failed to save rooms.');
            return
        }
        
        const data = await readStreamAsString(response.body);
        newRoomId = JSON.parse(data).Item;
        
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while saving rooms.');
        return
    }
    
    const addProjectBtn = document.createElement('div');
    addProjectBtn.className = 'tile';
    tileContainer.appendChild(addProjectBtn);

    addProjectBtn.innerHTML = `
        <p style="text-align: center;">${projectName}</p>
    `
    // document.getElementById("addProjectEntry").innerHTML=projectName;
    // const textEntry = addProjectBtn.querySelector('#addProjectEntry');
    // textEntry.addEventListener('click', (event) => event.stopPropagation());
    // addProjectBtn.onclick = () => createNewProject(textEntry.value);
    
    console.log("going inside");

    const response = await fetch(`https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/register?email=${targetEmail}`);
    const data = await response.json();
    console.log(data)

    try {
        console.log("inside");
        console.log(roomId); 

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

    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while saving.');
    }

    rooms.push({ room_id: newRoomId, name: projectName });
    addProjectBtn.onclick = () => openProject(newRoomId)

    




    // try {
    //     const response = await fetch('https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/roomDB', {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json'
    //         },
    //         body: JSON.stringify(rooms) 
    //     });

    //     if (!response.ok) {
    //         alert('Failed to save rooms.');
    //         return
    //     }
        
    // } catch (error) {
    //     console.error('Error:', error);
    //     alert('An error occurred while saving rooms.');
    // }
    // //refresh page
    // location.reload();



}

// REDUNDANT FUNCTION
async function createNewProject(text) {
    if (text == '') {
        return;
    }

    const datresp = await fetch("https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/roomDB");
    const roomsj = await datresp.json();
    let rooms = roomsj.requests;

    let maxRoomId = 530425233;
    for (let room of rooms) {
        if ( Number(room.room_id) > maxRoomId) {
            maxRoomId = Number(room.room_id);
        }
    }
    rooms.push({ room_id: String(Number(maxRoomId)+1), name: text });
    // const response = await fetch('https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/roomDB', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify(rooms) 
    // });
    // if (!response.ok) {
    //     alert('Failed to save rooms.');
    //     return
    // }
    // location.reload();
}

function openProject(projectId) {
    // alert('Opening ' + projectName);
    // window.location=`room.html?projectName=${projectName}`;
    window.location.href=`room.html?project=${projectId}`;
    // Here you can add the code to redirect to a different page or load project details
    // For example: window.location.href = 'project1.html';
}
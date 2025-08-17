

let roomAssignments = {};
let currentRoomCount = 3;

async function showBreakoutRoomsPopup() {

    const resp = await fetch('https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/getAllItems');
    const data = await resp.json();

    POTENTIAL_MEMBERS = data.requests;

    const popup = document.getElementById('breakout-rooms-popup');
    popup.style.display = 'block';
    
    // Initialize data when popup opens
    initializeBreakoutRooms();
}

function hideBreakoutRoomsPopup() {
    const popup = document.getElementById('breakout-rooms-popup');
    popup.style.display = 'none';
}

function initializeBreakoutRooms() {
    // Reset assignments
    roomAssignments = {};
    
    // Generate rooms based on current count
    generateRooms();
    
    // Populate unassigned members
    populateUnassignedMembers();
    
    // Set up event listeners
    setupEventListeners();
}

function generateRooms() {
    const container = document.getElementById('rooms-container');
    const roomCount = parseInt(document.getElementById('room-count').value);
    currentRoomCount = roomCount;
    
    container.innerHTML = '';
    
    for (let i = 1; i <= roomCount; i++) {
        const roomCard = document.createElement('div');
        roomCard.className = 'room-card';
        roomCard.dataset.roomId = i;
        
        roomCard.innerHTML = `
            <div class="room-header">
                <div class="room-title">Room ${i}</div>
                <div class="member-count" id="room-${i}-count">0 members</div>
            </div>
            <div class="room-members" id="room-${i}-members">
                <div class="empty-room">Drop members here</div>
            </div>
        `;
        
        container.appendChild(roomCard);
        setupDropZone(roomCard);
    }
}

function populateUnassignedMembers() {
    const container = document.getElementById('unassigned-members');
    container.innerHTML = '';
    
    POTENTIAL_MEMBERS.forEach(member => {
        const memberElement = createMemberElement(member);
        container.appendChild(memberElement);
    });
    
    updateUnassignedCount();
}

function createMemberElement(member) {
    let memberName = member.name;
    let memberEmail = member.email;
    const memberDiv = document.createElement('div');
    memberDiv.className = 'member-item';
    memberDiv.draggable = true;
    memberDiv.dataset.memberName = memberName;
    memberDiv.dataset.memberEmail = memberEmail;
    memberDiv.dataset.member = JSON.stringify(member);

    const initials = memberName.split(' ').map(name => name[0]).join('');
    
    memberDiv.innerHTML = `
        <div class="member-avatar">${initials}</div>
        <div class="member-name">${memberName}</div>
    `;
    
    setupDragEvents(memberDiv);
    return memberDiv;
}

function setupDragEvents(element) {
    element.addEventListener('dragstart', (e) => {
        element.classList.add('dragging');
        e.dataTransfer.setData('text/plain', element.dataset.member);
        e.dataTransfer.effectAllowed = 'move';
    });
    
    element.addEventListener('dragend', () => {
        element.classList.remove('dragging');
    });
}

function setupDropZone(roomCard) {
    roomCard.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        roomCard.classList.add('drag-over');
    });
    
    roomCard.addEventListener('dragleave', () => {
        roomCard.classList.remove('drag-over');
    });
    
    roomCard.addEventListener('drop', (e) => {
        e.preventDefault();
        roomCard.classList.remove('drag-over');

        const member = JSON.parse(e.dataTransfer.getData('text/plain'));
        const roomId = roomCard.dataset.roomId;

        assignMemberToRoom(member, roomId);
    });
}

function assignMemberToRoom(member, roomId) {
    Object.keys(roomAssignments).forEach(room => {
        if (roomAssignments[room]) {
            roomAssignments[room] = roomAssignments[room].filter(m => m.email !== member.email);
        }
    });
    
    if (!roomAssignments[roomId]) {
        roomAssignments[roomId] = [];
    }
    roomAssignments[roomId].push(member);
    
    updateRoomDisplay(roomId);
    updateUnassignedDisplay();
}

function updateRoomDisplay(roomId) {
    const membersContainer = document.getElementById(`room-${roomId}-members`);
    const countElement = document.getElementById(`room-${roomId}-count`);
    
    const members = roomAssignments[roomId] || [];
    
    if (members.length === 0) {
        membersContainer.innerHTML = '<div class="empty-room">Drop members here</div>';
        countElement.textContent = '0 members';
    } else {
        membersContainer.innerHTML = '';
        members.forEach(member => {
            const memberElement = createMemberElement(member);
            membersContainer.appendChild(memberElement);
        });
        countElement.textContent = `${members.length} member${members.length !== 1 ? 's' : ''}`;
    }
}

function updateUnassignedDisplay() {
    const container = document.getElementById('unassigned-members');
    const assignedMembers = new Set();
    
    Object.values(roomAssignments).forEach(members => {
        if (members) {
            members.forEach(member => assignedMembers.add(member.email));
        }
    });

    const unassignedMembers = POTENTIAL_MEMBERS.filter(member => !assignedMembers.has(member.email));

    container.innerHTML = '';
    unassignedMembers.forEach(member => {
        const memberElement = createMemberElement(member);
        container.appendChild(memberElement);
    });
    
    updateUnassignedCount();
}

function updateUnassignedCount() {
    const assignedMembers = new Set();
    Object.values(roomAssignments).forEach(members => {
        if (members) {
            members.forEach(member => assignedMembers.add(member));
        }
    });
    
    const unassignedCount = POTENTIAL_MEMBERS.length - assignedMembers.size;
    document.getElementById('unassigned-count').textContent = unassignedCount;
}

function autoAssignMembers() {
    roomAssignments = {};
    
    const shuffledMembers = [...POTENTIAL_MEMBERS].sort(() => Math.random() - 0.5);
    
    shuffledMembers.forEach((member, index) => {
        const roomId = (index % currentRoomCount) + 1;
        assignMemberToRoom(member, roomId.toString());
    });
    
    for (let i = 1; i <= currentRoomCount; i++) {
        updateRoomDisplay(i.toString());
    }
    updateUnassignedDisplay();
}

function setupEventListeners() {
    document.getElementById('room-count').addEventListener('input', (e) => {
        const newCount = parseInt(e.target.value);
        if (newCount >= 1 && newCount <= 10) {
            generateRooms();
            updateUnassignedDisplay();
        }
    });
    
    const unassignedArea = document.getElementById('unassigned-members');
    unassignedArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });
    
    unassignedArea.addEventListener('drop', (e) => {
        e.preventDefault();
        const memberName = e.dataTransfer.getData('text/plain');
        
        Object.keys(roomAssignments).forEach(room => {
            if (roomAssignments[room]) {
                roomAssignments[room] = roomAssignments[room].filter(member => member.name !== memberName);
            }
        });
        
        for (let i = 1; i <= currentRoomCount; i++) {
            updateRoomDisplay(i.toString());
        }
        updateUnassignedDisplay();
    });
}

async function saveBreakoutRooms() {
    
    for (const roomnum in roomAssignments) {
        const members = roomAssignments[roomnum];

        for (const member of members) {
            const response = await fetch('https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/rooms/breakouts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    room: roomId.split(":")[0],
                    user: member.email,
                    roomnum: Number(roomnum)
                })
            });

            if (!response.ok) {
                console.error(`Failed to add member ${member.email} to room ${roomnum}`);
            }
        }
    }

    alert('Breakout room assignments saved successfully!');
    hideBreakoutRoomsPopup();
    
}

document.getElementById('breakout-rooms-popup').addEventListener('click', (e) => {
    if (e.target.id === 'breakout-rooms-popup') {
        hideBreakoutRoomsPopup();
    }
});
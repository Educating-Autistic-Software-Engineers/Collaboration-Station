

let roomAssignments = {};
let currentRoomCount = 3;
let onlineSet = new Set(); // tracks which emails are currently connected

async function showBreakoutRoomsPopup() {

    // 1. Fetch the room's registered editors from the API (not Ably connected users)
    let editors = [];
    try {
        const resp = await fetch(`https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/roomDB?roomId=${roomId}`);
        if (resp.ok) {
            const data = await resp.json();
            if (data) {
                if (data.request) {
                    if (Array.isArray(data.request.editors)) editors = data.request.editors;
                    else if (Array.isArray(data.request.users)) editors = data.request.users;
                } else if (Array.isArray(data.editors)) {
                    editors = data.editors;
                }
            }
        }
    } catch (e) {
        console.error('Failed to fetch room editors for breakout rooms', e);
    }

    // Fallback: if API returned nothing, use connectedUsers as a last resort
    if (editors.length === 0) {
        editors = Object.values(connectedUsers).map(u => u.requestId || u.email);
    }

    // 2. Get Ably online presence to show green/grey dots
    let present = [];
    try {
        if (window.getCurrentPresence) {
            present = await window.getCurrentPresence();
        }
    } catch (e) { /* ignore */ }
    onlineSet = new Set(present || []);

    // 3. Build POTENTIAL_MEMBERS from editors list, resolving names
    const findUser = (email) => {
        // Check POTENTIAL_MEMBERS (loaded via /getAllItems)
        if (typeof POTENTIAL_MEMBERS !== 'undefined' && Array.isArray(POTENTIAL_MEMBERS)) {
            const m = POTENTIAL_MEMBERS.find(x => x.email === email);
            if (m) return m;
        }
        // Check connectedUsers for name
        if (typeof connectedUsers !== 'undefined') {
            for (const key of Object.keys(connectedUsers)) {
                const u = connectedUsers[key];
                if ((u.requestId || u.email) === email) return { name: u.name, email: email };
            }
        }
        return { name: email, email: email };
    };

    POTENTIAL_MEMBERS = editors.map(email => {
        const u = findUser(email);
        return { name: u.name || email, email: email };
    });

    const popup = document.getElementById('breakout-rooms-popup');
    popup.style.display = 'block';

    // 4. Fetch existing breakout assignments
    const emails = POTENTIAL_MEMBERS.map(m => m.email);
    const batchResp = await fetch(`https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/rooms/breakouts?room=${roomId.split(":")[0]}&batch=${emails.join(",")}`);
    const data = await batchResp.json();
    console.log(data);

    initializeBreakoutRooms();

    for (const assignment of data) {
        let member = POTENTIAL_MEMBERS.find(m => m.email === assignment.id.split(":")[1]);
        assignMemberToRoom(member, assignment.redirect.toString())
        updateRoomDisplay(assignment.redirect.toString());
    }
    updateUnassignedDisplay();
}

function hideBreakoutRoomsPopup() {
    const popup = document.getElementById('breakout-rooms-popup');
    popup.style.display = 'none';
}

function initializeBreakoutRooms(refreshAssignments = true) {

    if (refreshAssignments) {
        roomAssignments = {};
    }

    generateRooms();
    
    populateUnassignedMembers();
    
    setupEventListeners();
}

function generateRooms() {
    const container = document.getElementById('rooms-container');
    const roomCount = parseInt(document.getElementById('room-count').value);
    currentRoomCount = roomCount;

    setupDropZone(document.getElementById('unassigned-section-box'));

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
    memberDiv.id = `member-${member.email}`;

    const initials = memberName.split(' ').map(name => name[0]).join('');
    const isOnline = onlineSet.has(memberEmail);
    
    memberDiv.innerHTML = `
        <span class="member-status-dot ${isOnline ? 'online' : 'offline'}"></span>
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
        var roomId = parseInt(roomCard.dataset.roomId);
        if (isNaN(roomId) || roomId === null) {
            roomId = 0;
        }

        assignMemberToRoom(member, roomId);
    });
}

function assignMemberToRoom(member, roomId) {
    let oldRoomId = null;
    
    // Find and remove member from all existing room assignments
    Object.keys(roomAssignments).forEach(room => {
        if (roomAssignments[room] && Array.isArray(roomAssignments[room])) {
            const memberIndex = roomAssignments[room].findIndex(m => m.email === member.email);
            if (memberIndex !== -1) {
                oldRoomId = room;
                roomAssignments[room].splice(memberIndex, 1);
            }
        }
    });
    
    // Initialize room if it doesn't exist
    if (!roomAssignments[roomId]) {
        roomAssignments[roomId] = [];
    }
    
    // Add member to new room
    roomAssignments[roomId].push(member);

    // Remove any existing DOM elements for this member
    const existingElements = document.querySelectorAll(`[id="member-${member.email}"]`);
    existingElements.forEach(el => {
        if (el.parentNode) {
            el.parentNode.removeChild(el);
        }
    });

    // Update displays
    updateRoomDisplay(roomId);
    if (oldRoomId !== null && oldRoomId !== roomId) {
        updateRoomDisplay(oldRoomId);
    }
    updateUnassignedDisplay();
}

function updateRoomDisplay(roomId) {
    var membersContainer = (roomId > 0) ? document.getElementById(`room-${roomId}-members`) : document.getElementById('unassigned-members');
    var countElement = (roomId > 0) ? document.getElementById(`room-${roomId}-count`) : document.getElementById('unassigned-count');
    
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
    
    // Build a set of all assigned members
    const assignedMembers = new Set();
    Object.values(roomAssignments).forEach(members => {
        if (Array.isArray(members)) {
            members.forEach(member => assignedMembers.add(member.email));
        }
    });

    // Filter to get unassigned members
    const unassignedMembers = POTENTIAL_MEMBERS.filter(member => !assignedMembers.has(member.email));

    // Clear and rebuild the container
    container.innerHTML = '';
    
    if (unassignedMembers.length === 0) {
        container.innerHTML = '<div class="empty-room">All members assigned</div>';
    } else {
        unassignedMembers.forEach(member => {
            const memberElement = createMemberElement(member);
            container.appendChild(memberElement);
        });
    }
    
    // Update count
    updateUnassignedCount();
}

function updateUnassignedCount() {
    const assignedMembers = new Set();
    Object.values(roomAssignments).forEach(members => {
        if (members) {
            members.forEach(member => assignedMembers.add(member.email));
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
        // e.dataTransfer.dropEffect = 'move';
    });
    
    unassignedArea.addEventListener('drop', (e) => {
        e.preventDefault();
        const member = JSON.parse(e.dataTransfer.getData('text/plain'));

        console.log('Dropping member back to main room:', member);

        // Remove member from all room assignments
        Object.keys(roomAssignments).forEach(room => {
            if (roomAssignments[room] && Array.isArray(roomAssignments[room])) {
                const oldLength = roomAssignments[room].length;
                roomAssignments[room] = roomAssignments[room].filter(m => m.email !== member.email);
                if (roomAssignments[room].length !== oldLength) {
                    console.log(`Removed member from room ${room}`);
                }
            }
        });

        // Remove any existing DOM element for this member across all sections
        const existingElements = document.querySelectorAll(`[id="member-${member.email}"]`);
        existingElements.forEach(el => {
            if (el.parentNode) {
                el.parentNode.removeChild(el);
            }
        });

        // Update all room displays first to remove the member visually
        for (let i = 1; i <= currentRoomCount; i++) {
            updateRoomDisplay(i.toString());
        }
        
        // Small delay to ensure DOM updates are processed
        setTimeout(() => {
            // Update unassigned display - this will add the member back to unassigned list
            updateUnassignedDisplay();
            console.log('Updated unassigned display');
        }, 10);
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
let roomAssignments = {};
let currentRoomCount = 3;
let onlineSet = new Set();
let roomViewOnlyFlags = {};
let sharedVcMode = false;

function buildRoomDbUrl(extraParams = {}) {
  const url = new URL("https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/roomDB");
  url.searchParams.set("user", sessionStorage.getItem("email") || "");
  url.searchParams.set("token", sessionStorage.getItem("token") || "");

  Object.entries(extraParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

async function showBreakoutRoomsPopup() {
  console.log("showing breakoutrooms");
  const baseRoomId = roomId.split(":")[0];
  roomViewOnlyFlags = {};

  let editors = [];
  let baseRoomData = null;
  try {
    const resp = await fetch(
      buildRoomDbUrl({ roomId: baseRoomId }),
    );
    if (resp.ok) {
      const data = await resp.json();
      baseRoomData = data && data.request ? data.request : data;
      if (data) {
        if (data.request) {
          if (Array.isArray(data.request.editors))
            editors = data.request.editors;
          else if (Array.isArray(data.request.users))
            editors = data.request.users;
        } else if (Array.isArray(data.editors)) {
          editors = data.editors;
        }
      }
    }
  } catch (e) {
    console.error("Failed to fetch room editors for breakout rooms", e);
  }

  if (editors.length === 0) {
    editors = Object.values(connectedUsers).map((u) => u.requestId || u.email);
  }

  const currentUserEmail = sessionStorage.getItem("email");
  if (currentUserEmail && !editors.includes(currentUserEmail)) {
    editors.unshift(currentUserEmail);
  }

  let present = [];
  try {
    if (window.getCurrentPresence) {
      present = await window.getCurrentPresence();
    }
  } catch (e) {
    /* ignore */
  }
  onlineSet = new Set(present || []);

  const findUser = (email) => {
    if (typeof connectedUsers !== "undefined") {
      for (const key of Object.keys(connectedUsers)) {
        const u = connectedUsers[key];
        if ((u.requestId || u.email) === email) {
          return { name: u.name || u.display_name || email, email: email };
        }
      }
    }
    if (
      typeof POTENTIAL_MEMBERS !== "undefined" &&
      Array.isArray(POTENTIAL_MEMBERS)
    ) {
      const m = POTENTIAL_MEMBERS.find((x) => x.email === email);
      if (m) return m;
    }
    return { name: email, email: email };
  };

  POTENTIAL_MEMBERS = editors.map((email) => {
    const u = findUser(email);
    return { name: u.name || email, email: email };
  });

  console.log("POTENTIAL_MEMBERS:", POTENTIAL_MEMBERS);
  console.log("Current user email from sessionStorage:", currentUserEmail);

  const popup = document.getElementById("breakout-rooms-popup");
  popup.style.display = "block";

  const roomCountInput = document.getElementById("room-count");
  if (
    roomCountInput &&
    baseRoomData &&
    Number.isFinite(Number(baseRoomData.breakouts))
  ) {
    roomCountInput.value = String(
      Math.max(1, Math.min(10, Number(baseRoomData.breakouts))),
    );
  }

  // 4. Fetch existing breakout assignments
  const emails = POTENTIAL_MEMBERS.map((m) => m.email);
  const batchResp = await fetch(
    `https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/rooms/breakouts?room=${baseRoomId}&batch=${emails.join(",")}`,
  );
  const batchJson = await batchResp.json();
  const data = batchJson.assignments ?? batchJson;
  sharedVcMode = Boolean(batchJson.shared_vc);
  const sharedVcToggle = document.getElementById("shared-vc-toggle");
  if (sharedVcToggle) {
    sharedVcToggle.checked = sharedVcMode;
    updateSharedVcUi();
  }
  console.log(data);

  const roomCount = parseInt(document.getElementById("room-count").value) || 3;
  const roomSettingResponses = await Promise.all(
    Array.from({ length: roomCount }, (_, index) => {
      const breakoutId = index + 1;
      return fetch(
        buildRoomDbUrl({ roomId: `${baseRoomId}:${breakoutId}` }),
      )
        .then((resp) => (resp.ok ? resp.json() : null))
        .catch(() => null);
    }),
  );

  roomSettingResponses.forEach((response, index) => {
    const breakoutId = index + 1;
    const record = response && response.request ? response.request : response;
    roomViewOnlyFlags[breakoutId] = Boolean(record && record.view_only);
  });

  initializeBreakoutRooms();

  for (const assignment of data) {
    let member = POTENTIAL_MEMBERS.find(
      (m) => m.email === assignment.id.split(":")[1],
    );
    const roomNum = parseInt(assignment.redirect);
    // Only assign to a room if redirect is > 0 (0 means unassigned)
    if (roomNum > 0 && member) {
      assignMemberToRoom(member, roomNum);
      updateRoomDisplay(roomNum);
    }
  }
  updateUnassignedDisplay();
}

function hideBreakoutRoomsPopup() {
  const popup = document.getElementById("breakout-rooms-popup");
  popup.style.display = "none";
}

function updateSharedVcUi() {
  const badge = document.getElementById("shared-vc-badge");
  const hint = document.getElementById("shared-vc-hint");
  if (badge) badge.style.display = sharedVcMode ? "inline-flex" : "none";
  if (hint) hint.style.display = sharedVcMode ? "block" : "none";
}

function onSharedVcToggleChanged(checked) {
  sharedVcMode = checked;
  updateSharedVcUi();
}

function initializeBreakoutRooms(refreshAssignments = true) {
  console.log("Initialized breakoutRoom");

  if (refreshAssignments) {
    roomAssignments = {};
  }

  generateRooms();

  populateUnassignedMembers();

  setupEventListeners();
}

function generateRooms() {
  const container = document.getElementById("rooms-container");
  const roomCount = parseInt(document.getElementById("room-count").value);
  currentRoomCount = roomCount;

  container.innerHTML = "";

  for (let i = 1; i <= roomCount; i++) {
    const roomCard = document.createElement("div");
    roomCard.className = "room-card";
    roomCard.dataset.roomId = i;

    roomCard.innerHTML = `
            <div class="room-header">
                <div class="room-title">Room ${i}</div>
                <div class="member-count" id="room-${i}-count">0 members</div>
            </div>
            <label class="room-view-only-toggle">
                <input type="checkbox" class="room-view-only-input" data-room-id="${i}" ${roomViewOnlyFlags[i] ? "checked" : ""}>
                <span>View only</span>
            </label>
            <div class="room-members" id="room-${i}-members">
                <div class="empty-room">Drop members here</div>
            </div>
        `;

    container.appendChild(roomCard);
    const toggle = roomCard.querySelector(".room-view-only-input");
    if (toggle) {
      toggle.addEventListener("change", () => {
        roomViewOnlyFlags[i] = toggle.checked;
      });
    }
    setupDropZone(roomCard);
  }
}

function populateUnassignedMembers() {
  const container = document.getElementById("unassigned-members");
  container.innerHTML = "";

  POTENTIAL_MEMBERS.forEach((member) => {
    const memberElement = createMemberElement(member);
    container.appendChild(memberElement);
  });

  updateUnassignedCount();
}

function createMemberElement(member) {
  let memberName = member.name;
  let memberEmail = member.email;
  const memberDiv = document.createElement("div");
  memberDiv.className = "member-item";
  memberDiv.draggable = true;
  memberDiv.dataset.memberName = memberName;
  memberDiv.dataset.memberEmail = memberEmail;
  memberDiv.dataset.member = JSON.stringify(member);
  memberDiv.id = `member-${member.email}`;

  const initials = memberName
    .split(" ")
    .map((name) => name[0])
    .join("");
  const isOnline = onlineSet.has(memberEmail);

  memberDiv.innerHTML = `
        <span class="member-status-dot ${isOnline ? "online" : "offline"}"></span>
        <div class="member-avatar">${initials}</div>
        <div class="member-name">${memberName}</div>
    `;

  setupDragEvents(memberDiv);
  return memberDiv;
}

function setupDragEvents(element) {
  element.addEventListener("dragstart", (e) => {
    element.classList.add("dragging");
    e.dataTransfer.setData("text/plain", element.dataset.member);
    e.dataTransfer.effectAllowed = "move";
  });

  element.addEventListener("dragend", () => {
    element.classList.remove("dragging");
  });
}

function setupDropZone(roomCard) {
  roomCard.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    roomCard.classList.add("drag-over");
  });

  roomCard.addEventListener("dragleave", () => {
    roomCard.classList.remove("drag-over");
  });

  roomCard.addEventListener("drop", (e) => {
    e.preventDefault();
    roomCard.classList.remove("drag-over");

    const member = JSON.parse(e.dataTransfer.getData("text/plain"));
    var roomId = parseInt(roomCard.dataset.roomId);
    if (isNaN(roomId) || roomId === null) {
      roomId = 0;
    }

    assignMemberToRoom(member, roomId);
  });
}

function assignMemberToRoom(member, roomId) {
  // Normalize roomId to integer
  roomId = parseInt(roomId) || 0;
  let oldRoomId = null;

  // Find and remove member from all existing room assignments
  Object.keys(roomAssignments).forEach((room) => {
    if (roomAssignments[room] && Array.isArray(roomAssignments[room])) {
      const memberIndex = roomAssignments[room].findIndex(
        (m) => m.email === member.email,
      );
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
  const existingElements = document.querySelectorAll(
    `[id="member-${member.email}"]`,
  );
  existingElements.forEach((el) => {
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
  // Normalize roomId to integer
  roomId = parseInt(roomId) || 0;
  var membersContainer =
    roomId > 0
      ? document.getElementById(`room-${roomId}-members`)
      : document.getElementById("unassigned-members");
  var countElement =
    roomId > 0
      ? document.getElementById(`room-${roomId}-count`)
      : document.getElementById("unassigned-count");

  const members = roomAssignments[roomId] || [];

  if (members.length === 0) {
    membersContainer.innerHTML =
      '<div class="empty-room">Drop members here</div>';
    countElement.textContent = "0 members";
  } else {
    membersContainer.innerHTML = "";
    members.forEach((member) => {
      const memberElement = createMemberElement(member);
      membersContainer.appendChild(memberElement);
    });
    countElement.textContent = `${members.length} member${members.length !== 1 ? "s" : ""}`;
  }
}

function updateUnassignedDisplay() {
  const container = document.getElementById("unassigned-members");

  // Build a set of all assigned members
  const assignedMembers = new Set();
  Object.values(roomAssignments).forEach((members) => {
    if (Array.isArray(members)) {
      members.forEach((member) => assignedMembers.add(member.email));
    }
  });

  // Filter to get unassigned members
  const unassignedMembers = POTENTIAL_MEMBERS.filter(
    (member) => !assignedMembers.has(member.email),
  );

  // Clear and rebuild the container
  container.innerHTML = "";

  if (unassignedMembers.length === 0) {
    container.innerHTML = '<div class="empty-room">All members assigned</div>';
  } else {
    unassignedMembers.forEach((member) => {
      const memberElement = createMemberElement(member);
      container.appendChild(memberElement);
    });
  }

  // Update count
  updateUnassignedCount();
}

function updateUnassignedCount() {
  const assignedMembers = new Set();
  Object.values(roomAssignments).forEach((members) => {
    if (members) {
      members.forEach((member) => assignedMembers.add(member.email));
    }
  });

  const unassignedCount = POTENTIAL_MEMBERS.length - assignedMembers.size;
  document.getElementById("unassigned-count").textContent = unassignedCount;
}

function autoAssignMembers() {
  roomAssignments = {};

  // In shared VC mode, TAs stay in the main room (unassigned).
  // A member is considered a TA if their record has role === "TA" or
  // if the global POTENTIAL_MEMBERS entry carries that flag.
  const isTa = (member) => {
    if (member.role === "TA") return true;
    if (typeof POTENTIAL_MEMBERS !== "undefined" && Array.isArray(POTENTIAL_MEMBERS)) {
      const found = POTENTIAL_MEMBERS.find((m) => m.email === member.email);
      if (found && found.role === "TA") return true;
    }
    return false;
  };

  const membersToAssign = sharedVcMode
    ? POTENTIAL_MEMBERS.filter((m) => !isTa(m))
    : [...POTENTIAL_MEMBERS];

  const shuffledMembers = membersToAssign.sort(() => Math.random() - 0.5);

  shuffledMembers.forEach((member, index) => {
    const roomId = (index % currentRoomCount) + 1;
    assignMemberToRoom(member, roomId);
  });

  for (let i = 1; i <= currentRoomCount; i++) {
    updateRoomDisplay(i);
  }
  updateUnassignedDisplay();
}

function setupEventListeners() {
  document.getElementById("room-count").addEventListener("input", (e) => {
    const newCount = parseInt(e.target.value);
    if (newCount >= 1 && newCount <= 10) {
      generateRooms();
      updateUnassignedDisplay();
    }
  });

  // Setup main room (unassigned) area as a drop zone
  const unassignedSection = document.getElementById("unassigned-section-box");
  const unassignedArea = document.getElementById("unassigned-members");

  unassignedSection.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    unassignedSection.classList.add("drag-over");
  });

  unassignedSection.addEventListener("dragleave", (e) => {
    e.stopPropagation();
    // Remove class only when we completely leave the section
    if (!unassignedSection.contains(e.relatedTarget)) {
      unassignedSection.classList.remove("drag-over");
    }
  });

  unassignedSection.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    unassignedSection.classList.remove("drag-over");

    const member = JSON.parse(e.dataTransfer.getData("text/plain"));
    console.log("Dropping member back to main room:", member);

    // Remove member from all room assignments
    Object.keys(roomAssignments).forEach((room) => {
      if (roomAssignments[room] && Array.isArray(roomAssignments[room])) {
        const oldLength = roomAssignments[room].length;
        roomAssignments[room] = roomAssignments[room].filter(
          (m) => m.email !== member.email,
        );
        if (roomAssignments[room].length !== oldLength) {
          console.log(`Removed member from room ${room}`);
        }
      }
    });

    // Remove any existing DOM element for this member across all sections
    const existingElements = document.querySelectorAll(
      `[id="member-${member.email}"]`,
    );
    existingElements.forEach((el) => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });

    // Update all room displays first to remove the member visually
    for (let i = 1; i <= currentRoomCount; i++) {
      updateRoomDisplay(i);
    }

    // Update unassigned display - this will add the member back to unassigned list
    updateUnassignedDisplay();
    console.log("Updated unassigned display");
  });
}

async function saveBreakoutRooms() {
  const baseRoomId = roomId.split(":")[0];
  const assignedEmails = new Set();
  let hasSaveFailure = false;

  try {
    await fetch(buildRoomDbUrl(), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomID: baseRoomId,
        shared_vc: sharedVcMode,
      }),
    });
  } catch (e) {
    console.error("Failed to save shared_vc flag on base room", e);
  }

  for (let roomnum = 1; roomnum <= currentRoomCount; roomnum++) {
    const response = await fetch(
      "https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/rooms/breakouts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room: baseRoomId,
          roomnum,
          view_only: Boolean(roomViewOnlyFlags[roomnum]),
          shared_vc: sharedVcMode,
        }),
      },
    );

    if (!response.ok) {
      console.error(`Failed to save room settings for room ${roomnum}`);
      hasSaveFailure = true;
    }
  }

  for (const roomnum in roomAssignments) {
    const members = roomAssignments[roomnum];

    for (const member of members) {
      assignedEmails.add(member.email);

      const response = await fetch(
        "https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/rooms/breakouts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            room: baseRoomId,
            user: member.email,
            roomnum: Number(roomnum),
            view_only: Boolean(roomViewOnlyFlags[Number(roomnum)]),
          }),
        },
      );

      if (!response.ok) {
        console.error(
          `Failed to add member ${member.email} to room ${roomnum}`,
        );
        hasSaveFailure = true;
      }
    }
  }

  for (const member of POTENTIAL_MEMBERS) {
    if (assignedEmails.has(member.email)) {
      continue;
    }

    const response = await fetch(
      "https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/rooms/breakouts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room: baseRoomId,
          user: member.email,
          roomnum: 0,
          view_only: false,
        }),
      },
    );

    if (!response.ok) {
      console.error(`Failed to add member ${member.email} to main room`);
      hasSaveFailure = true;
    }
  }

  if (hasSaveFailure) {
    alert(
      "Some breakout room changes failed to save. Check the console for details and try again after the lambda is updated.",
    );
    return;
  }

  if (typeof ablyInstance !== "undefined" && ablyInstance) {
    try {
      const controlChannel = ablyInstance.channels.get(
        `room:${baseRoomId}:control`,
      );
      await controlChannel.publish("breakout_refresh", {
        room: baseRoomId,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.error("Failed to broadcast breakout refresh", e);
    }
  }

  alert("Breakout room assignments saved successfully!");
  hideBreakoutRoomsPopup();
}

document
  .getElementById("breakout-rooms-popup")
  .addEventListener("click", (e) => {
    if (e.target.id === "breakout-rooms-popup") {
      hideBreakoutRoomsPopup();
    }
  });
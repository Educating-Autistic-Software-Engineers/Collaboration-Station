let breakSecsLeft = 0;
let isBreak = false;
let isDragging = false;
let activeTutorialsContainer = false;
let activeChatContainer = false;
let activeMemberContainer = false;
let viewType = "space";
let roomDict = {};
let tasks = [];
let tasksLoadedResolve;
window.tasksLoaded = new Promise(resolve => {
  tasksLoadedResolve = resolve;
});
let userIdInDisplayFrame = null;
let POTENTIAL_MEMBERS;

const messagesContainer = document.getElementById('messages');
const memberContainer = document.getElementById('members__container');
const memberButton = document.getElementById('members__button');
const tasksButton = document.getElementById('tasks__button');
const chatContainer = document.getElementById('messages__container');
const chatButton = document.getElementById('chat__button');
const rightBar = document.getElementById('right_bar');
const streamContainer = document.getElementById('stream__container');
const tutorialsContainer = document.getElementById('tutorials__container');
const chatPanel = document.getElementById('messages__container');
const expandBtn = document.getElementById('expand-btn');
const revertBtn = document.getElementById('revert-btn');
const mainStream = document.getElementById('main-stream');
const displayFrame = document.getElementById('stream__box');
const videoFrames = document.getElementsByClassName('video__container');
const slider = document.getElementById('slider');

messagesContainer.scrollTop = messagesContainer.scrollHeight;
let containerRect = rightBar.getBoundingClientRect();

const emojiData = {
  frequent: ["😀", "👍", "❤️", "😂", "🙌", "👏", "🔥", "🎉", "🤔", "👋", "🙏", "👀", "💯", "✅", "⭐", "🚀"],
};

function repeatKey(key, length) {
  const keyDigits = key.split('').map(Number);
  const repeatedKey = [];
  for (let i = 0; i < length; i++) {
    repeatedKey.push(keyDigits[i % keyDigits.length]);
  }
  
  return repeatedKey;
}

function decrypt(encryptedNumber, key) {
  const encryptedDigits = encryptedNumber.split('').map(Number);
  const repeatedKey = repeatKey(key, encryptedDigits.length);

  const decryptedDigits = encryptedDigits.map((num, index) => {
    const diff = num - repeatedKey[index];
    return diff < 0 ? diff + 10 : diff;
  });

  return decryptedDigits.join('');
}

if (!sessionStorage.getItem('email')) {
  let redirectWithView = 'false';
  if (roomId == null) {
    roomId = urlParams.get('view');
    redirectWithView = 'true';
  }
  window.location.href = `index.html?redirect=${roomId}&view=${redirectWithView}`;
}

if (roomId == null) {
  viewType = "view";
  roomId = decrypt(urlParams.get('view'), "90210");
}
if (roomId == null) {
  window.location.href = 'index.html';
}

async function load() {
  const response = await fetch("https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/roomDB");
  const roomsData = await response.json();
  const rooms = roomsData.requests;
  for (let room of rooms) {
    roomDict[room.room_id] = room;
  }
}

document.querySelector('#message__form').addEventListener('submit', sendMessage);


function setSliderPosition(offsetY) {
  const topHeight = offsetY - 100;
  const bottomHeight = containerRect.height - offsetY - 60;

  streamContainer.style.height = topHeight + 'px';
  chatPanel.style.height = bottomHeight + 'px';

  slider.style.top = (offsetY - (slider.clientHeight / 2)) - 20 + 'px';
}

function showAddMemberPopup() {
  const popup = document.getElementById('add-member-popup');
  popup.style.display = 'block';
}

function hideAddMemberPopup() {
  const popup = document.getElementById('add-member-popup');
  popup.style.display = 'none';
  document.getElementById('member-email-input').value = '';
}

async function addMemberToProject() {
  const emailInput = document.getElementById('member-email-input');
  const email = emailInput.value.trim();
  
  if (!email) {
    alert('Please enter a valid email address');
    return;
  }

  // Add user to room
  await fetch('https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/roomDB', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "roomID": roomId,
      "user": email
    })
  });

  // Add room to user's projects
  await fetch('https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/register', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "projects": roomId,
      "email": email,
    }) 
  });
  
  hideAddMemberPopup();
}

// Break management functions
function onBreakBtnClicked() {
  ablyChannel.publish('break', {secs: 600});
}

window.messagingReady.then(() => {
  ablyChannel.subscribe('break', (message) => {
    if (isBreak) {
      endBreak();
      return;
    }
    startBreak(message.data.secs);
  });
});

function startBreak(secs) {
  breakSecsLeft = secs;
  isBreak = true;
  document.getElementById('pause_overlay').style.visibility = 'visible';
  document.getElementById('break-btn').lastChild.nodeValue = ' End Break';
}

function endBreak() {
  breakSecsLeft = 0;
  isBreak = false;
  document.getElementById('pause_countdown').textContent = '00:00';
  document.getElementById('pause_overlay').style.visibility = 'hidden';
  document.getElementById('break-btn').lastChild.nodeValue = ' 10 Minute Break';
}

// Break timer
setInterval(() => {
  if (!isBreak) return;

  let minutes = Math.floor(breakSecsLeft / 60);
  let seconds = breakSecsLeft % 60;

  seconds = seconds < 10 ? '0' + seconds : seconds;

  document.getElementById('pause_countdown').textContent = `${minutes}:${seconds}`;

  if (breakSecsLeft <= 0) {
    endBreak();
  }
  breakSecsLeft--;
}, 1000);

// Member autocomplete
async function initAddMemberAutocomplete() {
  const resp = await fetch('https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/getAllItems');
  const data = await resp.json();

  POTENTIAL_MEMBERS = data.requests;

  const memberEmailInput = document.getElementById('member-email-input');
  const suggestionsContainer = document.createElement('div');
  suggestionsContainer.id = 'member-suggestions';
  suggestionsContainer.className = 'member-suggestions';
  memberEmailInput.parentNode.insertBefore(suggestionsContainer, memberEmailInput.nextSibling);

  // Handle input to show suggestions
  memberEmailInput.addEventListener('input', function () {
    const searchTerm = this.value.toLowerCase();
    const suggestions = POTENTIAL_MEMBERS.filter(member =>
      member.email.toLowerCase().includes(searchTerm) ||
      member.name.toLowerCase().includes(searchTerm)
    );

    suggestionsContainer.innerHTML = '';

    if (suggestions.length > 0 && searchTerm) {
      suggestionsContainer.style.display = 'block';

      suggestions.forEach(member => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';

        suggestionItem.innerHTML = `
          <div class="suggestion-name">${member.name}</div>
          <div class="suggestion-email">${member.email}</div>
        `;

        suggestionItem.addEventListener('click', () => {
          memberEmailInput.value = member.email;
          suggestionsContainer.style.display = 'none';
        });

        suggestionsContainer.appendChild(suggestionItem);
      });
    } else {
      suggestionsContainer.style.display = 'none';
    }
  });

  // Close suggestions when clicking outside
  document.addEventListener('click', function (event) {
    if (!memberEmailInput.contains(event.target) &&
      !suggestionsContainer.contains(event.target)) {
      suggestionsContainer.style.display = 'none';
    }
  });
}

// Refresh the members panel: show "present" vs "not present" members
async function refreshMembers() {
  try {
    const membersWrapper = document.getElementById('member__list');
    if (!membersWrapper) return;
    membersWrapper.innerHTML = '';

    let registered = [];
    try {
      const resp = await fetch(`https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/roomDB?roomId=${roomId}`);
      if (resp.ok) {
        const data = await resp.json();
        console.log(data);
        if (data) {
          if (data.request) {
            tasks = data.request.tasks || [];
            if (tasksLoadedResolve) {
              tasksLoadedResolve();
              tasksLoadedResolve = null;
            }
            if (Array.isArray(data.request.editors)) registered = data.request.editors;
            else if (Array.isArray(data.request.users)) registered = data.request.users;
          } else if (Array.isArray(data.editors)) {
            registered = data.editors;
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch room registered members', e);
    }

    if ((!registered || registered.length === 0) && roomDict[roomId] && Array.isArray(roomDict[roomId].editors)) {
      registered = roomDict[roomId].editors;
    }

    let present = [];
    try {
      if (window.getCurrentPresence) {
        present = await window.getCurrentPresence();
      }
    } catch (e) {
      console.error('Failed to get current presence', e);
    }

    const presentSet = new Set(present || []);

    // Emoji map for selected emoji IDs
    const emojiMap = {1:'😀',2:'🎨',3:'🚀',4:'⭐',5:'🎯',6:'🏆',7:'💎',8:'👑',9:'🔥',10:'⚡',11:'🌟',12:'🦄'};

    const findMember = (email) => {
      if (POTENTIAL_MEMBERS && Array.isArray(POTENTIAL_MEMBERS)) {
        const m = POTENTIAL_MEMBERS.find(x => x.email === email);
        if (m) return m;
      }
      return { email, name: email };
    };

    const getUserEmoji = (member) => {
      if (member.selectedEmoji && emojiMap[member.selectedEmoji]) {
        return emojiMap[member.selectedEmoji];
      }
      return member.emoji || '😊';
    };

    const presentRegistered = (registered || []).filter(e => presentSet.has(e));
    const notPresentRegistered = (registered || []).filter(e => !presentSet.has(e));

    // Create or get profile overlay element
    let profileOverlay = document.getElementById('member-profile-overlay');
    if (!profileOverlay) {
      profileOverlay = document.createElement('div');
      profileOverlay.id = 'member-profile-overlay';
      profileOverlay.className = 'user-profile-overlay';
      profileOverlay.innerHTML = `
        <div class="profile-content">
          <div class="profile-emoji"></div>
          <div class="profile-name"></div>
          <div class="profile-role"></div>
          <div class="profile-tasks"></div>
        </div>
      `;
      document.body.appendChild(profileOverlay);

      // Keep popup visible when hovering over it
      profileOverlay.addEventListener('mouseenter', () => {
        profileOverlay.classList.add('visible');
      });
      profileOverlay.addEventListener('mouseleave', () => {
        profileOverlay.classList.remove('visible');
      });
    }

    const attachHoverEvents = (wrapper, member) => {
      wrapper.addEventListener('mouseenter', (e) => {
        const rect = wrapper.getBoundingClientRect();
        const popupWidth = 180;
        const screenWidth = window.innerWidth;
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        
        // Calculate position - try left side first (since this is in sidebar)
        let xPos = rect.left - popupWidth - 10;
        
        // Check if popup would go off-screen on the left
        if (xPos < scrollX) {
            // Position on the right side instead
            xPos = rect.right + 10;
            
            // If it would also go off-screen on the right, center it
            if (xPos + popupWidth > screenWidth + scrollX) {
                xPos = Math.max(scrollX + 10, (screenWidth + scrollX - popupWidth) / 2);
            }
        }
        
        const yPos = rect.top + (rect.height / 2);

        profileOverlay.style.left = xPos + 'px';
        profileOverlay.style.top = yPos + 'px';
        profileOverlay.style.transform = 'translateY(-50%)';

        // Update content
        profileOverlay.querySelector('.profile-emoji').textContent = getUserEmoji(member);
        profileOverlay.querySelector('.profile-name').textContent = member.name || member.email;
        profileOverlay.querySelector('.profile-role').textContent = member.role === 'TA' ? 'Teaching Assistant' : 'Student';
        const tasksCount = member.tasksCompleted || member.tasks_completed || 0;
        profileOverlay.querySelector('.profile-tasks').textContent = `${tasksCount} tasks completed`;

        // Apply fire or ice effect randomly
        profileOverlay.classList.remove('effect-fire', 'effect-ice');
        profileOverlay.classList.add(Math.random() < 0.5 ? 'effect-fire' : 'effect-ice');

        profileOverlay.classList.add('visible');
      });

      wrapper.addEventListener('mouseleave', () => {
        setTimeout(() => {
          if (!profileOverlay.matches(':hover')) {
            profileOverlay.classList.remove('visible');
          }
        }, 50);
      });
    };

    if (presentRegistered.length > 0) {
      const header = `<div class="members-section-heading online-heading">Online (${presentRegistered.length})</div>`;
      membersWrapper.insertAdjacentHTML('beforeend', header);
    }
    for (const email of presentRegistered) {
      const member = findMember(email);
      const emoji = getUserEmoji(member);
      const role = sessionStorage.getItem('role');
      const removeButton = role === 'TA' ? `<button class="remove__btn" onclick="removeParticipant('${email}')"><i class="fas fa-user-times"></i></button>` : '';
      const muteButton = role === 'TA' ? `<button class="mute__btn" onclick="muteParticipant('${email}')"><i class='fas fa-volume-mute'></i></button>` : '';
      const disableMessages = role === 'TA' ? `<button class="disableMessage__btn" onclick="disableMessage('${email}')"><i class='fas fa-comment-slash' style='font-size:15px'></i></button>` : '';
      const wrapper = document.createElement('div');
      wrapper.className = 'member__wrapper';
      wrapper.id = `member__${email}__wrapper`;
      wrapper.innerHTML = `
        <span class="green__icon"></span>
        <span class="member-avatar">${emoji}</span>
        <p class="member_name">${member.name || email}</p>
        <span class="member_name_buttons">
          ${removeButton}
          ${muteButton}
          ${disableMessages}
        </span>
      `;
      membersWrapper.appendChild(wrapper);
      attachHoverEvents(wrapper, member);
    }

    // Render not-present members
    if (notPresentRegistered.length > 0) {
      const header2 = `<div class="members-section-heading offline-heading">Offline (${notPresentRegistered.length})</div>`;
      membersWrapper.insertAdjacentHTML('beforeend', header2);
    }
    for (const email of notPresentRegistered) {
      const member = findMember(email);
      const emoji = getUserEmoji(member);
      const wrapper = document.createElement('div');
      wrapper.className = 'member__wrapper offline';
      wrapper.id = `member__${email}__wrapper`;
      wrapper.innerHTML = `
        <span class="gray__icon"></span>
        <span class="member-avatar">${emoji}</span>
        <p class="member_name">${member.name || email}</p>
      `;
      membersWrapper.appendChild(wrapper);
      attachHoverEvents(wrapper, member);
    }

    // If nothing registered but presence exists, show present users
    if ((!registered || registered.length === 0) && present && present.length > 0) {
      for (const email of present) {
        const member = findMember(email);
        const emoji = getUserEmoji(member);
        const wrapper = document.createElement('div');
        wrapper.className = 'member__wrapper';
        wrapper.id = `member__${email}__wrapper`;
        wrapper.innerHTML = `
          <span class="green__icon"></span>
          <span class="member-avatar">${emoji}</span>
          <p class="member_name">${member.name || email}</p>
        `;
        membersWrapper.appendChild(wrapper);
        attachHoverEvents(wrapper, member);
      }
    }

    // Update counts
    const totalRegistered = (registered && registered.length) || (present && present.length) || 0;
    document.getElementById('members__count').innerText = totalRegistered;
    document.getElementById('connectedCount').innerText = (present && present.length) || 0;

  } catch (e) {
    console.error('refreshMembers error', e);
  }
}

// Emoji selector initialization
function initEmojiSelector() {
  const emojiButton = document.getElementById('emoji-button');
  const emojiSelector = document.getElementById('emoji-selector');
  const emojiOverlay = document.getElementById('emoji-overlay');
  const emojiContent = document.getElementById('emoji-content');
  const emojiTabs = document.querySelectorAll('.emoji-tab');
  const messageInput = document.querySelector('#message__form input[name="message"]');
  
  // Show emoji selector when clicking the emoji button
  emojiButton.addEventListener('click', function() {
    emojiSelector.style.display = 'flex';
    emojiOverlay.style.display = 'block';
    
    // Load frequent emojis by default if no category is active
    if (!document.querySelector('.emoji-tab.active')) {
      document.querySelector('[data-category="frequent"]').classList.add('active');
      loadEmojis('frequent');
    }
  });
  
  // Hide emoji selector when clicking outside
  emojiOverlay.addEventListener('click', function() {
    emojiSelector.style.display = 'none';
    emojiOverlay.style.display = 'none';
  });
  
  // Handle tab switching
  emojiTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // Remove active class from all tabs
      emojiTabs.forEach(t => t.classList.remove('active'));
      
      // Add active class to clicked tab
      this.classList.add('active');
      
      // Load emojis for the selected category
      const category = this.getAttribute('data-category');
      loadEmojis(category);
    });
  });
  
  // Function to load emojis for a specific category
  function loadEmojis(category) {
    emojiContent.innerHTML = '';
    
    const emojis = emojiData[category] || [];
    emojis.forEach(emoji => {
      const emojiElement = document.createElement('div');
      emojiElement.className = 'emoji';
      emojiElement.textContent = emoji;
      emojiElement.addEventListener('click', function() {
        // Insert emoji at cursor position
        insertAtCursor(messageInput, emoji);
        
        // Hide emoji selector
        emojiSelector.style.display = 'none';
        emojiOverlay.style.display = 'none';
        
        // Focus back on input
        messageInput.focus();
      });
      emojiContent.appendChild(emojiElement);
    });
  }
  
  // Function to insert text at cursor position
  function insertAtCursor(input, text) {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const value = input.value;
    
    input.value = value.substring(0, start) + text + value.substring(end);
    
    // Move cursor position after the inserted text
    input.selectionStart = input.selectionEnd = start + text.length;
  }
}

// DOM Content Loaded event handler
window.messagingReady.then(async () => {
  await load();


  sessionStorage.setItem('randomColor', ["red", "green", "blue", "teal", "salmon", "goldenrod"][Math.floor(Math.random() * 6)]);
  
  console.log("roomID: ", String(roomId), viewType);
  const iFrame = document.getElementById("main-stream");
  iFrame.src = `vm/index.html?${viewType}=${String(roomId)}&name=${sessionStorage.getItem('display_name')}&color=${sessionStorage.getItem("randomColor")}`;
  
  slider.addEventListener('mousedown', function(event) {
    isDragging = true;
  });
  
  
  document.addEventListener('mouseup', function() {
    isDragging = false;
  });

  // toggleChat();
  initAddMemberAutocomplete();
  
  document.getElementById('cancel-add-member').addEventListener('click', hideAddMemberPopup);
  document.getElementById('confirm-add-member').addEventListener('click', addMemberToProject);

  if (memberButton) {
    memberButton.addEventListener('click', async () => {
      activeMemberContainer = !activeMemberContainer;
      memberContainer.classList.toggle('active', activeMemberContainer);
      if (activeMemberContainer) {
        await refreshMembers();
      }
    });
  }
  
  // addResizeHandle();
});

function onProjectsButtonClicked() {
  let email = sessionStorage.getItem('email'); 
  window.location = 'projects.html?email=' + email;
}

let inactivityTimeout;
const inactivityDuration = 3 * 60 * 60 * 1000; // 3 hours

function resetInactivityTimeout() {
  clearTimeout(inactivityTimeout);
  inactivityTimeout = setTimeout(() => {
    window.location.href = `projects.html?email=${sessionStorage.getItem("email")}`;
  }, inactivityDuration);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    document.title = 'Collaboration Station!';
  } else {
    document.title = 'Collaboration Station!';
  }
});

document.addEventListener('mousemove', resetInactivityTimeout);



resetInactivityTimeout();
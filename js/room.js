let breakSecsLeft = 0;
let isBreak = false;
let isDragging = false;
let activeTutorialsContainer = false;
let activeChatContainer = false;
let activeMemberContainer = false;
let viewType = "space";
let roomDict = {};
let userIdInDisplayFrame = null;
let POTENTIAL_MEMBERS;

const messagesContainer = document.getElementById('messages');
const memberContainer = document.getElementById('members__container');
const memberButton = document.getElementById('members__button');
const tutorialsButton = document.getElementById('videos__button');
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

console.log(sessionStorage);
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
  const response = await fetch("https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/roomDB");
  const roomsData = await response.json();
  const rooms = roomsData.requests;
  for (let room of rooms) {
    roomDict[room.room_id] = room;
  }
}

document.querySelector('#message__form').addEventListener('submit', sendMessage);
memberButton.addEventListener('click', toggleMembers);
tutorialsButton.addEventListener('click', toggleTutorial);

function toggleMembers() {
  if (activeMemberContainer) {
    memberContainer.style.display = 'none';
  } else {
    memberContainer.style.display = 'block';
  }

  // account for rightbar width
  memberContainer.style.width = rightBar.style.width;

  if (activeChatContainer) {
    toggleChat(true);
  }

  activeMemberContainer = !activeMemberContainer;
}

async function toggleTutorial() {
  if (activeMemberContainer) {
    toggleMembers();
  }
  if (activeChatContainer) {
    toggleChat();
  }

  activeTutorialsContainer = !activeTutorialsContainer;
  tutorialsContainer.style.display = activeTutorialsContainer ? 'block' : 'none';
  tutorialsContainer.style.width = rightBar.style.width;
}

function toggleDropdown(contentId, button) {
  const content = document.getElementById(contentId);
  const chevron = button.querySelector('.chevron');
  
  content.classList.toggle('active');
  chevron.classList.toggle('active');
}

const scratchVids = ["1", "2"];
function toggleVideo(videoId) {
  const video = document.getElementById('video' + videoId);
  console.log(videoId, scratchVids, videoId in scratchVids);
  if (scratchVids.includes(String(videoId))) {
    innerChannel.publish('video', {videoId: videoId});
    return;
  } 
  if (video.style.display === 'none') {
    video.style.display = 'block';
  } else {
    video.style.display = 'none';
  }
}

chatButton.addEventListener('click', toggleChat);

function toggleChat(influenceMembers = false) {
  if (activeTutorialsContainer) {
    toggleTutorial();
  }

  if (activeChatContainer) {
    chatContainer.style.display = 'none';
  } else {
    chatContainer.style.display = 'block';
    unreadMessages = 0;
    updateMessageCounter();
  }

  if (activeMemberContainer && influenceMembers) {
    toggleMembers();
  }

  activeChatContainer = !activeChatContainer;
  if (activeChatContainer) {
    moveSlider({clientY: containerRect.height * 0.5}, true);
  } else {
    moveSlider({clientY: containerRect.height - 20}, true);
  }
  
  const messageForm = document.getElementById('message__form');
  if (messageForm && rightBar) {
    messageForm.style.width = (rightBar.offsetWidth - 20) + 'px';
  }
}

let expandVideoFrame = (e) => {
  let child = displayFrame.children[0];
  if (child) {
    document.getElementById('stream__container').appendChild(child);
  }

  displayFrame.style.display = 'block';
  displayFrame.appendChild(e.currentTarget);
  userIdInDisplayFrame = e.currentTarget.id;

  for (let i = 0; i < videoFrames.length; i++) {
    if (videoFrames[i].id != userIdInDisplayFrame) {
      videoFrames[i].style.height = '136px';
      videoFrames[i].style.width = '136px';
    }
  }
}

for (let i = 0; i < videoFrames.length; i++) {
  videoFrames[i].addEventListener('click', expandVideoFrame);
}

let hideDisplayFrame = () => {
  userIdInDisplayFrame = null;
  displayFrame.style.display = null;

  let child = displayFrame.children[0];
  document.getElementById('stream__container').appendChild(child);

  for (let i = 0; i < videoFrames.length; i++) {
    videoFrames[i].style.height = '300px';
    videoFrames[i].style.width = '300px';
  }
}

displayFrame.addEventListener('click', hideDisplayFrame);

// Slider movement function
function moveSlider(event, override = false) {
  if (!isDragging && !override) return;
  
  if (activeChatContainer) {
    slider.style.display = 'block';
  } else {
    slider.style.display = 'none';
  }

  containerRect = rightBar.getBoundingClientRect();
  
  let offsetY = event.clientY - containerRect.top;

  // Constrain slider position
  if (offsetY < 200) offsetY = 200;
  if (offsetY > containerRect.height * 0.8 && !override) offsetY = containerRect.height * 0.8;

  setSliderPosition(offsetY);
  
  tutorialsContainer.style.width = rightBar.style.width;
  memberContainer.style.width = rightBar.style.width;
}

// Handle window resize
window.addEventListener('resize', () => {
  toggleChat();
  toggleChat(); 
});

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
  await fetch('https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/roomDB', {
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
  await fetch('https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/register', {
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

ablyChannel.subscribe('break', (message) => {
  if (isBreak) {
    endBreak();
    return;
  }
  startBreak(message.data.secs);
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
  const resp = await fetch('https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/getAllItems');
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
document.addEventListener('DOMContentLoaded', async () => {
  await load();

  initEmojiSelector();

  // Set random color for user
  sessionStorage.setItem('randomColor', ["red", "green", "blue", "teal", "salmon", "goldenrod"][Math.floor(Math.random() * 6)]);
  
  // Initialize iframe source
  console.log("roomID: ", String(roomId), viewType);
  const iFrame = document.getElementById("main-stream");
  iFrame.src = `vm/index.html?${viewType}=${String(roomId)}&name=${sessionStorage.getItem('display_name')}&color=${sessionStorage.getItem("randomColor")}`;
  
  // Set up slider dragging
  slider.addEventListener('mousedown', function(event) {
    isDragging = true;
  });
  
  document.addEventListener('mousemove', moveSlider);
  
  document.addEventListener('mouseup', function() {
    isDragging = false;
  });

  // Initialize UI
  toggleChat();
  initAddMemberAutocomplete();
  
  // Add event listeners for member management
  document.getElementById('cancel-add-member').addEventListener('click', hideAddMemberPopup);
  document.getElementById('confirm-add-member').addEventListener('click', addMemberToProject);
  
  // Add resize handle
  addResizeHandle();
});

// Project navigation
function onProjectsButtonClicked() {
  let email = sessionStorage.getItem('email'); 
  window.location = 'projects.html?email=' + email;
}

// Expand/collapse UI
expandBtn.addEventListener('click', () => {
  mainStream.style.width = '100%';
  rightBar.style.display = 'none';
  expandBtn.style.display = 'none';
  revertBtn.style.display = 'block';
  if (activeMemberContainer) {
    toggleMembers();
  }
});

revertBtn.addEventListener('click', () => {
  mainStream.style.width = '100%';
  expandBtn.style.display = 'block';
  rightBar.style.display = 'block';
  revertBtn.style.display = 'none';
});

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
    document.title = 'You are still sharing video/audio';
  } else {
    document.title = 'Collaboration Station!';
  }
});

document.addEventListener('mousemove', resetInactivityTimeout);

function addResizeHandle() {
  const resizeHandle = document.getElementById('resize-handle');
  
  let isResizing = false;
  let initialX;
  let initialWidth;

  const iframeShield = document.createElement('div');
  iframeShield.style.position = 'fixed';
  iframeShield.style.top = '0';
  iframeShield.style.left = '0';
  iframeShield.style.width = '100vw';
  iframeShield.style.height = '100vh';
  iframeShield.style.zIndex = '9999';
  iframeShield.style.cursor = 'ew-resize';
  iframeShield.style.background = 'transparent';
  iframeShield.style.pointerEvents = 'auto';

  function startResize(e) {
    isResizing = true;
    initialX = e.clientX;
    initialWidth = rightBar.offsetWidth;
    resizeHandle.classList.add('active');

    document.body.style.userSelect = 'none';

    document.body.appendChild(iframeShield);

    e.preventDefault();
  }

  function performResize(e) {
    if (!isResizing) return;

    const deltaX = initialX - e.clientX;
    const newWidth = Math.max(250, Math.min(600, initialWidth + deltaX));

    rightBar.style.width = newWidth + 'px';
    mainStream.style.width = `calc(100% - ${newWidth + 10}px)`;

    const messageForm = document.getElementById('message__form');
    if (messageForm) {
      messageForm.style.width = (newWidth - 20) + 'px';
    }

    if (typeof containerRect !== 'undefined') {
      containerRect = rightBar.getBoundingClientRect();
    }

    tutorialsContainer.style.width = rightBar.style.width;
    memberContainer.style.width = rightBar.style.width;
  }

  function stopResize() {
    if (!isResizing) return;

    isResizing = false;
    resizeHandle.classList.remove('active');
    document.body.style.userSelect = '';

    // Remove the iframe shield
    if (document.body.contains(iframeShield)) {
      document.body.removeChild(iframeShield);
    }

    if (typeof moveSlider === 'function' && activeChatContainer) {
      moveSlider({ clientY: containerRect.height * 0.5 }, true);
    }
  }

  function resetToDefault() {
    const defaultWidth = 303;
    rightBar.style.width = defaultWidth + 'px';
    mainStream.style.width = `calc(100% - ${defaultWidth + 10}px)`;

    if (typeof containerRect !== 'undefined') {
      containerRect = rightBar.getBoundingClientRect();

      if (typeof moveSlider === 'function' && activeChatContainer) {
        moveSlider({ clientY: containerRect.height * 0.5 }, true);
      }
    }
  }

  resizeHandle.addEventListener('mousedown', startResize);
  document.addEventListener('mousemove', performResize);
  document.addEventListener('mouseup', stopResize);
  resizeHandle.addEventListener('dblclick', resetToDefault);
}

if (expandBtn && revertBtn) {
  const originalMainStreamWidth = mainStream.style.width;
  const originalRightBarWidth = rightBar.style.width || '303px';

  expandBtn.addEventListener('click', function () {
    mainStream.style.width = '100%';
    rightBar.style.display = 'none';
    expandBtn.style.display = 'none';
    revertBtn.style.display = 'block';
    if (activeMemberContainer) {
      toggleMembers();
    }
  });

  revertBtn.addEventListener('click', function () {
    mainStream.style.width = originalMainStreamWidth || `calc(100% - ${parseInt(originalRightBarWidth) + 10}px)`;
    rightBar.style.display = 'block';
    rightBar.style.width = originalRightBarWidth;
    expandBtn.style.display = 'block';
    revertBtn.style.display = 'none';
  });
}


resetInactivityTimeout();
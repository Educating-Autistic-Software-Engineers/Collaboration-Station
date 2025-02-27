let breakSecsLeft = 0;
let isBreak = false;

let messagesContainer = document.getElementById('messages');
messagesContainer.scrollTop = messagesContainer.scrollHeight;

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
const mainStream= document.getElementById('main-stream')
let containerRect = rightBar.getBoundingClientRect()

let activeTutorialsContainer = false;
let activeChatContainer = false;
let activeMemberContainer = false;
let isDragging = false;

var POTENTIAL_MEMBERS


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


const queryString = window.location.search
const urlParams = new URLSearchParams(queryString)
let roomId = urlParams.get('project')
let viewType = "space"

console.log(sessionStorage)
if (!sessionStorage.getItem('email'))  {
  var redirectWithView = 'false'
  if (roomId == null) {
    roomId = urlParams.get('view')
    redirectWithView = 'true'
  }
  window.location.href = 'index.html?redirect='+roomId+'&view='+redirectWithView;
}

if (roomId == null) {
  viewType = "view"
  roomId = decrypt(urlParams.get('view'), "90210")
}
if (roomId == null) {
  window.location.href = 'index.html';
}

let roomDict = {}
async function load() {
  const datresp = await fetch("https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/roomDB");
  const roomsj = await datresp.json();
  const rooms = roomsj.requests;
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

}


function toggleDropdown(contentId, button) {
  const content = document.getElementById(contentId);
  const chevron = button.querySelector('.chevron');
  
  content.classList.toggle('active');
  chevron.classList.toggle('active');
}

const scratchVids = ["1", "2"]
function toggleVideo(videoId) {
  const video = document.getElementById('video' + videoId);
  console.log(videoId, scratchVids, videoId in scratchVids)
  if ( scratchVids.includes( String(videoId) ) ) {
    innerChannel.publish('video', {videoId: videoId});
    return
  } 
  if (video.style.display === 'none') {
      video.style.display = 'block';
  } else {
      video.style.display = 'none';
  }
}


chatButton.addEventListener('click', toggleChat);

function toggleChat (influenceMembers=false) {

  if (activeTutorialsContainer) {
    toggleTutorial();
  }

  if (activeChatContainer) {
    chatContainer.style.display = 'none';
  } else {
    chatContainer.style.display = 'block';
    unreadMessages=0;
    updateMessageCounter();
  }

  if (activeMemberContainer && influenceMembers) {
    toggleMembers();
  }

  activeChatContainer = !activeChatContainer;
  if (activeChatContainer) {
    moveSlider({clientY: containerRect.height*0.5}, true);
  } else {
    moveSlider({clientY: containerRect.height-20}, true);
  }
}

//moveSlider({clientY: containerRect.height-20}, true);
let displayFrame = document.getElementById('stream__box')
let videoFrames = document.getElementsByClassName('video__container')
let userIdInDisplayFrame = null;

let expandVideoFrame = (e) => {

  let child = displayFrame.children[0]
  if(child){
      document.getElementById('stream__container').appendChild(child)
  }

  displayFrame.style.display = 'block'
  displayFrame.appendChild(e.currentTarget)
  userIdInDisplayFrame = e.currentTarget.id

  for(let i = 0; videoFrames.length > i; i++){
    if(videoFrames[i].id != userIdInDisplayFrame){
      videoFrames[i].style.height = '136px'
      videoFrames[i].style.width = '136px'
    }
  }

}

for(let i = 0; videoFrames.length > i; i++){
  videoFrames[i].addEventListener('click', expandVideoFrame)
}


let hideDisplayFrame = () => {
    userIdInDisplayFrame = null
    displayFrame.style.display = null

    let child = displayFrame.children[0]
    document.getElementById('stream__container').appendChild(child)

    for(let i = 0; videoFrames.length > i; i++){
      videoFrames[i].style.height = '300px'
      videoFrames[i].style.width = '300px'
  }
}

displayFrame.addEventListener('click', hideDisplayFrame)

function moveSlider(event, ov=false) {

  if (!isDragging && !ov) return;
  if (activeChatContainer) {
    slider.style.display = 'block'
  } else {
    slider.style.display = 'none'
  }

  containerRect = rightBar.getBoundingClientRect()
  
  let offsetY = event.clientY - containerRect.top;

  if (offsetY < 200) offsetY = 200;
  if (offsetY > containerRect.height * 0.8 && !ov) offsetY = containerRect.height *0.8;

  setSliderPosition(offsetY);
}

window.addEventListener('resize', ()=>{
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

setInterval(() => {

  if (!isBreak) {
    return;
  }

  let minutes = Math.floor(breakSecsLeft / 60);
  let seconds = breakSecsLeft % 60;

  seconds = seconds < 10 ? '0' + seconds : seconds;

  document.getElementById('pause_countdown').textContent = `${minutes}:${seconds}`;

  if (breakSecsLeft <= 0) {
    endBreak();
  }
  breakSecsLeft--;
}, 1000);


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

  await fetch('https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/roomDB', {
    method: 'PATCH',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        "roomID": roomId,
        "user": email
    })
  })

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


async function initAddMemberAutocomplete() {
  const resp = await fetch('https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/getAllItems')
  const data = await resp.json()

  POTENTIAL_MEMBERS = data.requests;

  const memberEmailInput = document.getElementById('member-email-input');
  const suggestionsContainer = document.createElement('div');
  suggestionsContainer.id = 'member-suggestions';
  suggestionsContainer.className = 'member-suggestions';
  memberEmailInput.parentNode.insertBefore(suggestionsContainer, memberEmailInput.nextSibling);

  suggestionsContainer.style.display = 'none';
  suggestionsContainer.style.position = 'absolute';
  suggestionsContainer.style.width = 'calc(100% - 4rem)';
  suggestionsContainer.style.maxHeight = '200px';
  suggestionsContainer.style.overflowY = 'auto';
  suggestionsContainer.style.backgroundColor = 'rgba(15, 23, 42, 0.9)';
  suggestionsContainer.style.border = '1px solid rgba(255, 255, 255, 0.1)';
  suggestionsContainer.style.borderRadius = '8px';
  suggestionsContainer.style.marginTop = '5px';
  suggestionsContainer.style.zIndex = '10';

  memberEmailInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const suggestions = POTENTIAL_MEMBERS.filter(member => 
      member.email.toLowerCase().includes(searchTerm) || 
      member.name.toLowerCase().includes(searchTerm)
    );

    // Clear previous suggestions
    suggestionsContainer.innerHTML = '';

    if (suggestions.length > 0 && searchTerm) {
      suggestionsContainer.style.display = 'block';
      
      suggestions.forEach(member => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.style.padding = '10px';
        suggestionItem.style.cursor = 'pointer';
        suggestionItem.style.color = 'white';
        suggestionItem.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
        
        suggestionItem.innerHTML = `
          <div style="font-weight: bold;">${member.name}</div>
          <div style="color: rgba(255, 255, 255, 0.5); font-size: 0.8em;">${member.email}</div>
        `;

        suggestionItem.addEventListener('mouseover', () => {
          suggestionItem.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        });

        suggestionItem.addEventListener('mouseout', () => {
          suggestionItem.style.backgroundColor = 'transparent';
        });

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
  document.addEventListener('click', function(event) {
    if (!memberEmailInput.contains(event.target) && 
        !suggestionsContainer.contains(event.target)) {
      suggestionsContainer.style.display = 'none';
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await load()

  sessionStorage.setItem('randomColor', ["red", "green", "blue", "teal", "salmon", "goldenrod"][Math.floor(Math.random() * 6)]);
  
  const openChatBtn = document.getElementById('openChatBtn');
  const closeChatBtn = document.getElementById('closeChatBtn');
  const projectsButton = document.getElementById('create__room__btn');
  const slider = document.getElementById('slider');
  const iFrame = document.getElementById("main-stream");
  const endMeetingButton = document.getElementById('end-meeting-btn');
  // const projectNameTextEdit = document.getElementById('room_label');
  
  // projectNameTextEdit.value = roomDict[roomId].name;
  
  console.log("roomID: ", String(roomId), viewType);
  iFrame.src = "vm/index.html?" + viewType + "=" + String(roomId) + "&name=" + sessionStorage.getItem('display_name') + "&color=" + sessionStorage.getItem("randomColor");
  
  slider.addEventListener('mousedown', function (event) {
    isDragging = true;
  });
  
  document.addEventListener('mousemove', moveSlider);
  
  document.addEventListener('mouseup', function () {
    isDragging = false;
  });

  toggleChat()
  initAddMemberAutocomplete();
  
  document.getElementById('cancel-add-member').addEventListener('click', hideAddMemberPopup);
  document.getElementById('confirm-add-member').addEventListener('click', addMemberToProject);

});

function onProjectsButtonClicked() {
  let email = sessionStorage.getItem('email'); 
  window.location = 'projects.html?email=' + email;
}

expandBtn.addEventListener('click', () => {
  // roomContainer.classList.add('expanded');
  mainStream.style.width='10000000%';
  rightBar.style.display = 'none';
  expandBtn.style.display = 'none';
  revertBtn.style.display = 'block';
  if(activeMemberContainer) {
    toggleMembers();
  }
});

revertBtn.addEventListener('click', () => {
  // roomContainer.classList.remove('expanded');
  mainStream.style.width='100%';
  expandBtn.style.display = 'block';
  rightBar.style.display = 'block';
  revertBtn.style.display = 'none';
});

// Set up inactivity timeout
let inactivityTimeout;
const inactivityDuration = 3 * 60 * 60 * 1000//15 * 60 * 1000; // 15 minutes

function resetInactivityTimeout() {
  clearTimeout(inactivityTimeout);
  inactivityTimeout = setTimeout(() => {
    window.location.href = `projects.html?email=${sessionStorage.getItem("email")}`; // Redirect to another page
  }, inactivityDuration);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Add logic here to notify the user, maybe via push notification or title change
    document.title = 'You are still sharing video/audio';
  } else {
    document.title = 'Collaboration Station!';
  }
});

// Reset timeout on any mouse movement
document.addEventListener('mousemove', resetInactivityTimeout);

// Initialize the timeout
resetInactivityTimeout();
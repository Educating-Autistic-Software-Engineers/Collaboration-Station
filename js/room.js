let messagesContainer = document.getElementById('messages');
messagesContainer.scrollTop = messagesContainer.scrollHeight;

const memberContainer = document.getElementById('members__container');
const memberButton = document.getElementById('members__button');

const chatContainer = document.getElementById('messages__container');
const chatButton = document.getElementById('chat__button');

const rightBar = document.getElementById('right_bar');
const streamContainer = document.getElementById('stream__container');
const chatPanel = document.getElementById('messages__container');
const containerRect = rightBar.getBoundingClientRect()

let activeMemberContainer = false;
let isDragging = false;


const queryString = window.location.search
const urlParams = new URLSearchParams(queryString)
let roomId = urlParams.get('project')

let roomDict = {}
async function load() {
  const datresp = await fetch("https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/roomDB");
  const roomsj = await datresp.json();
  const rooms = roomsj.requests;
  for (let room of rooms) {
    roomDict[room.room_id] = room;
  }
}

if (sessionStorage.getItem('email') == null) {
  window.location.href = 'index.html';
}

memberButton.addEventListener('click', () => {
  if (activeMemberContainer) {
    memberContainer.style.display = 'none';
  } else {
    memberContainer.style.display = 'block';
  }

  activeMemberContainer = !activeMemberContainer;
});

let activeChatContainer = false;

chatButton.addEventListener('click', () => {
  if (activeChatContainer) {
    chatContainer.style.display = 'none';
  } else {
    chatContainer.style.display = 'block';
  }

  activeChatContainer = !activeChatContainer;
  if (activeChatContainer) {
    moveSlider({clientY: 140}, true);
  } else {
    moveSlider({clientY: containerRect.height}, true);
  }
});

moveSlider({clientY: containerRect.height}, true);
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
      videoFrames[i].style.height = '100px'
      videoFrames[i].style.width = '100px'
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
  
  //const containerRect = rightBar.getBoundingClientRect();
  let offsetY = event.clientY - containerRect.top;

  if (offsetY < 200) offsetY = 200;
  if (offsetY > containerRect.height * 0.8 && !ov) offsetY = containerRect.height *0.8;

  setSliderPosition(offsetY);
}

function setSliderPosition(offsetY) {
  const topHeight = offsetY - 163;
  const bottomHeight = containerRect.height - offsetY;

  streamContainer.style.height = topHeight + 'px';
  chatPanel.style.height = bottomHeight + 'px';

  slider.style.top = (offsetY - (slider.clientHeight / 2)) + 'px';
}

document.addEventListener('DOMContentLoaded', async () => {
  await load()
  
  const openChatBtn = document.getElementById('openChatBtn');
  const closeChatBtn = document.getElementById('closeChatBtn');
  const projectsButton = document.getElementById('create__room__btn');
  const slider = document.getElementById('slider');
  const iFrame = document.getElementById("main-stream");
  const projectNameTextEdit = document.getElementById('room_label');

  projectNameTextEdit.value = roomDict[roomId].name;

  iFrame.src = "vm/index.html?space=" + roomId.toString() + "&name=" + sessionStorage.getItem('display_name');

  slider.addEventListener('mousedown', function (event) {
    isDragging = true;
  });

  document.addEventListener('mousemove', moveSlider);

  document.addEventListener('mouseup', function () {
    isDragging = false;
  });

  openChatBtn.addEventListener('click', () => {
      chatPanel.style.display = 'block';
      openChatBtn.style.display="none";
      closeChatBtn.style.display="block";
  });

  closeChatBtn.addEventListener('click', () => {
      chatPanel.style.display = 'none';
      closeChatBtn.style.display='none';
      openChatBtn.style.display='block';
  });


  // projectsButton.addEventListener('click', () => {
  //   let email = sessionStorage.getItem('email'); 
  //   console.log(email); 
  //   window.location = 'projects.html?email=' + email;
  // });


});

function onProjectsButtonClicked() {
  let email = sessionStorage.getItem('email'); 
  window.location = 'projects.html?email=' + email;
}
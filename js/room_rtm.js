let unreadMessages=0;

let handleMemberJoined = async (MemberId) => {
    console.log('A new member has joined the room:', MemberId)
    addMemberToDom(MemberId)

    let members = await channel.getMembers()
    updateMemberTotal(members)

    let {name} = await rtmClient.getUserAttributesByKeys(MemberId, ['name'])
    addBotMessageToDom(`Welcome to the room ${name}! 👋`)
}

let addMemberToDom = async (MemberId) => {
    // let {name} = await rtmClient.getUserAttributesByKeys(MemberId, ['name'])
    let attribute = await rtmClient.getUserAttributesByKeys(MemberId, ['name','nameColor'])
    let name= attribute.name;
    let memberColor= attribute.nameColor;
    console.log("yagbchjnjakca c m",memberColor);
    console.log("yagbchjnjakca c m",name);
    // let memberColor= 'blue';
 
    // console.log(rtmClient.getUserAttributesByKeys());
    // console.log(rtmClient.getUserAttributesByKeys(MemberId,['name']));
    // console.log("Get the name",name);
 
    let membersWrapper = document.getElementById('member__list')
    let role=sessionStorage.getItem('role');
    let removeButton = role === 'TA' && (MemberId != uid) ? `<button class="remove__btn" onclick="removeParticipant('${MemberId}')"><i class="fas fa-user-times"></i></button>` : '';
    let muteButton = role === 'TA' && (MemberId != uid) ? `<button class="mute__btn" onclick="muteParticipant('${MemberId}')"><i class='fas fa-volume-mute'></i></button>` : '';
    let disableMessages = role === 'TA' && (MemberId != uid) ? `<button class="disableMessage__btn" onclick="disableMessage('${MemberId}')"><i class='fas fa-comment-slash' style='font-size:15px;color:red'></i></button>` : '';
    let memberItem = `<div class="member__wrapper" id="member__${MemberId}__wrapper">
                        <span class="green__icon"></span>
                        <p class="member_name" id="rtmName" style="color:${memberColor}";>${name}</p>
                        <span class="member_name_buttons" style="display: flex; position: absolute; gap: 1em; right: 3px;">

                            ${removeButton}
                            ${muteButton}
                            ${disableMessages}
                        </span>
                    </div>`
                    // <button class="remove__btn" onclick="removeParticipant('${MemberId}')">Remove</button>
    membersWrapper.insertAdjacentHTML('beforeend', memberItem)
}

let updateMemberTotal = async (members) => {
    let total = document.getElementById('members__count')
    total.innerText = members.length
}
 
let handleMemberLeft = async (MemberId) => {
    removeMemberFromDom(MemberId)

    let members = await channel.getMembers()
    updateMemberTotal(members)
}

let removeMemberFromDom = async (MemberId) => {
    let memberWrapper = document.getElementById(`member__${MemberId}__wrapper`)
    let name = memberWrapper.getElementsByClassName('member_name')[0].textContent
    addBotMessageToDom(`${name} has left the room.`)
        
    memberWrapper.remove()
}


let getMembers = async () => {
    let members = await channel.getMembers()
    console.log(members);
    console.log(members.length);
    updateMemberTotal(members)
    for (let i = 0; members.length > i; i++){
        addMemberToDom(members[i])
    }
}

function updateMessageCounter() {
    if(unreadMessages>9)
        document.getElementById('messageCount').innerText = '9+';
    else
        document.getElementById('messageCount').innerText = unreadMessages;
}

let handleChannelMessage = async (messageData, MemberId) => {
    console.log('A new message was received')
    let data = JSON.parse(messageData.text)

    console.log("DATA", data);

    if(data.type === 'chat'){
        console.log(document.getElementById('messages__container').style.display)

        if (document.getElementById('messages__container').style.display === 'none' || document.getElementById('messages__container').style.display === '') {
            console.log("Inside message counter")
            unreadMessages++;
            updateMessageCounter();
        }
        

        addMessageToDom(data.displayName, data.message,data.color)
        
    }

    if(data.type === 'user_left'){
        document.getElementById(`user-container-${data.uid}`).remove()

        if(userIdInDisplayFrame === `user-container-${uid}`){
            displayFrame.style.display = null
    
            for(let i = 0; videoFrames.length > i; i++){
                videoFrames[i].style.height = '300px'
                videoFrames[i].style.width = '300px'
            }
        }
        
    }
    
    if (data.type === 'remove' && data.target === uid) {
        alert('You have been removed from the channel.');
        let email=sessionStorage.getItem('email')
        window.location.href = `projects.html?email=${email}`;
        await leaveStream();
    }

    if (data.type === 'mute') {
        // Mute the remote user's audio track
        if (localTracks[0]) {
            await localTracks[0].setMuted(true);
            localTracks[0]._mediaStreamTrack.enabled = false;
            document.getElementById("mic-btn").classList.remove('active')
            document.getElementById("mic-btn").style.display='none'
            document.getElementById("mute-mic-btn").style.display='block'
            document.getElementById(`mute-video-${MemberId}`).style.display='inline'
        }
        alert('You have been muted by the TA.');
    }

    if (data.type === 'muteMember' && data.target === uid) {
        // Mute the remote user's audio track
        if (localTracks[0]) {
            await localTracks[0].setMuted(true);
            localTracks[0]._mediaStreamTrack.enabled = false;
            document.getElementById("mic-btn").classList.remove('active')
            document.getElementById("mic-btn").style.display='none'
            document.getElementById("mute-mic-btn").style.display='block'
            document.getElementById(`mute-video-${MemberId}`).style.display='inline'
        }
        alert('You have been muted by the TA.');
    }
    //  else if (data.type === 'unmute' && data.target === uid) {
    //     // Unmute the remote user's audio track
    //     if (localTracks[0]) {
    //         await localTracks[0].setMuted(false);
    //         localTracks[0]._mediaStreamTrack.enabled = true;
    //     }
    //     alert('You have been unmuted by the TA.');
    // }

    if (data.type === 'disable_messages' && data.target === uid) {
        alert(`You have been disabled from sending messages for 5 minutes.`);
        const inputMessage = document.querySelector('input[name="message"]');
        inputMessage.disabled = true;
        inputMessage.placeholder = `You are disabled from sending messages for 5 minutes.`;
        // disableMessageInput(data.duration);

        // Re-enable the message input after the specified duration
        setTimeout(()=>{
            inputMessage.disabled = false;
            inputMessage.placeholder = `Send a message....`;
        },  5* 60 * 1000);

    }

    
    
}


let removeParticipant = async (MemberId) => {
    try {
        // Send a message to all participants about the removal
        await channel.sendMessage({ text: JSON.stringify({ type: 'remove', target: MemberId }) });
    
        delete remoteUsers[MemberId]
        console.log(remoteUsers);
        console.log(remoteUsers.length);
        document.getElementById(`user-container-${MemberId}`).remove()

    
        let { name } = await rtmClient.getUserAttributesByKeys(MemberId, ['name']);
        addBotMessageToDom(`${name} has been removed from the channel.`);
    } catch (error) {
        console.error('Error removing participant:', error);
    }
};
window.removeParticipant = removeParticipant;


async function muteAllParticipants(){

    
    // const members = await channel.getMembers();
    // members.forEach(async member => {
    //     if (member !== uid) { // Skip muting the local user (TA)
    //         console.log("insideMember")
    //         const remoteUser = remoteUsers[member];
    //         if (remoteUser && remoteUser.audioTrack) {
    //             console.log("inside Mute")
    //             console.log(remoteUser)
    //             remoteUser.audioTrack.setVolume(0); // Mute remote user's audio track
    //         }
    //     }
    // });

    await channel.sendMessage({ text: JSON.stringify({ type: 'mute' }) });

    for (const member in remoteUsers) {
        console.log('aghsadf', member, remoteUsers, remoteUsers[member]);
        if (member !== uid) { // Skip muting the local user (TA)
            const remoteUser = remoteUsers[member];
            if (remoteUser && remoteUser.audioTrack) {
                if (remoteUser && remoteUser.audioTrack && remoteUser.audioTrack._mediaStreamTrack) {
                    // remoteUser.audioTrack._mediaStreamTrack.enabled = false; // Mute the audio track
                //    remoteUser.localTracks[0].setMuted(true);
                    // document.getElementById('mic-btn').classList.remove('active')
                    

                }
            }
        }
        
    }
    alert('All participants have been muted.'); 
}

async function muteParticipant(MemberId){

    await channel.sendMessage({ text: JSON.stringify({ type: 'muteMember', target: MemberId }) });

}

let disableMessage=async (MemberId)=>{
    
    console.log("MemberID....",MemberId);

    // Inform the participant they are disabled from sending messages
    await channel.sendMessage({ text: JSON.stringify({ type: 'disable_messages', target: MemberId, duration: 5 }) });
    
    // alert(`${MemberId} has been disabled from sending messages for 5 minutes.`);

}

let sendMessage = async (e) => {
    e.preventDefault()

    

    let message = e.target.message.value
    channel.sendMessage({text:JSON.stringify({'type':'chat', 'message':message, 'displayName':displayName,'color':randomColor})})
    addMessageToDom(displayName, message,randomColor)
    e.target.reset()

    try {
        const queryString = window.location.search
        console.log(queryString);
        const urlParams = new URLSearchParams(queryString)
        console.log(urlParams);
        let projectId = urlParams.get('project')
        const date = new Date();
        let readableDate = date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
        });
        let response = await fetch('https://lo4iehk4j4.execute-api.us-east-2.amazonaws.com/messages/addMessage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: Date.now().toString(),
                project_id: projectId,
                Username: displayName,
                Message: message,
                Time: readableDate
            })
        });

        console.log(response);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        let data = await response.json();
        console.log('Message stored:', data);
    } catch (error) {
        console.error('Error storing message:', error);
    }
}

let addMessageToDom = (name, message,color) => {

    // messageCount+=1;
    // console.log(messageCount)
    // document.getElementById("messageCount").innerText=messageCount;

    let messagesWrapper = document.getElementById('messages')

    let newMessage = `<div class="message__wrapper">
                        <div class="message__body">
                            <strong class="message__author" style=color:${color}>${name}</strong>
                            <p class="message__text">${message}</p>
                        </div>
                    </div>`

    messagesWrapper.insertAdjacentHTML('beforeend', newMessage)

    let lastMessage = document.querySelector('#messages .message__wrapper:last-child')
    if(lastMessage){
        lastMessage.scrollIntoView()
    }
}


let addBotMessageToDom = (botMessage) => {
    let messagesWrapper = document.getElementById('messages')

    let newMessage = `<div class="message__wrapper">
                        <div class="message__body__bot">
                            <strong class="message__author__bot">🤖 CollabStation Bot</strong>
                            <p class="message__text__bot">${botMessage}</p>
                        </div>
                    </div>`

    messagesWrapper.insertAdjacentHTML('beforeend', newMessage)

    let lastMessage = document.querySelector('#messages .message__wrapper:last-child')
    if(lastMessage){
        lastMessage.scrollIntoView()
    }
}

let leaveChannel = async () => {
    await channel.leave()
    await rtmClient.logout()
}

window.addEventListener('beforeunload', leaveChannel)
let messageForm = document.getElementById('message__form')
messageForm.addEventListener('submit', sendMessage)
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
    let removeButton = role === 'TA' && (MemberId != uid) ? `<button class="remove__btn" onclick="removeParticipant('${MemberId}')">Remove</button>` : '';
    let memberItem = `<div class="member__wrapper" id="member__${MemberId}__wrapper">
                        <span class="green__icon"></span>
                        <p class="member_name" id="rtmName" style="color:${memberColor}";>${name}</p>
                        ${removeButton}
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

let handleChannelMessage = async (messageData, MemberId) => {
    console.log('A new message was received')
    let data = JSON.parse(messageData.text)

    console.log("DATA", data);

    if(data.type === 'chat'){
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
                    document.getElementById('mic-btn').classList.remove('active')
                }
            }
        }
        alert('All participants have been muted.'); 
    }
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
        let projectId = urlParams.get('projectName')
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
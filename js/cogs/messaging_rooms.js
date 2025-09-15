
var queryString = window.location.search;
var urlParams = new URLSearchParams(queryString);

var roomName;
var ablyChannel;
var innerChannel;
var ablyInstance;

let isFirstMember = true;
let canSendMessages = true;
let unreadMessages = 0;
let breakoutId = -1;
let roomId = urlParams.get('project')
let connectedUsers = {};

async function initSetup() {

    const resp = await fetch(`https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/rooms/breakouts?room=${urlParams.get('project')}&user=${sessionStorage.getItem('email')}`);
    roomName = "room:" + urlParams.get('project');
    if (resp.ok) {
        // Handle valid breakout
        const breakoutdata = await resp.json();
        if (breakoutdata === null && breakoutdata.redirect != 0) {
            roomName += ":" + breakoutdata.redirect;
            breakoutId = breakoutdata.redirect;
            roomId += ":" + breakoutdata.redirect;
        }
    }
    console.log("Room Name: " + roomName);

    ablyInstance = new Ably.Realtime({
        authUrl: "https://0dhyl8bktg.execute-api.us-east-2.amazonaws.com/scratchBlock/ablyToken?name=" + sessionStorage.getItem('name'),
    });

    ablyInstance.connection.once('connected').then(() => {
        console.log('Connected to Ably!!!!!!!!')
    })

    // get project URL id
    ablyChannel = ablyInstance.channels.get( roomName );
    innerChannel = ablyInstance.channels.get( roomName + "_inner" );

    ablyChannel.presence.enter(sessionStorage.getItem("email"), (err) => {
    if (err) {
        alert("Failed to join the room. Please try again. If the issue persists, contact prodegh@clemson.edu.");
        return
    } 
    });
}

var sendMessage, handleChannelMessage, removeParticipant, muteAllParticipants, updateMessageCounter, muteParticipant, disableMessage;

window.messagingReady = (async () => {
    await initSetup();
})()

window.messagingReady.then(() => {

    const addPerson = async (email) => {

        if (email in connectedUsers) {
            return;
        }
        
        const response = await fetch(`https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/register?email=${email}`);
        const data = await response.json();
        data.email = email;

        handleUserJoined(data);
    };
    ablyChannel.presence.subscribe('enter', async (member) => {
        const presenceSet = await ablyChannel.presence.get();
        const users = presenceSet.map((member) => member.data);
        for (const user of users) {
            addPerson(user);
        }
    });

    let handleUserJoined = (data) => {
        console.log("Ably Joined: ", data.name)

        connectedUsers[data.email] = data;
        addMemberToDom(data);
        updateMemberTotal(Object.keys(connectedUsers).length);
        addBotMessageToDom(`Welcome to the room ${data.name}! 👋`)
    }

    let handleMemberLeft = (email) => {
        console.log("Ably Left: ", email)

        var data = connectedUsers[email];
        delete connectedUsers[email];
        removeMemberFromDom(data)
        updateMemberTotal(Object.keys(connectedUsers).length)
    }
    ablyChannel.presence.subscribe('leave', (member) => {
        const email = member.data;
        handleMemberLeft(email);
    });


    let addMemberToDom = async (member) => {

        console.log("ably MEMBER", member);

        let memberEmail = member.email;
        let name = member.name;
        let memberColor = "ff0000";
    
        let membersWrapper = document.getElementById('member__list')
        let role = sessionStorage.getItem('role');
        let moveButton = role === 'TA' ? `<button class="move__btn" onclick="moveParticipant('${memberEmail}')"><i class="fas fa-arrow-right"></i></button>` : '';
        let removeButton = role === 'TA' ? `<button class="remove__btn" onclick="removeParticipant('${memberEmail}')"><i class="fas fa-user-times"></i></button>` : '';
        let muteButton = role === 'TA' ? `<button class="mute__btn" onclick="muteParticipant('${memberEmail}')"><i class='fas fa-volume-mute'></i></button>` : '';
        let disableMessages = role === 'TA' ? `<button class="disableMessage__btn" onclick="disableMessage('${memberEmail}')"><i class='fas fa-comment-slash' style='font-size:15px;color:red'></i></button>` : '';
        let memberItem = `<div class="member__wrapper" id="member__${memberEmail}__wrapper">
                            <div style="display: flex; align-items: center;">
                                <span class="green__icon"></span>
                                <p class="member_name" id="rtmName" style="color:#${memberColor}; margin: 0;">${name}</p>
                                <span class="member_name_buttons">
                                    ${moveButton}
                                    ${removeButton}
                                    ${muteButton}
                                    ${disableMessages}
                                </span>
                            </div>
                        </div>`
    
    membersWrapper.insertAdjacentHTML('beforeend', memberItem)
    }

    let updateMemberTotal = async (membersAmount) => {
        document.getElementById('members__count').innerText = membersAmount
        document.getElementById('connectedCount').innerText = membersAmount
    }
    
    let removeMemberFromDom = async (data) => {
        let email = data.email;
        let memberWrapper = document.getElementById(`member__${email}__wrapper`)
        addBotMessageToDom(`${data.name} has left the room.`)
            
        memberWrapper.remove()
    }


    updateMessageCounter = () => {
        if(unreadMessages>9) {
            document.getElementById('messageCount').innerText = '9+';
        } else {
            document.getElementById('messageCount').innerText = unreadMessages;
        }
    }

    handleChannelMessage = async (messageData, MemberId) => {

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
            

            addMessageToDom(data.displayName, data.message, data.color)
            
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

    let moveParticipant = async (MemberId) => {
        
    }

    let removeParticipant = async (MemberId) => {
        if (MemberId === sessionStorage.getItem('email')) {
            alert('You cannot remove yourself from the channel.')
            return;
        }
        await ablyChannel.publish('removeParticipant', {participant: MemberId});
    };
    ablyChannel.subscribe('removeParticipant', async (message) => {
        const { participant } = message.data;
        const to_email=sessionStorage.getItem('email')
        console.log(participant, to_email)
        try {
            if (participant == to_email) {
                ablyChannel.unsubscribe();
                alert('You have been removed from the channel.');
                window.location.href = `projects.html?email=${to_email}`
            }
            addBotMessageToDom(`${participant} has been removed from the channel.`);
        } catch (error) {
            console.error(error);
        }
    });


    document.getElementById('end-meet-btn').addEventListener('click', async () => {
        if (!confirm('Are you sure you want to end the meeting?')) {
            return;
        }
        await ablyChannel.publish('end_meeting', "");
        window.location.href = 'projects.html?email=' + sessionStorage.getItem('email');
    })
    ablyChannel.subscribe('end_meeting', () => {
        window.location.href = 'projects.html?email=' + sessionStorage.getItem('email');
    });

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

    let disableMessage= async (MemberId) => {

        if (MemberId === sessionStorage.getItem('email')) {
            alert('You cannot disable yourself from sending messages.')
            return;
        }
        
        await ablyChannel.publish('disable_messages', {target: MemberId, duration: 5*60*1000});

    }

    ablyChannel.subscribe('disable_messages', async (message) => {

        if (!canSendMessages) {
            return;
        }

        const { target, duration } = message.data;
        const to_email = sessionStorage.getItem('email');
        console.log(target, to_email);
        try {
            if (target == to_email) {
                alert('You have been disabled from sending messages for 5 minutes.');
                canSendMessages = false;
                setTimeout(() => {
                    canSendMessages = true;
                    alert('You can now send messages again.');
                }, duration);
            }
            addBotMessageToDom(`${target} has been disabled from sending messages for 5 minutes.`);
        } catch (error) {
            console.error(error);
        }
    });
                

    sendMessage = async (message) => {
        
        if (!canSendMessages) {
            return;
        }

        const displayName = sessionStorage.getItem('display_name');

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
        await fetch('https://lo4iehk4j4.execute-api.us-east-2.amazonaws.com/messages/addMessage', {
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
        ablyChannel.publish("chat", {displayName, message, color: sessionStorage.getItem("randomColor")})
    }

    ablyChannel.subscribe("chat", async (message) => {
        addMessageToDom(message.data.displayName, message.data.message, message.data.color)
    })

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
    }


    function addBotMessageToDom (botMessage) {
        let messagesWrapper = document.getElementById('messages')

        let newMessage = `<div class="message__wrapper">
                            <div class="message__body__bot">
                                <strong class="message__author__bot">🤖 CollabStation Bot</strong>
                                <p class="message__text__bot">${botMessage}</p>
                            </div>
                        </div>`

        messagesWrapper.insertAdjacentHTML('beforeend', newMessage)

        let lastMessage = document.querySelector('#messages .message__wrapper:last-child')
    }

});
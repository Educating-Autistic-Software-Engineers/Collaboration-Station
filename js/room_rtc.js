// get room id from env.
const APP_ID = ""
 
let uid = sessionStorage.getItem('uid')
if(!uid){
    uid = String(Math.floor(Math.random() * 10000))
    sessionStorage.setItem('uid', uid)
}
 
let token = null;
let client;
 
let rtmClient;
let channel;
 
//let roomId = urlParams.get('room')
 
if(!roomId){
    roomId = 'main'
}

const colors = [
    'red', 'green', 'blue', 'orange', 'purple',
    'pink', 'cyan', 'salmon', 'olive', 'navy', 'teal',
    'yellowgreen', 'blueviolet', 'crimson',
    'coral', 'darkorange', 'darkseagreen', 'darkslateblue', 'darkturquoise',
    'darkgoldenrod', 'darkgreen', 'darkorange', 'fuchsia', 'gold', 'indigo', 
];
 
function getRandomColor() {
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
}
let randomColor=getRandomColor();
sessionStorage.setItem('randomColor', randomColor)
 
let displayName = sessionStorage.getItem('display_name')
console.log("dp is", displayName)

let activeSpeaker = null;
 
let localTracks = []
let remoteUsers = {}
 
let localScreenTracks;
let sharingScreen = false;
 
const virtualBackgroundExtension = new VirtualBackgroundExtension();
console.log(virtualBackgroundExtension, "heic");
AgoraRTC.registerExtensions([virtualBackgroundExtension]);
 
let joinRoomInit = async () => {
    rtmClient = await AgoraRTM.createInstance(APP_ID)
    await rtmClient.login({uid,token})
 
    await rtmClient.addOrUpdateLocalUserAttributes({'name':displayName})
    await rtmClient.addOrUpdateLocalUserAttributes({'nameColor':randomColor})
 
    channel = await rtmClient.createChannel(roomId)
    await channel.join()
 
    channel.on('MemberJoined', handleMemberJoined)
    channel.on('MemberLeft', handleMemberLeft)
    channel.on('ChannelMessage', handleChannelMessage)
 
    getMembers()
    addBotMessageToDom(`Welcome to the room ${displayName}! 👋`)
 
    client = AgoraRTC.createClient({mode:'rtc', codec:'vp8'})
    await client.join(APP_ID, roomId, token, uid)

    joinStream()
 
    client.on('user-published', handleUserPublished)
    client.on('user-left', handleUserLeft)
 
    client.enableAudioVolumeIndicator();
    client.on('volume-indicator', handleVolumeIndicator);
    
}


function handleVolumeIndicator(volumes) {
    let highestVolume = -Infinity;
    let newActiveSpeaker = null;

    volumes.forEach(volume => {
        if (volume.level > highestVolume) {
            highestVolume = volume.level;
            newActiveSpeaker = volume.uid;
        }
    });
    
    const threshold = 5;

    if (newActiveSpeaker !== activeSpeaker) {
        if (activeSpeaker) {
            let previousSpeakerElement = document.getElementById(`user-container-${activeSpeaker}`);
            if (previousSpeakerElement) {
                previousSpeakerElement.classList.remove('highlight');
            }
        }

        activeSpeaker = newActiveSpeaker;

        if (activeSpeaker) {
            let currentSpeakerElement = document.getElementById(`user-container-${activeSpeaker}`);
            if (currentSpeakerElement) {
                currentSpeakerElement.classList.add('highlight');
            }
        }
    }

    if (highestVolume <= threshold && activeSpeaker) {
        let currentSpeakerElement = document.getElementById(`user-container-${activeSpeaker}`);
        if (currentSpeakerElement) {
            currentSpeakerElement.classList.remove('highlight');
        }
        activeSpeaker = null;
    }

}

// const handleVolumeIndicator = () => {
//     client.enableAudioVolumeIndicator();
//     client.on("volume-indicator", volumes => {
//         volumes.forEach(volume => {
//             let playerElement = (uid == volume.uid) ? document.getElementById(`user-container-${uid}`) : document.getElementById(`user-container-${volume.uid}`);
//             if (volume.level > 5) {
//                 playerElement.classList.add("highlight");
//             } else {
//                 playerElement.classList.remove("highlight");
//             }
//         });
//     });
// };
 
const applyVirtualBackground = async (track) => {
    // await virtualBackgroundExtension.load();
    // const processor = virtualBackgroundExtension.createProcessor();
   
    // track.setExtension(virtualBackgroundExtension);
    // track.setVideoProcessor(processor);
 
    // // Set background blur
    // processor.setOptions({
    //     backgroundType: "blur",
    //     blurDegree: 3 // 1 for light blur, 2 for medium blur, 3 for heavy blur
    // });
 
    // processor.enable();
 
    const extension = new VirtualBackgroundExtension();
    AgoraRTC.registerExtensions([extension]);
    let processor = extension.createProcessor();
    await processor.init();
    track.pipe(processor).pipe(track.processorDestination);
    processor.setOptions({type: 'blur', blurDegree: 3});
    await processor.enable();
};
 
let joinStream = async () => {
    console.log("Hisdf")
    document.getElementById('join-btn').style.display = 'none'
    document.getElementsByClassName('stream__actions')[0].style.display = 'flex'
 
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks({}, {encoderConfig:{
        width:{min:640, ideal:1920, max:1920},
        height:{min:480, ideal:1080, max:1080}
    }})

    let role=sessionStorage.getItem('role')
    console.log('ROLEIS', role);
    if(role==='TA') {
        document.getElementById("mute-all-btn").style.display='block'
    }
 
    let player = `<div class="video__container" id="user-container-${uid}">
                   
                    <div class="video-player" id="user-${uid}">
                        <div id="member_name" >${sessionStorage.getItem("display_name")}
                            <span id="mute-video-icon" style="display:none;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-mic-mute-fill" viewBox="0 0 16 16">
                                    <path d="M13 8c0 .564-.094 1.107-.266 1.613l-.814-.814A4 4 0 0 0 12 8V7a.5.5 0 0 1 1 0zm-5 4c.818 0 1.578-.245 2.212-.667l.718.719a5 5 0 0 1-2.43.923V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 1 0v1a4 4 0 0 0 4 4m3-9v4.879L5.158 2.037A3.001 3.001 0 0 1 11 3"/>
                                    <path d="M9.486 10.607 5 6.12V8a3 3 0 0 0 4.486 2.607m-7.84-9.253 12 12 .708-.708-12-12z"/>
                                </svg>
                            </span>
                        </div>
                    </div>
                    

                 </div>
                 
                 `
                 
 
    document.getElementById('stream__container').insertAdjacentHTML('beforeend', player)
    // document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame)
 
    await applyVirtualBackground(localTracks[1]);
 
    localTracks[1].play(`user-${uid}`)
    await client.publish([localTracks[0], localTracks[1]])
}

 
let switchToCamera = async () => {
    let player = `<div class="video__container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                 </div>
                 <div>${sessionStorage.getItem("display_name")}</div>`
    displayFrame.insertAdjacentHTML('beforeend', player)
 
    await localTracks[0].setMuted(true)
    await localTracks[1].setMuted(true)
 
    document.getElementById('mic-btn').classList.remove('active')
    // document.getElementById('screen-btn').classList.remove('active')
 
    localTracks[1].play(`user-${uid}`)
    await client.publish([localTracks[1]])
}


let handleUserPublished = async (user, mediaType) => {
 
 
    remoteUsers[user.uid] = user
 
 
    let {name} = await rtmClient.getUserAttributesByKeys(user.uid, ['name'])
 
    console.log(name);
 
 
    await client.subscribe(user, mediaType)
 
    let player = document.getElementById(`user-container-${user.uid}`)
    if(player === null){
        let memberName= name || "Unknown User"
        player = `<div class="video__container" id="user-container-${user.uid}">
                    <div class="video-player" id="user-${user.uid}">
                    <div id="remote-member_name">${memberName}
                    </div>
                    <button class="remove__btn" style="display: none;" onclick="removeParticipant('${user.uid}')">Remove</button>
                    </div> 
                    </div>
                    `
                    // <span><img src="images/mic.png" id="self-mute-person" onclick="toggleMic(event)"></span>
                    // <span id="mute-video-icon" style="display:none;">
                    //     <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-mic-mute-fill" viewBox="0 0 16 16">
                    //         <path d="M13 8c0 .564-.094 1.107-.266 1.613l-.814-.814A4 4 0 0 0 12 8V7a.5.5 0 0 1 1 0zm-5 4c.818 0 1.578-.245 2.212-.667l.718.719a5 5 0 0 1-2.43.923V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 1 0v1a4 4 0 0 0 4 4m3-9v4.879L5.158 2.037A3.001 3.001 0 0 1 11 3"/>
                    //         <path d="M9.486 10.607 5 6.12V8a3 3 0 0 0 4.486 2.607m-7.84-9.253 12 12 .708-.708-12-12z"/>
                    //     </svg>
                    // </span>
 
        document.getElementById('stream__container').insertAdjacentHTML('beforeend', player)
        document.getElementById(`user-container-${user.uid}`).addEventListener('click', expandVideoFrame)
   
    }
 
    if(displayFrame.style.display){
        let videoFrame = document.getElementById(`user-container-${user.uid}`)
        videoFrame.style.height = '100px'
        videoFrame.style.width = '100px'
    }
 
    if(mediaType === 'video'){
        user.videoTrack.play(`user-${user.uid}`)
    }
 
    if(mediaType === 'audio'){
        user.audioTrack.play()
    }
 
}
 
let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid]
    let item = document.getElementById(`user-container-${user.uid}`)
    if(item){
        item.remove()
    }
 
    if(userIdInDisplayFrame === `user-container-${user.uid}`){
        displayFrame.style.display = null
       
        let videoFrames = document.getElementsByClassName('video__container')
 
        for(let i = 0; videoFrames.length > i; i++){
            videoFrames[i].style.height = '300px'
            videoFrames[i].style.width = '300px'
        }
    }
}
 
let toggleMic = async (e) => {
    let button = e.currentTarget

    console.log(e);
 
    // if(localTracks[0].muted){
    //     await localTracks[0].setMuted(false)
    //     console.log(localTracks[0]);
    //     // localTracks[0]._mediaStreamTrack.enabled = true;
    //     button.classList.add('active')
       
    await localTracks[0].setMuted(true)
    // localTracks[0]._mediaStreamTrack.enabled = false;
    button.classList.remove('active')

    document.getElementById("mute-mic-btn").style.display='block'
    document.getElementById("mic-btn").style.display='none'
    document.getElementById("mute-video-icon").style.display='inline'

}

let toggleMuteMic = async (e) => {
    let button = e.currentTarget
 
    console.log(e);
 
    if(localTracks[0].muted){
        await localTracks[0].setMuted(false)
        console.log(localTracks[0]);
        // localTracks[0]._mediaStreamTrack.enabled = true;
        document.getElementById("mic-btn").style.display='block'
        document.getElementById("mute-mic-btn").style.display='none'
        document.getElementById("mic-btn").classList.add('active')
        document.getElementById("mute-video-icon").style.display='none'
    }
}
 
let toggleCamera = async (e) => {
    let button = e.currentTarget
 
    // if(localTracks[1].muted){
    //     await localTracks[1].setMuted(false)
    //     button.classList.add('active')
 
    // }else{
    await localTracks[1].setMuted(true)
    button.classList.remove('active')

    document.getElementById("mute-camera-btn").style.display='block'
    document.getElementById("camera-btn").style.display='none'
}

let toggleMuteCamera = async (e) => {
    let button = e.currentTarget
 
    if(localTracks[1].muted){
        await localTracks[1].setMuted(false)
        document.getElementById("camera-btn").style.display='block'
        document.getElementById("mute-camera-btn").style.display='none'
        document.getElementById("camera-btn").classList.add('active')
        // button.classList.add('active')
 
    }
}
 
 
let toggleScreen = async (e) => {
    let screenButton = e.currentTarget
    let cameraButton = document.getElementById('camera-btn')
 
    if(!sharingScreen){
        sharingScreen = true
 
        screenButton.classList.add('active')
        cameraButton.classList.remove('active')
        cameraButton.style.display = 'none'
 
        localScreenTracks = await AgoraRTC.createScreenVideoTrack()
 
        document.getElementById(`user-container-${uid}`).remove()
        displayFrame.style.display = 'block'
 
        let player = `<div class="video__container" id="user-container-${uid}">
                <div class="video-player" id="user-${uid}"></div>
            </div>`
 
        displayFrame.insertAdjacentHTML('beforeend', player)
        document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame)
 
        userIdInDisplayFrame = `user-container-${uid}`
        localScreenTracks.play(`user-${uid}`)
 
        await client.unpublish([localTracks[1]])
        await client.publish([localScreenTracks])
 
        let videoFrames = document.getElementsByClassName('video__container')
        for(let i = 0; videoFrames.length > i; i++){
            if(videoFrames[i].id != userIdInDisplayFrame){
              videoFrames[i].style.height = '100px'
              videoFrames[i].style.width = '100px'
            }
          }
 
 
    }else{
        sharingScreen = false
        cameraButton.style.display = 'block'
        document.getElementById(`user-container-${uid}`).remove()
        await client.unpublish([localScreenTracks])
 
        switchToCamera()
    }
}
 
let leaveStream = async (e) => {
    e.preventDefault()
 
    document.getElementById('join-btn').style.display = 'block'
    document.getElementsByClassName('stream__actions')[0].style.display = 'none'
 
    for(let i = 0; localTracks.length > i; i++){
        localTracks[i].stop()
        localTracks[i].close()
    }
 
    await client.unpublish([localTracks[0], localTracks[1]])
 
    if(localScreenTracks){
        await client.unpublish([localScreenTracks])
    }
 
    document.getElementById(`user-container-${uid}`).remove()
 
    if(userIdInDisplayFrame === `user-container-${uid}`){
        displayFrame.style.display = null
 
        for(let i = 0; videoFrames.length > i; i++){
            videoFrames[i].style.height = '300px'
            videoFrames[i].style.width = '300px'
        }
    }
 
    channel.sendMessage({text:JSON.stringify({'type':'user_left', 'uid':uid})})
}
 
 
 
document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)
// document.getElementById('screen-btn').addEventListener('click', toggleScreen)
document.getElementById('join-btn').addEventListener('click', joinStream)
//document.getElementById('leave-btn').addEventListener('click', leaveStream)
document.getElementById('mute-mic-btn').addEventListener('click', toggleMuteMic)
document.getElementById('mute-camera-btn').addEventListener('click', toggleMuteCamera)
 
 
joinRoomInit()
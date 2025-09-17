
let uid = sessionStorage.getItem('uid');
if(!uid){
    uid = String(Math.floor(Math.random() * 10000));
    sessionStorage.setItem('uid', uid);
}

let token = null;
let client;
let meetingSession;

// Keep color functionality from original code
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

let randomColor = getRandomColor();
sessionStorage.setItem('randomColor', randomColor);

let displayName = sessionStorage.getItem('display_name');
console.log("dp is", displayName);

let activeSpeaker = null;
let localTracks = [];
let remoteUsers = {};

let localScreenTracks;
let sharingScreen = false;

let meetingId = ""

const audioLogger = {
    success: (msg, data = '') => console.log(`🎵 AUDIO SUCCESS: ${msg}`, data),
    error: (msg, data = '') => console.error(`❌ AUDIO ERROR: ${msg}`, data),
    warn: (msg, data = '') => console.warn(`⚠️ AUDIO WARNING: ${msg}`, data),
    info: (msg, data = '') => console.log(`📋 AUDIO INFO: ${msg}`, data)
};

const logger = new ChimeSDK.ConsoleLogger(
    "ChimeMeetingLogs",
    ChimeSDK.LogLevel.WARN
);

const deviceController = new ChimeSDK.DefaultDeviceController(logger);


function setupCleanVolumeMonitoring() {
    let userCount = 0;
    
    meetingSession.audioVideo.realtimeSubscribeToVolumeIndicator(
        (attendeeId, volume, muted, signalStrength) => {
            const isLocal = attendeeId === meetingSession.configuration.credentials.attendeeId;
            
            if (isLocal) {
                // Update mic status
                const micStatus = document.getElementById('mic-status');
                const audioLevel = document.getElementById('audio-level');
                
                if (micStatus) {
                    micStatus.textContent = muted ? 'Muted' : 'On';
                    micStatus.style.color = muted ? '#ff4444' : '#44ff44';
                }
                
                if (audioLevel) {
                    audioLevel.textContent = `${(volume * 100).toFixed(0)}%`;
                    audioLevel.style.color = volume > 0.1 ? '#44ff44' : '#888';
                }
                
                // Only log significant changes for local user
                if (volume > 0.2 && !muted) {
                    audioLogger.info(`Speaking detected - Level: ${(volume * 100).toFixed(0)}%`);
                }
            }
            
            // Update user count
            const activeUsers = new Set();
            meetingSession.audioVideo.realtimeSubscribeToAttendeeIdPresence((id, present) => {
                if (present) activeUsers.add(id);
                else activeUsers.delete(id);
                
                const userCountEl = document.getElementById('user-count');
                if (userCountEl) userCountEl.textContent = activeUsers.size;
            });
        }
    );
}

// Initialize room and join meeting
let joinRoomInit = async () => {

    // wait for ably instance ablyInstance (already defined)
    // to be ready before proceeding
    await ablyInstance.connection.once('connected');

    try {

        let numMembers = 0;
        const members = await ablyChannel.presence.get()
        for (let member in members) {
            console.log(members[member].data, sessionStorage.getItem('email'));
            if (members[member].data !== sessionStorage.getItem('email')) {
                numMembers++;
            }
        }

        if (numMembers === 0) {
            const createResponse = await fetch('https://peagtcdu93.execute-api.us-east-2.amazonaws.com/Stage1/create-meeting', {
                method: 'POST',
                headers: {
                }
            });
            const createData = await createResponse.json();
            meetingId = createData.Meeting.MeetingId;
            console.log("CREATED MEETING", createData);

            await fetch('https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/roomDB', {
                method: 'PUT',
                headers: {
                    'Accept': '*/*',
                },
                body: JSON.stringify({ 
                    room_id: roomId,
                    meetingID: meetingId 
                })
            });

        } else {
            const response = await fetch(`https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/roomDB?roomId=${roomId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            const data = await response.json();
            console.log("JOINED MEETING", data);
            meetingId = data.request.meetingID;
        }

        // Call backend to join meeting
        const response = await fetch('https://peagtcdu93.execute-api.us-east-2.amazonaws.com/Stage1/join-meeting', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                meetingId: meetingId, 
                userId: displayName 
            }),
        });

        const joinData = await response.json();

        console.log("SUCC", joinData)
        
        const meetingInfo = { Meeting: joinData.Meeting }; 
        const attendeeInfo = { Attendee: joinData.Attendee };
        
        // Configure meeting session
        const configuration = new ChimeSDK.MeetingSessionConfiguration(
            meetingInfo.Meeting,
            attendeeInfo.Attendee
        );
        
        meetingSession = new ChimeSDK.DefaultMeetingSession(
            configuration,
            logger,
            deviceController
        );

        // Set up observers for video tiles and events
        const observer = {
            videoTileDidUpdate: (tileState) => {
                if (!tileState.boundAttendeeId) {
                    return;
                }
                updateTiles(meetingSession);
                handleVolumeIndicator(); // Update volume indicators
            },
            
            audioVideoDidStart: () => {
                console.log('Meeting started successfully');
            },
            
            connectionDidBecomePoor: () => {
                console.log('Connection quality became poor');
            },
            
            connectionDidSuggestStopVideo: () => {
                console.log('Connection suggests stopping video');
            },

            audioSendingBitrateChanged: (bitrateKbps) => {
                console.log(`Audio sending bitrate changed to ${bitrateKbps} kbps`);
            },

            metricsDidReceive: clientMetricReport => {
                console.log('Chime metrics:', clientMetricReport.getObservableMetrics());
            },

            audioInputFailed: (e) => console.log('Audio input failed:', e),
            audioOutputFailed: (e) => console.log('Audio output failed:', e),

        };

        const eventObserver = {
            eventDidReceive(name, attributes) {
                switch (name) {
                    case 'meetingEnded':
                        handleUserLeft();
                        console.log("Meeting Ended", attributes);
                        break;
                    case 'meetingReconnected':
                        console.log('Meeting Reconnected...');
                        break;
                }
            }
        };

        // Add observers
        meetingSession.audioVideo.addObserver(observer);
        meetingSession.eventController.addObserver(eventObserver);

        meetingSession.audioVideo.realtimeSubscribeToVolumeIndicator(
            (attendeeId, volume, muted, signalStrength) => {
                console.log(`Attendee ID: ${attendeeId}, Volume: ${volume}, Muted: ${muted}, Signal Strength: ${signalStrength}`);
                if (volume > 0.5 && !muted) { // Threshold for "speaking"
                    handleActiveVolumeIndicator(attendeeId, volume);
                }
            }
        );

        await joinStream();

    } catch (error) {
        console.error('Error initializing meeting:', error);
    }
};

// Handle active speaker highlight (similar to original handleVolumeIndicator)
function handleActiveVolumeIndicator(attendeeId, volume) {
    if (activeSpeaker !== attendeeId && volume > 0.5) {
        if (activeSpeaker) {
            let previousSpeakerElement = document.getElementById(`user-container-${activeSpeaker}`);
            if (previousSpeakerElement) {
                previousSpeakerElement.classList.remove('highlight');
            }
        }

        activeSpeaker = attendeeId;

        let currentSpeakerElement = document.getElementById(`user-container-${activeSpeaker}`);
        if (currentSpeakerElement) {
            currentSpeakerElement.classList.add('highlight');
        }
    }

    if (volume <= 0.1 && activeSpeaker === attendeeId) {
        let currentSpeakerElement = document.getElementById(`user-container-${activeSpeaker}`);
        if (currentSpeakerElement) {
            currentSpeakerElement.classList.remove('highlight');
        }
        activeSpeaker = null;
    }
}

// Volume indicator for all participants
function handleVolumeIndicator() {
    return
    meetingSession.audioVideo.realtimeSubscribeToVolumeIndicator(
        (attendeeId, volume, muted, signalStrength) => {
            const threshold = 0.05;
            let playerElement = document.getElementById(`user-container-${attendeeId}`);
            
            if (playerElement) {
                if (volume > threshold && !muted) {
                    playerElement.classList.add("highlight");
                } else {
                    playerElement.classList.remove("highlight");
                }
            }
        }
    );
}

// Join stream and set up local tracks
let joinStream = async () => {

    document.getElementsByClassName('stream__actions')[0].style.display = 'flex';

    try {
        // Get devices (no logging of device details to reduce spam)
        const audioInputs = await meetingSession.audioVideo.listAudioInputDevices();
        const audioOutputs = await meetingSession.audioVideo.listAudioOutputDevices();
        const videoInputs = await meetingSession.audioVideo.listVideoInputDevices();
        
        audioLogger.info(`Found ${audioInputs.length} mics, ${audioOutputs.length} speakers, ${videoInputs.length} cameras`);

        // Setup audio input
        if (audioInputs.length > 0) {
            try {
                await meetingSession.audioVideo.startAudioInput(audioInputs[0].deviceId);
                
                localTracks[0] = {
                    setMuted: async (muted) => {
                        if (muted) {
                            await meetingSession.audioVideo.realtimeMuteLocalAudio();
                        } else {
                            await meetingSession.audioVideo.realtimeUnmuteLocalAudio();
                        }
                        return true;
                    },
                    muted: false
                };
            } catch (error) {
                audioLogger.error("Failed to start microphone", error.message);
            }
        } else {
            audioLogger.error("No microphones found");
        }

        // Setup audio output
        if (audioOutputs.length > 0) {
            try {
                await meetingSession.audioVideo.chooseAudioOutput(audioOutputs[0].deviceId);
                
                const audioElem = document.getElementById('meeting-audio');
                if (audioElem) {
                    meetingSession.audioVideo.bindAudioElement(audioElem);
                } 
            } catch (error) {
            }
        }

        // Setup video (your existing logic)
        if (videoInputs.length > 0) {
            await meetingSession.audioVideo.startVideoInput(videoInputs[0].deviceId);
            localTracks[1] = {
                setMuted: async (muted) => {
                    if (muted) {
                        await meetingSession.audioVideo.stopLocalVideoTile();
                    } else {
                        await meetingSession.audioVideo.startLocalVideoTile();
                        setTimeout(() => {
                            const localVideoElement = document.getElementById(`video-${uid}`);
                            if (localVideoElement) {
                                localVideoElement.style.width = "100%";
                                localVideoElement.style.height = "100%";
                                localVideoElement.style.objectFit = "cover";
                            }
                        }, 500);
                    }
                    return true;
                },
                muted: false
            };
        }

        // Start the meeting
        await meetingSession.audioVideo.start();
        meetingSession.audioVideo.startLocalVideoTile();
        
        setupCleanVolumeMonitoring();
        
        audioLogger.success("Meeting started successfully");

        // Role-based UI
        let role = sessionStorage.getItem('role');
        if (role === 'TA') {
            document.getElementById("mute-all-btn").style.display = 'block';
        }

    } catch (error) {
        audioLogger.error("Failed to join meeting", error.message);
    }
};

// Update video tiles for all participants
function updateTiles(meetingSession) {
    const tiles = meetingSession.audioVideo.getAllVideoTiles();
    
    tiles.forEach(tile => {
        const tileState = tile.state();
        const tileId = tileState.tileId;
        const attendeeId = tileState.boundAttendeeId;
        
        let divElement = document.getElementById(`user-container-${attendeeId}`);
        
        // If divElement not found, create it
        if (!divElement) {
            // Extract user name if available
            let userName = "Unknown User";
            if (tileState.boundExternalUserId) {
                userName = tileState.boundExternalUserId.split('#')[0];
            }
            
            // Create player container
            divElement = `<div class="video__container" id="user-container-${attendeeId}">
                            <div class="video-player" id="user-${attendeeId}">
                                <div id="remote-member_name">${userName}</div>
                                <button class="remove__btn" style="display: none;" onclick="removeParticipant('${attendeeId}')">Remove</button>
                            </div>
                        </div>`;
            
            document.getElementById('stream__container').insertAdjacentHTML('beforeend', divElement);
            
            // Create and bind video element
            const videoElement = document.createElement('video');
            videoElement.id = `video-${attendeeId}`;
            videoElement.style.width = "100%";
            videoElement.style.height = "100%";
            videoElement.style.objectFit = "cover";
            document.getElementById(`user-${attendeeId}`).appendChild(videoElement);
            
            meetingSession.audioVideo.bindVideoElement(tileId, videoElement);
        }
    });
}

// Handle user left
let handleUserLeft = async (attendeeId) => {
    delete remoteUsers[attendeeId];
    
    let item = document.getElementById(`user-container-${attendeeId}`);
    if (item) {
        item.remove();
    }
};

let toggleMic = async (e) => {
    let button = e.currentTarget;
    
    await localTracks[0].setMuted(true);
    button.classList.remove('active');
    
    document.getElementById("mute-mic-btn").style.display = 'block';
    document.getElementById("mic-btn").style.display = 'none';
};

let toggleMuteMic = async (e) => {
    let button = e.currentTarget;
    
    // if (localTracks[0].muted) {
        await localTracks[0].setMuted(false);
        document.getElementById("mic-btn").style.display = 'block';
        document.getElementById("mute-mic-btn").style.display = 'none';
        document.getElementById("mic-btn").classList.add('active');
        document.getElementById("mute-video-icon").style.display = 'none';
    // }
};

let toggleCamera = async (e) => {
    let button = e.currentTarget;
    
    await localTracks[1].setMuted(true);
    button.classList.remove('active');
    
    document.getElementById("mute-camera-btn").style.display = 'block';
    document.getElementById("camera-btn").style.display = 'none';
};

let toggleMuteCamera = async (e) => {
    let button = e.currentTarget;
    
    // if (localTracks[1].muted) {
        await localTracks[1].setMuted(false);
        document.getElementById("camera-btn").style.display = 'block';
        document.getElementById("mute-camera-btn").style.display = 'none';
        document.getElementById("camera-btn").classList.add('active');
    // }
};

// Toggle screen sharing
let toggleScreen = async (e) => {
    let screenButton = e.currentTarget;
    let cameraButton = document.getElementById('camera-btn');
    
    if (!sharingScreen) {
        sharingScreen = true;
        
        screenButton.classList.add('active');
        cameraButton.classList.remove('active');
        cameraButton.style.display = 'none';
        
        try {
            // Stop camera video
            await meetingSession.audioVideo.stopVideoInput();
            
            // Start screen capture
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true
            });
            
            // Use the first video track from screen sharing
            const screenTrack = screenStream.getVideoTracks()[0];
            
            await meetingSession.audioVideo.startVideoInput(screenTrack);
            meetingSession.audioVideo.startLocalVideoTile();
            
            // Create screen sharing track object for interface compatibility
            localScreenTracks = {
                track: screenTrack,
                stop: () => {
                    screenTrack.stop();
                }
            };
            
            // Update UI for screen sharing
            document.getElementById(`user-container-${uid}`).remove();
            displayFrame.style.display = 'block';
            
            let player = `<div class="video__container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                </div>`;
            
            displayFrame.insertAdjacentHTML('beforeend', player);
            
            // Add event listener for when screen sharing ends
            screenTrack.addEventListener('ended', () => {
                toggleScreen({ currentTarget: screenButton });
            });
            
        } catch (error) {
            console.error('Error starting screen share:', error);
            sharingScreen = false;
            screenButton.classList.remove('active');
            cameraButton.style.display = 'block';
        }
        
    } else {
        sharingScreen = false;
        cameraButton.style.display = 'block';
        screenButton.classList.remove('active');
        
        if (localScreenTracks) {
            localScreenTracks.stop();
        }
        
        document.getElementById(`user-container-${uid}`).remove();
        
        // Restart camera
        await switchToCamera();
    }
};

// Switch back to camera from screen sharing
let switchToCamera = async () => {
    let player = `<div class="video__container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                 </div>
                 <div>${sessionStorage.getItem("display_name")}</div>`;
    
    displayFrame.insertAdjacentHTML('beforeend', player);
    
    // List video devices and restart camera
    const videoInputs = await meetingSession.audioVideo.listVideoInputDevices();
    if (videoInputs.length > 0) {
        await meetingSession.audioVideo.startVideoInput(videoInputs[0].deviceId);
        meetingSession.audioVideo.startLocalVideoTile();
    }
    
    document.getElementById('mic-btn').classList.remove('active');
};

// Leave meeting
let leaveStream = async (e) => {
    e.preventDefault();
    
    // document.getElementById('join-btn').style.display = 'block';
    document.getElementsByClassName('stream__actions')[0].style.display = 'none';
    
    if (meetingSession) {
        meetingSession.audioVideo.stop();
        meetingSession = null;
    }
    
    if (localScreenTracks) {
        localScreenTracks.stop();
    }
    
    document.getElementById(`user-container-${uid}`).remove();
    document.getElementById('stream__container').innerHTML = '';
};


window.messagingReady.then(() => {
    // Register event listeners
    document.getElementById('camera-btn').addEventListener('click', toggleCamera);
    document.getElementById('mic-btn').addEventListener('click', toggleMic);
    // document.getElementById('join-btn').addEventListener('click', joinStream);
    document.getElementById('mute-mic-btn').addEventListener('click', toggleMuteMic);
    document.getElementById('mute-camera-btn').addEventListener('click', toggleMuteCamera);
    // Uncomment if screen sharing button exists
    // document.getElementById('screen-btn').addEventListener('click', toggleScreen);
    // document.getElementById('leave-btn').addEventListener('click', leaveStream);

    // Initialize on page load
    joinRoomInit();
});
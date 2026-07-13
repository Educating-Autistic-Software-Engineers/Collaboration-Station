var queryString = window.location.search;
var urlParams = new URLSearchParams(queryString);

var roomName;
var ablyChannel;
var roomControlChannel;
var innerChannel;
var ablyInstance;

let isFirstMember = true;
let canSendMessages = true;
window.unreadMessages = 0; // Make globally accessible
let breakoutId = 0;
let roomId = urlParams.get("project");
let connectedUsers = {};

async function initSetup() {
  // Get the roomId from URL parameters (could be 'project' or 'roomId')
  let baseProjectId = urlParams.get("project") || urlParams.get("roomId");
  let breakoutNum = null;

  // Check if roomId contains a breakout component (format: "projectId:breakoutNum")
  if (baseProjectId && baseProjectId.includes(":")) {
    const parts = baseProjectId.split(":");
    baseProjectId = parts[0];
    breakoutNum = parts[1];
  }

  if (!baseProjectId) {
    throw new Error("Missing Project or roomId URL parameter");
  }

  roomId = baseProjectId;
  roomName = "room:" + baseProjectId;

  // If no breakout number in URL, check the API for the current user's breakout assignment
  if (breakoutNum === null) {
    try {
      const resp = await fetch(
        `https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/rooms/breakouts?room=${baseProjectId}&user=${sessionStorage.getItem("email")}`,
      );
      if (resp.ok) {
        const breakoutdata = await resp.json();
        if (
          breakoutdata &&
          breakoutdata.redirect &&
          breakoutdata.redirect !== 0
        ) {
          breakoutNum = breakoutdata.redirect;
        }
      } else {
        console.log("BreakoutRoom not found");
        console.log(baseProjectId);
        console.log(sessionStorage.getItem("email"));
      }
    } catch (err) {
      console.error("initSetup breakoutfetch failed", err);
    }
  }

  let sharedVc = false;
  try {
    const sharedVcResp = await fetch(
      `https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/rooms/breakouts` +
        `?room=${baseProjectId}&batch=${encodeURIComponent(sessionStorage.getItem("email") || "")}`,
    );
    if (sharedVcResp.ok) {
      const sharedVcJson = await sharedVcResp.json();
      sharedVc = Boolean(sharedVcJson.shared_vc);
    }
  } catch (err) {
    console.error("initSetup shared_vc fetch failed", err);
  }
  // If we have a breakout number, add it to room identifiers
  if (breakoutNum !== null) {
    roomName += ":" + breakoutNum;
    breakoutId = breakoutNum;
    roomId += ":" + breakoutNum;
  } else {
    breakoutId = 0;
  }

  // chimeRoomId: base room when shared_vc so everyone joins one Chime
  // meeting; otherwise falls back to the (possibly breakout) roomId.
  window.chimeRoomId = sharedVc ? baseProjectId : roomId;
  window.sharedVcMode = sharedVc;
  console.log(
    `shared_vc=${sharedVc}, chimeRoomId=${window.chimeRoomId}, vmRoomId=${roomId}`,
  );

  ablyInstance = new Ably.Realtime({
    authUrl:
      "https://0dhyl8bktg.execute-api.us-east-2.amazonaws.com/scratchBlock/ablyToken?name=" +
      sessionStorage.getItem("name"),
  });

  window.messagingConnected = new Promise((resolve) => {
    ablyInstance.connection.once("connected", () => {
      console.log("Ably connected in messaging!!!!!!!!");
      resolve();
    });
  });

  ablyInstance.connection.on("failed", (err) => {
    console.error("Ably connection failed", err);
  });

  // get project URL id
  ablyChannel = ablyInstance.channels.get(roomName);
  innerChannel = ablyInstance.channels.get(roomName + "_inner");
  roomControlChannel = ablyInstance.channels.get(
    `room:${baseProjectId}:control`,
  );

  try {
    await ablyChannel.presence.enter({
      email: sessionStorage.getItem("email"),
      name: sessionStorage.getItem("display_name"),
    });
  } catch (err) {
    console.error("Failed to enter Ably presence", err);
  }
}

var sendMessage,
  handleChannelMessage,
  removeParticipant,
  muteAllParticipants,
  updateMessageCounter,
  muteParticipant,
  disableMessage;

window.messagingReady = (async () => {
  await initSetup();
})();

window.messagingReady.catch((err) => {
  console.error("Failed to initialize messaging system", err);
});

window.messagingReady.then(() => {
  const getMemberEmail = (memberData) => {
    if (memberData && typeof memberData === "object") {
      return memberData.email || memberData.requestId || "";
    }

    return memberData || "";
  };

  const getMemberName = (memberData) => {
    if (memberData && typeof memberData === "object") {
      return (
        memberData.name ||
        memberData.display_name ||
        memberData.email ||
        memberData.requestId ||
        "Unknown user"
      );
    }

    return memberData || "Unknown user";
  };

  const addPerson = async (memberData) => {
    const email = getMemberEmail(memberData);

    if (!email || email in connectedUsers) {
      return;
    }

    handleUserJoined({
      email,
      name: getMemberName(memberData),
    });
  };

  // Load message history when room is first entered
  const loadInitialMessages = async () => {
    try {
      const projectId = urlParams.get("project");
      const response = await fetch(
        `https://lo4iehk4j4.execute-api.us-east-2.amazonaws.com/messages/RetrieveMessage?id=${projectId}&breakout_id=${breakoutId}`,
        {
          method: "GET",
        },
      );

      if (response.ok) {
        const messages = await response.json();
        // Display messages in reverse order (oldest first)
        messages.reverse().forEach((msg) => {
          console.log(msg);
          addArchiveMessageToDom(
            msg.Username,
            msg.Message,
            msg.color,
            msg.Time,
          );
        });
      }
    } catch (err) {
      console.error("Failed to load initial messages", err);
    }
  };
  loadInitialMessages();

  ablyChannel.presence.subscribe("enter", async (member) => {
    const presenceSet = await ablyChannel.presence.get();
    const users = presenceSet.map((member) => member.data);
    for (const user of users) {
      addPerson(user);
    }
  });

  let handleUserJoined = (data) => {
    const email = getMemberEmail(data);
    const name = getMemberName(data);

    console.log("Ably Joined: ", name);

    connectedUsers[email] = { ...data, email, name };
    addMemberToDom({ ...data, email, name });
    updateMemberTotal(Object.keys(connectedUsers).length);
    try {
      if (window.refreshMembers) window.refreshMembers();
    } catch (e) {
      /* ignore */
    }
    addBotMessageToDom(`Welcome to the room ${name}! 👋`);
  };

  let handleMemberLeft = (memberData) => {
    const email = getMemberEmail(memberData);

    console.log("Ably Left: ", email);

    var data = connectedUsers[email] || {
      email,
      name: getMemberName(memberData),
    };
    delete connectedUsers[email];
    removeMemberFromDom(data);
    updateMemberTotal(Object.keys(connectedUsers).length);
    try {
      if (window.refreshMembers) window.refreshMembers();
    } catch (e) {
      /* ignore */
    }
  };
  ablyChannel.presence.subscribe("leave", (member) => {
    handleMemberLeft(member.data);
  });

  roomControlChannel.subscribe("breakout_refresh", () => {
    try {
      if (window.onbeforeunload) window.onbeforeunload = null;
    } catch (e) {}
    window.location.reload();
  });

  // Expose a helper to get current presence (array of emails)
  window.getCurrentPresence = async () => {
    try {
      const presenceSet = await ablyChannel.presence.get();
      console.log("Gained a presence");
      return presenceSet.map((m) => getMemberEmail(m.data));
    } catch (e) {
      console.error("Failed to get presence", e);
      return [];
    }
  };

  let addMemberToDom = async (member) => {
    console.log("ably MEMBER", member);

    let memberEmail = member.email;
    let name = member.name;
    let memberColor = "ff0000";

    let membersWrapper = document.getElementById("member__list");

    if (document.getElementById(`member__${memberEmail}__wrapper`)) {
      return;
    }
    let role = sessionStorage.getItem("role");

    let removeButton =
      role === "TA"
        ? `<button class="remove__btn" onclick="removeParticipant('${memberEmail}')"><i class="fas fa-user-times"></i></button>`
        : "";
    let muteButton =
      role === "TA"
        ? `<button class="mute__btn" onclick="muteParticipant('${memberEmail}')"><i class='fas fa-volume-mute'></i></button>`
        : "";
    let disableMessages =
      role === "TA"
        ? `<button class="disableMessage__btn" onclick="disableMessage('${memberEmail}')"><i class='fas fa-comment-slash' style='font-size:15px'></i></button>`
        : "";
    let memberItem = `<div class="member__wrapper" id="member__${memberEmail}__wrapper">
                            <span class="green__icon"></span>
                            <span class="member-avatar">👤</span>
                            <p class="member_name" id="rtmName">${name}</p>
                            <span class="member_name_buttons">
                                ${removeButton}
                                ${muteButton}
                                ${disableMessages}
                            </span>
                        </div>`;

    membersWrapper.insertAdjacentHTML("beforeend", memberItem);
  };

  let updateMemberTotal = async (membersAmount) => {
    document.getElementById("members__count").innerText = membersAmount;
    document.getElementById("connectedCount").innerText = membersAmount;
  };

  let removeMemberFromDom = async (data) => {
    console.log(data);
    let email = data.email;
    try {
      let memberWrapper = document.getElementById(`member__${email}__wrapper`);
      addBotMessageToDom(`${data.name} has left the room.`);

      memberWrapper.remove();
    } catch (e) {
      console.warn("Member DNE: " + e);
    }
  };

  updateMessageCounter = () => {
    const el = document.getElementById("messageCount");
    if (!el) return;

    if (!window.unreadMessages || window.unreadMessages <= 0) {
      el.style.display = "none";
      el.innerText = "";
      return;
    }

    el.style.display = "inline-block";
    if (window.unreadMessages > 9) {
      el.innerText = "9+";
    } else {
      el.innerText = window.unreadMessages;
    }
  };

  window.updateMessageCounter = updateMessageCounter;

  try {
    updateMessageCounter();
  } catch (e) {}

  handleChannelMessage = async (messageData, MemberId) => {
    console.log("A new message was received");
    let data = JSON.parse(messageData.text);

    console.log("DATA", data);

    if (data.type === "chat") {
      const messagesContainer = document.getElementById("messages__container");
      const isChatVisible =
        messagesContainer && messagesContainer.classList.contains("active");

      if (!isChatVisible) {
        console.log("Inside message counter");
        window.unreadMessages++;
        updateMessageCounter();
      }

      addMessageToDom(data.displayName, data.message, data.color);
    }

    if (data.type === "user_left") {
      document.getElementById(`user-container-${data.uid}`).remove();

      if (userIdInDisplayFrame === `user-container-${uid}`) {
        displayFrame.style.display = null;

        for (let i = 0; videoFrames.length > i; i++) {
          videoFrames[i].style.height = "300px";
          videoFrames[i].style.width = "300px";
        }
      }
    }

    if (data.type === "remove" && data.target === uid) {
      alert("You have been removed from the channel.");
      let email = sessionStorage.getItem("email");
      window.location.href = `projects.html?email=${email}`;
      await leaveStream();
    }

    if (data.type === "mute") {
      // Mute the remote user's audio track
      if (localTracks[0]) {
        await localTracks[0].setMuted(true);
        localTracks[0]._mediaStreamTrack.enabled = false;
        document.getElementById("mic-btn").classList.remove("active");
        document.getElementById("mic-btn").style.display = "none";
        document.getElementById("mute-mic-btn").style.display = "block";
        document.getElementById(`mute-video-${MemberId}`).style.display =
          "inline";
      }
      alert("You have been muted by the TA.");
    }

    if (data.type === "muteMember" && data.target === uid) {
      if (localTracks[0]) {
        await localTracks[0].setMuted(true);
        localTracks[0]._mediaStreamTrack.enabled = false;
        document.getElementById("mic-btn").classList.remove("active");
        document.getElementById("mic-btn").style.display = "none";
        document.getElementById("mute-mic-btn").style.display = "block";
        document.getElementById(`mute-video-${MemberId}`).style.display =
          "inline";
      }
      alert("You have been muted by the TA.");
    }
    //  else if (data.type === 'unmute' && data.target === uid) {
    //     // Unmute the remote user's audio track
    //     if (localTracks[0]) {
    //         await localTracks[0].setMuted(false);
    //         localTracks[0]._mediaStreamTrack.enabled = true;
    //     }
    //     alert('You have been unmuted by the TA.');
    // }

    if (data.type === "disable_messages" && data.target === uid) {
      alert(`You have been disabled from sending messages for 5 minutes.`);
      const inputMessage = document.querySelector('input[name="message"]');
      inputMessage.disabled = true;

      // update time shown remaining every second
      let remainingTime = 5 * 60;
      const interval = setInterval(() => {
        remainingTime--;
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        inputMessage.placeholder = `You are disabled from sending messages for ${minutes}:${seconds < 10 ? "0" : ""}${seconds}.`;
        if (remainingTime <= 0) {
          clearInterval(interval);
          inputMessage.disabled = false;
          inputMessage.placeholder = `Send a message....`;
        }
      }, 1000);
    }
  };

  let moveParticipant = async (MemberId) => {};

  let removeParticipant = async (MemberId) => {
    if (MemberId === sessionStorage.getItem("email")) {
      alert("You cannot remove yourself from the channel.");
      return;
    }
    await ablyChannel.publish("removeParticipant", { participant: MemberId });
  };
  window.removeParticipant = removeParticipant;
  ablyChannel.subscribe("removeParticipant", async (message) => {
    const { participant } = message.data;
    const to_email = sessionStorage.getItem("email");
    console.log(participant, to_email);
    try {
      if (participant == to_email) {
        ablyChannel.unsubscribe();
        alert("You have been removed from the channel.");
        window.location.href = `projects.html?email=${to_email}`;
      }
      addBotMessageToDom(`${participant} has been removed from the channel.`);
    } catch (error) {
      console.error(error);
    }
  });

  document
    .getElementById("end-meet-btn")
    .addEventListener("click", async () => {
      if (!confirm("Are you sure you want to end the meeting?")) {
        return;
      }
      await ablyChannel.publish("end_meeting", "");
      window.location.href =
        "projects.html?email=" + sessionStorage.getItem("email");
    });
  ablyChannel.subscribe("end_meeting", () => {
    window.location.href =
      "projects.html?email=" + sessionStorage.getItem("email");
  });

  async function muteAllParticipants() {
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

    await channel.sendMessage({ text: JSON.stringify({ type: "mute" }) });

    for (const member in remoteUsers) {
      console.log(
        "Remote Users calls",
        member,
        remoteUsers,
        remoteUsers[member],
      );
      if (member !== uid) {
        // Skip muting the local user (TA)
        const remoteUser = remoteUsers[member];
        if (remoteUser && remoteUser.audioTrack) {
          if (
            remoteUser &&
            remoteUser.audioTrack &&
            remoteUser.audioTrack._mediaStreamTrack
          ) {
            // remoteUser.audioTrack._mediaStreamTrack.enabled = false; // Mute the audio track
            //    remoteUser.localTracks[0].setMuted(true);
            // document.getElementById('mic-btn').classList.remove('active')
          }
        }
      }
    }
    alert("All participants have been muted.");
  }
  window.muteAllParticipants = muteAllParticipants;

  async function muteParticipant(MemberId) {
    await channel.sendMessage({
      text: JSON.stringify({ type: "muteMember", target: MemberId }),
    });
  }
  window.muteParticipant = muteParticipant;

  let disableMessage = async (MemberId) => {
    if (MemberId === sessionStorage.getItem("email")) {
      alert("You cannot disable yourself from sending messages.");
      return;
    }

    await ablyChannel.publish("disable_messages", {
      target: MemberId,
      duration: 5 * 60 * 1000,
    });
  };
  window.disableMessage = disableMessage;

  ablyChannel.subscribe("disable_messages", async (message) => {
    if (!canSendMessages) {
      return;
    }

    const { target, duration } = message.data;
    const to_email = sessionStorage.getItem("email");
    console.log(target, to_email);
    try {
      if (target == to_email) {
        alert("You have been disabled from sending messages for 5 minutes.");
        canSendMessages = false;
        setTimeout(() => {
          canSendMessages = true;
          alert("You can now send messages again.");
        }, duration);
      }
      addBotMessageToDom(
        `${target} has been disabled from sending messages for 5 minutes.`,
      );
    } catch (error) {
      console.error(error);
    }
  });

  sendMessage = async (message, AI = false) => {
    if (!canSendMessages) {
      return;
    }
    const displayName = AI ? "AI bot" : sessionStorage.getItem("display_name");

    let projectId = urlParams.get("project");
    const date = new Date();
    let readableDate = date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });

    isoDate = date.toISOString();
    console.log(breakoutId);
    await fetch(
      "https://lo4iehk4j4.execute-api.us-east-2.amazonaws.com/messages/addMessage",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: Date.now().toString(),
          project_id: projectId,
          Username: displayName,
          Message: message,
          Time: readableDate,
          Date: isoDate,
          breakout_id: breakoutId.toString(),
        }),
      },
    );
    ablyChannel.publish("chat", {
      displayName,
      message,
      color: AI ? "#f59e0b" : sessionStorage.getItem("randomColor"),
    });
  };

  window.sendMessage = sendMessage;

  //*
  // TODO Send Teacher Message to update which AI response was shared to students at what time
  //  */
  window.sendTeacherMessage = async (message, taskId) => {
    sendMessage(message, true);
    const payload = {
      project_id: urlParams.get("project"),
      message: message,
      breakout_id: breakoutId.toString(),
      user: sessionStorage.email,
      task_id: taskId || null,
    };
    const response = await fetch(
      "https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/task-chat/share",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
  };
  ablyChannel.subscribe("chat", async (message) => {
    addMessageToDom(
      message.data.displayName,
      message.data.message,
      message.data.color,
    );
  });

  let scrollChatToBottom = () => {
    requestAnimationFrame(() => {
      const outer = document.getElementById("messages__container");
      if (outer) outer.scrollTop = outer.scrollHeight;
      const inner = document.querySelector("messages");
      if (inner) inner.scrollTop = inner.scrollHeight;
    });
  };
  let addMessageToDom = (name, message, color) => {
    // messageCount+=1;
    // console.log(messageCount)
    // document.getElementById("messageCount").innerText=messageCount;

    let messagesWrapper = document.getElementById("messages");

    let newMessage = `<div class="message__wrapper">
                            <div class="message__body">
                                <div class="message__header">
                                    <div class="message__author-avatar" style="background: ${color || "#6366f1"}">
                                        ${name.charAt(0).toUpperCase()}
                                    </div>
                                    <strong class="message__author" style="color: ${color || "#6366f1"}">${name}</strong>
                                    <span class="message__timestamp">${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                </div>
                                <div class="message__text">${message}</div>
                            </div>
                        </div>`;

    messagesWrapper.insertAdjacentHTML("beforeend", newMessage);
    messagesWrapper.scrollTop = messagesWrapper.scrollHeight;

    let lastMessage = document.querySelector(
      "#messages .message__wrapper:last-child",
    );
    scrollChatToBottom();
  };

  let addArchiveMessageToDom = (name, message, color, time) => {
    console.log(time);

    const date = new Date(time.replace(" at ", " "));
    const formatter = new Intl.DateTimeFormat("en-US", {
      month: "long", // "June"
      day: "numeric", // "22"
      hour: "numeric", // "4"
      minute: "2-digit", // "15"
      hour12: true, // "PM"
    });
    let result = formatter.format(date);
    let messagesWrapper = document.getElementById("messages");

    let newMessage = `<div class="message__wrapper">
                            <div class="message__body">
                                <div class="message__header">
                                    <div class="message__author-avatar" style="background: ${color || "#6366f1"}">
                                        ${name.charAt(0).toUpperCase()}
                                    </div>
                                    <strong class="message__author" style="color: ${color || "#6366f1"}">${name}</strong>
                                    <span class="message__timestamp">${result}</span>
                                </div>
                                <div class="message__text">${message}</div>
                            </div>
                        </div>`;

    messagesWrapper.insertAdjacentHTML("beforeend", newMessage);

    let lastMessage = document.querySelector(
      "#messages .message__wrapper:last-child",
    );
  };

  function addBotMessageToDom(botMessage) {
    let messagesWrapper = document.getElementById("messages");

    let newMessage = `<div class="message__wrapper">
                            <div class="message__body__bot">
                                <strong class="message__author__bot">🤖 CollabStation Bot</strong>
                                <p class="message__text__bot">${botMessage}</p>
                            </div>
                        </div>`;

    messagesWrapper.insertAdjacentHTML("beforeend", newMessage);
    messagesWrapper.scrollTop = messagesWrapper.scrollHeight;

    let lastMessage = document.querySelector(
      "#messages .message__wrapper:last-child",
    );
  }
});

const AWS = require("aws-sdk");
const chime = new AWS.ChimeSDKMeetings({ region: "us-east-1" });

exports.handler = async (event) => {
    try {
        console.log("Incoming event:", JSON.stringify(event));

        const requestBody = JSON.parse(event.body || '{}');

        if (event.path === "/create-meeting") {
            const meetingResponse = await chime.createMeeting({
                ClientRequestToken: Date.now().toString(),
                MediaRegion: "us-east-1",
                ExternalMeetingId: "unique-id-for-meeting", // optionally make this dynamic
            }).promise();

            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
                body: JSON.stringify(meetingResponse),
            };
        }

        else if (event.path === "/join-meeting") {
            const meetingId = requestBody.meetingId;
            const userId = requestBody.userId || Date.now().toString();

            if (!meetingId) {
                return {
                    statusCode: 400,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type',
                    },
                    body: JSON.stringify({ error: "Missing meetingId in request body" }),
                };
            }

            const meetingResponse = await chime.getMeeting({
                MeetingId: meetingId,
            }).promise();

            const attendeeResponse = await chime.createAttendee({
                MeetingId: meetingId,
                ExternalUserId: userId,
            }).promise();

            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
                body: JSON.stringify({
                    Meeting: meetingResponse.Meeting,
                    Attendee: attendeeResponse.Attendee
                }),
            };
        }

        else {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
                body: "Invalid API request"
            };
        }

    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify({ error: error.message }),
        };
    }
};

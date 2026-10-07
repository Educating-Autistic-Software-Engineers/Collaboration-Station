const AWS = require("aws-sdk");

AWS.config.update({
    region: "us-east-2"
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

const dynamodbTableName = "scratchblocks";

// const requestParamPath = "/register/{id}"; // path gets a ticket by ID

const requestPath = "/save";

// Partition key for a saved project record in the table. Adjust this if
// your table's actual key is named differently.
const PRIMARY_KEY = "scratchblockid";

exports.handler = async function (event) {

    console.log("Request event method: ", event.httpMethod);

    console.log("EVENT\n" + JSON.stringify(event, null, 2));

    let response;

    switch (true) {

        //get customer email by id
        case event.httpMethod === "GET" && event.requestContext.resourcePath === requestPath:
            response = await getRequests();
            break;

        //post a new request
        case event.httpMethod === "POST" && event.requestContext.resourcePath === requestPath:
            response = await addRequest(JSON.parse(event.body)); // change addRequest() to your function
            break;

        case event.httpMethod === "GET" && event.requestContext.resourcePath === requestPath:
            response = await getRequests();
            break;

        default:
            response = buildResponse(404, {message: "Not found"});
    }
    return response;
}


async function getRequests() { // gets all requests in the system

    const params = {
        TableName: dynamodbTableName
    }

    try {
        const dynamoData = await dynamodb.scan(params).promise();

        const filteredRequests = dynamoData.Items.filter(item => item.hasOwnProperty("scratchblockid"));

        const body = {
            requests: filteredRequests
        }

        //Item found, return successful response
        return buildResponse(200, body);

    } catch (error) {
        //Build error response
        console.error('Error scanning DynamoDB records: ', error);

        return buildResponse(500, { error: "Internal Server Errorrrr" });
    }
}


function buildResponse(statusCode, body) {
    return {
        statusCode: statusCode,
        headers: {
            "Content-Type": "application/json",
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(body)
    }
}


// A serialized Scratch project (the sb3-style `{ targets: [...] }` shape
// that scratch-vm's toJSON() / project.json produce) counts as "empty" if
// every target's `blocks` map has no entries -- i.e. it's a brand-new
// default project (Stage + Sprite1, no scripts) rather than someone's real
// work. If the shape doesn't look like a project at all, we deliberately
// don't treat that as "empty" -- better to let an unrecognized save through
// than to silently block a legitimate one because our shape-detection guessed
// wrong.
function isEmptyProject(project) {
    if (!project || !Array.isArray(project.targets) || project.targets.length === 0) {
        return false;
    }
    return project.targets.every(target => {
        const blocks = target && target.blocks;
        if (!blocks || typeof blocks !== "object") return true;
        return Object.keys(blocks).length === 0;
    });
}

// Pulls the serialized project out of the incoming request body. Handles a
// few likely shapes so this works whether the client sends the project as
// the body itself, or nested under a field (checks `versionData` first since
// that's the field name the existing s3-storage save endpoint uses, plus a
// couple of other common names) -- as either an object or a JSON string.
// Update this if your actual save payload shape is different.
function extractProject(requestBody) {
    if (!requestBody) return null;
    if (Array.isArray(requestBody.targets)) return requestBody;

    for (const field of ["versionData", "project", "projectData", "data"]) {
        const value = requestBody[field];
        if (!value) continue;

        if (typeof value === "string") {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed.targets)) return parsed;
            } catch (e) {
                // not JSON -- ignore and keep looking
            }
        } else if (Array.isArray(value.targets)) {
            return value;
        }
    }
    return null;
}

async function addRequest(requestBody) { // adds a request to the table

    // Validate required fields
    // const requiredFields = "scratchblockid";
    // const requiredFields = ["id"];
    // const missingFields = requiredFields.filter(field => !(field in requestBody));

    // if (missingFields.length > 0) {
    //     const errorMessage = `Missing required fields: ${missingFields.join(", ")}`;
    //     return buildResponse(400, { error: errorMessage });


    // If all required fields are present, proceed with DynamoDB put

    const params = {
        TableName: dynamodbTableName,
        Item: requestBody
    };

    try {
        // Guard against clobbering an existing saved project with an
        // empty/default one. Only meaningful if we can identify (a) an
        // existing version for this key, and (b) that the incoming save has
        // no code -- if either check is inconclusive, we let the save
        // through rather than risk blocking a real save.
        const key = requestBody && requestBody[PRIMARY_KEY];

        if (key) {
            const existing = await dynamodb.get({
                TableName: dynamodbTableName,
                Key: { [PRIMARY_KEY]: key }
            }).promise();

            if (existing.Item) {
                const incomingProject = extractProject(requestBody);
                if (incomingProject && isEmptyProject(incomingProject)) {
                    console.warn(
                        "Refusing to overwrite existing project", key,
                        "with an empty/default (no-code) project"
                    );
                    return buildResponse(409, {
                        Operation: "SAVE",
                        error: "REFUSED_EMPTY_OVERWRITE",
                        Message: "A saved version already exists for this project, and the incoming " +
                            "save has no code. Refusing to overwrite it with an empty/default project."
                    });
                }
            }
        }

        //Successful response
        await dynamodb.put(params).promise();

        const successBody = {
            Operation: "SAVE",
            Message: "SUCCESS",
            Item: requestBody
        };

        return buildResponse(200, successBody);

        //Error handling
    } catch (error) {
        console.error("Error saving to DynamoDB: ", error);

        const errorBody = {
            Operation: "SAVE",
            Message: "Error: There was an error with your post request, please try again"
        };

        return buildResponse(500, errorBody);
    }
}
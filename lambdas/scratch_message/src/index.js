const AWS = require("aws-sdk");
AWS.config.update({
    region: "us-east-2"
});
const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodbTableName = "EdASE_Messages";

// const requestParamPath = "/register/{id}"; // path gets a ticket by ID
const requestPath = "/addMessage";


exports.handler = async function (event) {
    console.log("Request event method: ", event.httpMethod);
    console.log("EVENT\n" + JSON.stringify(event, null, 2));
    let response;
    switch (true) {
            
        //post a new request
        case event.httpMethod === "POST" && event.requestContext.resourcePath === requestPath:
            response = await addMessage(JSON.parse(event.body)); // change addRequest() to your function
            break;
        case event.httpMethod === "GET" && event.requestContext.resourcePath === "/RetrieveMessage":
            response = await getMessage(event.queryStringParameters);
            break;
         default:
            response = buildResponse(404, { message: "Response Not Found "+ event.httpMethod+  " + " +event.requestContext.resourcePath });
    }
    return response;
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

async function getMessage(data){

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const timeValue = tenDaysAgo.toISOString();

    console.log(data)

    const params = {
        TableName: dynamodbTableName,
        IndexName: "DSI",
        KeyConditionExpression: "#pid = :pidVal AND #bid = :bidVal",
        FilterExpression: '#t >= :timeVal',
        ExpressionAttributeNames: {
            "#pid": "project_id",
            "#bid": "breakout_id",
            "#t": "Date"          
        },
        ExpressionAttributeValues: {
            ":pidVal": data.id, 
            ":timeVal": timeValue,
            ":bidVal": data.breakout_id
        },
        ScanIndexForward: false,
        Limit: 10
    }
    try{
        const data = await dynamodb.query(params).promise();


        return buildResponse(200, data.Items);
    }catch(error){
        console.error("DynamoDB query failed with error: ", error);
        return buildResponse(500, {error: error})
    }

}

async function addMessage(requestBody) { // adds a request to the table
    // Validate required fields
    // const requiredFields = ["id","name", "email", "projects"];
    // const requiredFields = ["id"];
    // const missingFields = requiredFields.filter(field => !(field in requestBody));

    // if (missingFields.length > 0) {
    //     const errorMessage = `Missing required fields: ${missingFields.join(", ")}`;
    //     return buildResponse(400, { error: errorMessage });
    // }

    // If all required fields are present, proceed with DynamoDB put
    const params = {
        TableName: dynamodbTableName,
        Item: requestBody
    };
    console.log(requestBody)

    try {
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
        const errorBody = {
            Operation: "SAVE",
            Message: "Error: There was an error with your post request, please try again" + error
        };
        return buildResponse(500, errorBody);
    }
}
const AWS = require("aws-sdk");
AWS.config.update({
    region: "us-east-2"
});
const dynamodb = new AWS.DynamoDB.DocumentClient();
const authTableName = "auth";

exports.handler = async (event) => {

  try {

    const auth = await validateToken(event);

    if (!auth.valid) {
      return auth.response;
    }

    let response;

    if (event.httpMethod === "GET") {
      response = await getRooms(event);
    } else if (event.httpMethod === "POST") {
      response = await postRooms(JSON.parse(event.body));
    } else if (event.httpMethod === "PATCH") {
      response = await patchRooms(JSON.parse(event.body));
    } else if (event.httpMethod === "PUT") {
      response = await putRoom(JSON.parse(event.body));
    } else {
      response = buildResponse(404, {
        error: "Unsupported method"
      });
    }

    return response;

  } catch (err) {
    console.error(err);

    return buildResponse(500, {
      error: "Internal Server Error"
    });
  }
};

async function putRoom(data) {
  try {
    const roomId = data.room_id;
    const meetingID = data.meetingID;

    if (!roomId || !meetingID) {
      throw new Error("Missing required fields: room_id and meetingID");
    }

    const params = {
      TableName: 'Rooms',
      Key: { room_id: roomId },
      UpdateExpression: "SET meetingID = :meetingID",
      ExpressionAttributeValues: {
        ":meetingID": meetingID
      }
    };
  
    await dynamodb.update(params).promise();

    const successBody = {
      Operation: "UPDATE",
      Message: "SUCCESS",
      Item: roomId
    };
    return buildResponse(200, successBody);
  } catch (error) {
    const errorBody = {
      Operation: "UPDATE",
      Message: `Error: ${error.message || "An error occurred while updating meetingID"}`
    };
    return buildResponse(500, errorBody);
  }
}

async function patchRooms(data) {
  console.log("reached patch")
  console.log(data)

  try {
     
    const params = {
      TableName: "Rooms",
      Key: {
        "room_id": data.roomID
      },
      UpdateExpression: `
        SET editors = list_append(if_not_exists(editors, :empty_list), :new_email)
      `,
      ConditionExpression: "not contains(editors, :email)", 
      ExpressionAttributeValues: {
        ":new_email": [data.user], 
        ":empty_list": [],     
        ":email": data.user        
      },
      ReturnValues: "UPDATED_NEW"
    };

    const result = await dynamodb.update(params).promise();
    return {
      statusCode: 200,
      headers: {
          "Content-Type": "application/json",
          'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.log(error)
    if(error.code ==='ConditionalCheckFailedException'){
      return {
        statusCode: 200, // Return 200 since the user is already an editor
        headers: {
            "Content-Type": "application/json",
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: "User is already an editor of this room." })
      };
      return {
        statusCode: 500,
        headers: {
            "Content-Type": "application/json",
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(error)
      };
    }
    }
    
}

async function postRooms(data) {
  try {
     
    const roomId = String(Math.floor(100000000 + Math.random() * 900000000));
    const room = {
        "room_id": roomId,
        "mode": "self",
        "name": data.name,
    }
    
    await storeRowInDynamoDB(room);

    const successBody = {
        Operation: "SAVE",
        Message: "SUCCESS",
        Item: roomId
    };
    return buildResponse(200, successBody);
  } catch (error) {
    const errorBody = {
        Operation: "SAVE",
        Message: "Error: There was an error with your post request, please try again"
    };
    return buildResponse(500, errorBody);
  }
}

async function getRooms(event) {

  const queryParams = event.queryStringParameters || {};
  const roomId = queryParams.roomId;

  try {
    if (roomId) {
      // If a roomId is provided, do a direct lookup
      const getParams = {
        TableName: "Rooms",
        Key: { room_id: roomId }
      };

      const result = await dynamodb.get(getParams).promise();

      const body = {
        request: result.Item || null
      };

      return buildResponse(200, body);
    } else {
      // No roomId — return all rooms
      const scanParams = {
        TableName: "Rooms"
      };

      const dynamoData = await dynamodb.scan(scanParams).promise();
      const filteredRequests = dynamoData.Items.filter(item => item.hasOwnProperty("room_id"));

      const body = {
        requests: filteredRequests
      };
      return buildResponse(200, body);
    }
  } catch (error) {
    console.error("Error accessing DynamoDB: ", error);
    return buildResponse(500, { error: "Internal Server Error: " + error });
  }
}

async function storeRowInDynamoDB(row) {
    const params = {
        TableName: "Rooms",
        Item: row
    };

    await dynamodb.put(params).promise();
    return;
}

function buildResponse(statusCode, body) {
    return {
        statusCode: statusCode,
        headers: {
            "Content-Type": "application/json",
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(body)
    };
}

async function validateToken(event) {
  const queryParams = event.queryStringParameters || {};

  const email = queryParams.user;
  const token = queryParams.token;


  if (!email || !token) {
    return {
      valid: false,
      response: buildResponse(401, {
        error: "Missing user or token"
      })
    };
  }

  const authUser = await dynamodb.get({
    TableName: authTableName,
    Key: {
      email: email.toLowerCase()
    }
  }).promise();

  console.log(token, authUser.Item.token);

  if (!authUser.Item) {
    return {
      valid: false,
      response: buildResponse(404, {
        error: "User not found"
      })
    };
  }

  if (authUser.Item.token !== token) {
    return {
      valid: false,
      response: buildResponse(403, {
        error: "Invalid token please update"
      })
    };
  }

  return {
    valid: true,
    user: authUser.Item
  };
}
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const blockTable = 'block_moves'; 
const cursorTable = 'mouse_clicks'

exports.handler = async (event) => {
  let response;
  
  if (event.requestContext.resourcePath == "/mouse-click") {
    
    try {
      if (event.httpMethod == "POST") {
        response = await saveCursorPos(event);
      }
    } catch (error) {
      response = {
        statusCode: 405,
        headers: {
          "Content-Type": "application/json",
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PATCH,PUT,DELETE',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify({ message: "errno " + JSON.stringify(error) }),
      };
    }
    
  } else {
  
    try {
      switch (event.httpMethod) {
        case 'POST':
          response = await handlePostRequest(event);
          break;
        case 'GET':
          response = await handleGetRequest(event);
          break;
        default:
          response = {
            statusCode: 405,
            headers: {
              "Content-Type": "application/json",
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PATCH,PUT,DELETE',
              'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify({ message: 'Method Not Allowed' }),
          };
          break;
      }
    } catch (error) {
      response = {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PATCH,PUT,DELETE',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify({ message: 'Internal Server Error (AWS)', error: error.message }),
      };
    }
    
  }
  
  return response;
};

const saveCursorPos = async (event) => {
  const body = JSON.parse(event.body);
  const params = {
    TableName: cursorTable,
    Item: body,
  };

  await dynamoDb.put(params).promise();

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PATCH,PUT,DELETE',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: JSON.stringify({ message: 'Item added successfully', item: body }),
  };
}

const handlePostRequest = async (event) => {

  const body = JSON.parse(event.body);
  const params = {
    TableName: blockTable,
    Item: body,
  };

  await dynamoDb.put(params).promise();
  console.log(body)

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PATCH,PUT,DELETE',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: JSON.stringify({ message: 'Item added successfully', item: body }),
  };
};

const handleGetRequest = async (event) => {
  const { key } = event.queryStringParameters;
  const params = {
    TableName: blockTable,
    Key: {
      'PrimaryKey': key, // Replace 'PrimaryKey' with your table's primary key name
    },
  };

  const result = await dynamoDb.get(params).promise();

  if (!result.Item) {
    return {
      statusCode: 404,
      headers: {
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PATCH,PUT,DELETE',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ message: 'Item not found' }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PATCH,PUT,DELETE',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: JSON.stringify(result.Item),
  };
};

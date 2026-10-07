const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    
    const connectionId = event.requestContext.connectionId;
    const tableName = "smartMouses";
    
    console.log('con', connectionId);

    const putParams = {
        TableName: tableName,
        Item: {
            connectionId: connectionId,
            roomId: event.queryStringParameters ? event.queryStringParameters.room : ""
        },
    };

    try {
        await dynamo.put(putParams).promise();
        return { statusCode: 200, body: 'Connected' };
    } catch (err) {
        console.log('err', JSON.stringify(err))
        return { statusCode: 500, body: 'Failed to connect: ' + JSON.stringify(err) };
    }
};

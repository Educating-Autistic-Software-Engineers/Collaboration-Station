const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    const connectionId = event.requestContext.connectionId;
    const tableName = "smartMouses";

    const deleteParams = {
        TableName: tableName,
        Key: {
            connectionId: connectionId,
        },
    };

    try {
        await dynamo.delete(deleteParams).promise();
        return { statusCode: 200, body: 'Disconnected' };
    } catch (err) {
        return { statusCode: 500, body: 'Failed to disconnect: ' + JSON.stringify(err) };
    }
};

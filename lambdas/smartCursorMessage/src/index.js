const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();
const apigateway = new AWS.ApiGatewayManagementApi({
    endpoint: "https://nwab9zf1ik.execute-api.us-east-2.amazonaws.com/production",
});

exports.handler = async (event) => {

    const message = JSON.parse(event.body);

    const data = await dynamo.query({
        TableName: "smartMouses",
        IndexName: "roomId-index",
        KeyConditionExpression: "roomId = :room",
        ExpressionAttributeValues: {
            ":room": message.room
        }
    }).promise();

    await Promise.all(
        data.Items.map(async ({ connectionId }) => {
            try {
                await apigateway.postToConnection({
                    ConnectionId: connectionId,
                    Data: JSON.stringify(message)
                }).promise();
            } catch (e) {
                if (e.statusCode === 410) {
                    await dynamo.delete({
                        TableName: "smartMouses",
                        Key: {
                            connectionId
                        }
                    }).promise();
                } else {
                    console.error(e);
                }
            }
        })
    );

    return {
        statusCode: 200
    };
};
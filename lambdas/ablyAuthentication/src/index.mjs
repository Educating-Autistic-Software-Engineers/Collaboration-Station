import Ably from 'ably';

export const handler = async (event) => {
    
    const ably = new Ably.Rest({ key: process.env.ablyKey });
    const capabilities = {
        '*': ['publish', 'subscribe', 'presence']
    }
    const tokenRequest = await ably.auth.createTokenRequest({ 
        clientId: event.queryStringParameters.name
    });
    
    
    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
            "keyName": tokenRequest.keyName,
            "clientId": tokenRequest.clientId,
            "timestamp": tokenRequest.timestamp,
            "nonce": tokenRequest.nonce,
            "mac": tokenRequest.mac,
        })
    };
    
}
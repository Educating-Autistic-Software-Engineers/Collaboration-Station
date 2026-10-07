const AWS = require("aws-sdk");
const lambda = new AWS.Lambda();
// const params = {
//   FunctionName: 'scratchImages',
//   MemorySize: 200 // Adjust according to your needs
// };
// lambda.updateFunctionConfiguration(params, function(err, data) {
//   if (err) console.log(err, err.stack);
//   else     console.log(data);
// });
AWS.config.update({
    region: "us-east-2"
});
const s3 = new AWS.S3();

const path = "/s3-storage"

exports.handler = async function (event) {
    const queries = event.queryStringParameters;
    let response;
    switch (true) {
        case event.httpMethod === "GET":
            // return {
            //     statusCode: 200,
            //     headers: {
            //         "content-type": "text/plain",
            //         'Access-Control-Allow-Origin': '*',
            //     },        
            //     body: JSON.stringify(event.queryStringParameters)
            // }
            response = await getStart(queries.fileName);
            break;
        case event.httpMethod === "POST":
            const key = event.queryStringParameters;
            response = await postData(queries.fileName, event.body, event);
            break;
        default:
            response = buildResponse(404, { message: "Not Found" });
    }
    return response;
};

function buildResponse(statusCode, body) {
    return {
        statusCode: statusCode,
        headers: {
            'Access-Control-Allow-Origin': '*',
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET", // Adjust methods as needed
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body)
    };
}

async function getStart(key) {
  
    try {
        
        const params = {
            Bucket: "scratch-images",
            Key: key
        };
        const data = await s3.getObject(params).promise();
        return {
            headers: {
                "Content-Type": "application/json",
                'Access-Control-Allow-Origin': '*',
                "Access-Control-Allow-Headers": "Content-Type,Content-Disposition",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET", // Adjust methods as needed
            },
            statusCode: 200,
            body: data.Body.toString('utf-8')
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify(`Errorr getting object: ${err}`)
        };
    }
}

async function postData(key, data, event) {
    const extension = key.split('.').pop().toLowerCase();

    let postData;
    if (extension === 'png' || extension === 'jpg' || extension === 'jpeg') {
        postData = Buffer.from(data, 'base64');
    } else if (extension === 'svg') {
        postData = data;
    } else if (extension === 'wav' || extension === 'mp3' || extension === 'm4a' || extension === 'aac' || extension === 'oga') {
        const body = JSON.parse(data);
        postData = Buffer.from(body.file, 'base64');
    } else {
        return {
            statusCode: 400,
            body: JSON.stringify(`Unsupported extension: ${extension}`)
        };
    }

    let contentType = '';
    if (extension === 'svg') {
        contentType = 'image/svg+xml';
    } else if (extension === 'png') {
        contentType = 'image/png';
    } else if (extension === 'jpg' || extension === 'jpeg') {
        contentType = 'image/jpeg';
    } else if (extension === 'wav') {
        contentType = 'audio/wav';
    } else if (extension === 'mp3') {
        contentType = 'audio/mpeg';
    }

    const params = {
        Bucket: 'scratch-images',
        Key: key,
        Body: postData,
        ContentType: contentType,
        ContentDisposition: event.queryStringParameters.cd
    };

    try {
        const response = await s3.upload(params).promise();
        return {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Content-Disposition',
            },
            statusCode: 200,
            body: JSON.stringify(
                'File uploaded successfully ext:' +
                extension +
                '; content disp:' +
                event.queryStringParameters.cd
            ) + JSON.stringify(response)
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify('Error uploading file ' + err)
        };
    }
}


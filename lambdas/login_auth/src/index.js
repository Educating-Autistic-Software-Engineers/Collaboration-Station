const AWS = require("aws-sdk");
const crypto = require('crypto');
AWS.config.update({
    region: "us-east-2"
});
const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodbTableName = "auth";
// const emailPasswordsTable = "email_passwords";
const ses = new AWS.SES();

const requestPath = "/register";
const getAllItems = "/getAllItems";
const test = "/test"
const forgotPassword = "/forgot-password"
const pingPath = "/ping"

exports.handler = async function (event) {
    console.log("Request event method: ", event.httpMethod);
    console.log("EVENT\n" + JSON.stringify(event, null, 2));
    let response;
    switch (true) {
        case event.httpMethod === "GET" && event.requestContext.resourcePath === requestPath:
        //Added Hashed password for 6-17 JML    
        if(event.queryStringParameters.hashedPassword){
                response = await getStart(event.queryStringParameters.email, event.queryStringParameters.hashedPassword);
                break;
            }

            response = await getStart(event.queryStringParameters.email, event.queryStringParameters.password);
            break;
        // case event.httpMethod === "PUT" && event.requestContext.resourcePath === requestPath:
        //     response = await addRequest(JSON.parse(event.body));
        //     break;
        case event.httpMethod === "POST" && event.requestContext.resourcePath === requestPath:
            response = await addRequest(JSON.parse(event.body));
            break;
        case event.httpMethod === "PATCH" && event.requestContext.resourcePath === pingPath:
            response = await updatePing(JSON.parse(event.body));
            break;
        case event.httpMethod === "PATCH" && event.requestContext.resourcePath === requestPath:
            response = await updateProject(JSON.parse(event.body));
            break;
        case event.httpMethod === "GET" && event.requestContext.resourcePath === getAllItems:
            response = await getRequests(
                event.queryStringParameters.email,
                event.queryStringParameters.token
            );
            break;
        case event.httpMethod === "PATCH" && event.requestContext.resourcePath === getAllItems:
            response = await updateUser(JSON.parse(event.body));
            break;
        case event.httpMethod === "GET" && event.requestContext.resourcePath === test:
            response = await getTest(event.queryStringParameters.email, event.queryStringParameters.password);
            break;
        case event.httpMethod === "POST" && event.requestContext.resourcePath === test:
            response = await addTest(JSON.parse(event.body));
            break;
        case event.httpMethod === "GET" && event.requestContext.resourcePath === forgotPassword:
            response = await handleForgotPassword(event.queryStringParameters.email);
            break;
        case event.httpMethod === "POST" && event.requestContext.resourcePath === forgotPassword:
            response = await resetPassword(JSON.parse(event.body));
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
            "Content-Type": "application/json",
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PATCH,PUT,DELETE',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify(body)
    };
}

async function getStart(RequestId, pass) {
    const params = {
        TableName: dynamodbTableName,
        Key: {
            "email": RequestId.toLowerCase()
        }
    };
    try {
        const response = await dynamodb.get(params).promise();

        if (!response.Item) {
            return buildResponse(404, { error: "ID not found, please enter a valid one" });
        }
        

        if (pass != response.Item.password) {
            return buildResponse(401, { error: "Password wrong" });
        }

        const _token = crypto.randomBytes(32).toString('hex');

        await dynamodb.update({
            TableName: dynamodbTableName,
            Key: {
                email: RequestId.toLowerCase()
            },
            UpdateExpression: 'SET #token = :token',
            ExpressionAttributeNames: {
                '#token': 'token'
            },
            ExpressionAttributeValues: {
                ':token': _token
            }
        }).promise();
        
        const body = {
            message: "Start date successfully retrieved",
            requestId: RequestId,
            name: response.Item.name,
            projects: response.Item.projects,
            role: response.Item.role,
            token: _token
        };

        return buildResponse(200, body);
    } catch (error) {
        console.error("Error fetching item from DynamoDB: ", error);
        return buildResponse(500, { error: "Internal Server Errorrrrr" });
    }
}

async function getRequests() {
    const params = {
        TableName: dynamodbTableName
    };

    try {
        const dynamoData = await dynamodb.scan(params).promise();
        const filteredRequests = dynamoData.Items.filter(item => item.hasOwnProperty("email"));
        const body = {
            requests: filteredRequests
        };
        return buildResponse(200, body);
    } catch (error) {
        console.error('Error scanning DynamoDB records: ', error);
        return buildResponse(500, { error: "Internal Server Errorr" });
    }
}

async function updateUser(requestBody) {
    if (!requestBody || typeof requestBody !== "object") {
      return buildResponse(400, { error: "Invalid request body" });
    }
  
    const { email, ...fields } = requestBody;
  
    if (!email) {
      return buildResponse(400, { error: "Missing email" });
    }
  
    const keys = Object.keys(fields);
    if (keys.length === 0) {
      return buildResponse(400, { error: "No fields to update" });
    }
  
    const UpdateExpressionParts = [];
    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};
  
    keys.forEach((key, index) => {
      const attrName = `#k${index}`;
      const attrValue = `:v${index}`;
  
      UpdateExpressionParts.push(`${attrName} = ${attrValue}`);
      ExpressionAttributeNames[attrName] = key;
      ExpressionAttributeValues[attrValue] = fields[key];
    });
  
    const params = {
      TableName: dynamodbTableName,
      Key: { email },
      UpdateExpression: `SET ${UpdateExpressionParts.join(", ")}`,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ConditionExpression: "attribute_exists(email)", // prevents creating new users
      ReturnValues: "UPDATED_NEW"
    };
  
    try {
      const result = await dynamodb.update(params).promise();
  
      return buildResponse(200, {
        Operation: "UPDATE",
        Message: "SUCCESS",
        UpdatedAttributes: result.Attributes
      });
    } catch (error) {
      console.error("Error updating user:", error);
      return buildResponse(500, {
        Operation: "UPDATE",
        Message: "Internal Server Error"
      });
    }
  }

async function updatePing(requestBody) {

    const { email } = requestBody

    var currTime = Math.floor(Date.now() / 1000);

    const params = {
        TableName: dynamodbTableName,
        Key: { email }, 
        UpdateExpression: 'set lastActive = :lastTime',
        ExpressionAttributeValues: {
            ':lastTime': currTime
        },
        ReturnValues: 'UPDATED_NEW'
    };
    try {
        await dynamodb.update(params).promise();
        
        const successBody = {
            Operation: "UPDATE",
            Message: "SUCCESS",
            Item: requestBody
        };
        return buildResponse(200, successBody);
        
    } catch (error) {
        const errorBody = {
            Operation: "UPDATE",
            Message: "Error: There was an error with your PUT request, please try again"
        };
       return buildResponse(500, { error: "Internal Server Errorrrrr" });
    }
}

async function addRequest(requestBody) {
    
    
    try {

        for (const row of requestBody) {
            await storeRowInDynamoDB(row);
        }

        const successBody = {
            Operation: "SAVE",
            Message: "SUCCESS",
            Item: requestBody
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



async function storeRowInDynamoDB(row) {
    const params = {
        TableName: dynamodbTableName,
        Item: row
    };

    await dynamodb.put(params).promise();
    return;
}


async function updateProject(requestBody) {
    
    
    const { email, projects } = requestBody; 
    console.log(projects)
    
    const getParams = {
        TableName: dynamodbTableName,
        Key: { email }
    };
    
    let currentProjects;
    try {
        const data = await dynamodb.get(getParams).promise();
        console.log("data"+ data);
        console.log("data22"+ data.Item.projects);
        currentProjects = data.Item ? data.Item.projects : "";
        console.log(currentProjects);
    } catch (error) {
        console.error('Error retrieving current projects:', error);
        return buildResponse(500, {
            Operation: "UPDATE",
            Message: "Error: There was an error retrieving the current projects",
            Details: error.message
        });
    }

    const updatedProjects = currentProjects ? `${currentProjects}, ${projects}` : projects;
    console.log(updatedProjects);

    const params = {
        TableName: dynamodbTableName,
        Key: { email }, // Primary key to identify the item
        UpdateExpression: 'set projects = :updatedProjects',
        ExpressionAttributeValues: {
            ':updatedProjects': updatedProjects
        },
        ReturnValues: 'UPDATED_NEW'
    };

    try {
        await dynamodb.update(params).promise();
        
        const successBody = {
            Operation: "UPDATE",
            Message: "SUCCESS",
            Item: requestBody
        };
        return buildResponse(200, successBody);
        
    } catch (error) {
        const errorBody = {
            Operation: "UPDATE",
            Message: "Error: There was an error with your PUT request, please try again"
        };
       return buildResponse(500, { error: "Internal Server Errorrrrr" });
    }
}



// new getTest for testing

async function getTest(RequestId, password) {
    return buildResponse(500, { error: "Internal Server Errorrrrr" });
    // Query by primary key (partition key)
    const paramsByPK = {
        TableName: dynamodbTableName,
        Key: {
            "email": RequestId
        }
    };

    try {
        const responseByPK = await dynamodb.get(paramsByPK).promise();

        if (!responseByPK.Item) {
            return buildResponse(404, { error: "Email not found, please enter a valid one" });
        }

        // Query by GSI (hashed password)
        const paramsByGSI = {
            TableName: dynamodbTableName,
            IndexName: 'password-index', // Replace with your GSI name
            KeyConditionExpression: 'password = :password',
            ExpressionAttributeValues: {
                ':password': password
            }
        };

        const responseByGSI = await dynamodb.query(paramsByGSI).promise();

        if (responseByGSI.Items.length === 0) {
            return buildResponse(404, { error: "Incorrect password, please enter a valid one" });
        }

        const body = {
            message: "User successfully retrieved",
            email: RequestId,
            name: responseByPK.Item.name,
            projects: responseByPK.Item.projects,
            password: responseByPK.Item.password
        };

        return buildResponse(200, body);
    } catch (error) {
        console.error("Error fetching item from DynamoDB: ", error);
        return buildResponse(500, { error: "Internal Server Errorrrrr" });
    }
}

async function addTest(requestBody) {
    try {
        
        // Commenting out functionality for having separate email pwd table
        // // Add only email to auth table
        // const authParams = {
        // TableName: dynamodbTableName,
        // Item: {
        //     email: requestBody.email
        //     }
        // };
        
        
        // // Add email and pwd to email_passwords table
        // const emailPasswordParams = {
        // TableName: emailPasswordsTable,
        // Item: requestBody
        // };

        // // Put operations for both tables
        // await dynamodb.put(authParams).promise();
        // await dynamodb.put(emailPasswordParams).promise();
        
        
        const authParams = {
        TableName: dynamodbTableName,
        Item: requestBody
        };
        
        await dynamodb.put(authParams).promise();
        
        const successBody = {
            Operation: "SAVE",
            Message: "SUCCESS",
            Item: requestBody
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


async function handleForgotPassword(requestId) {
    const email = requestId;

    // Generate a password reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Store the reset token in the database with an expiration time
    const params = {
        TableName: "forgot_password",
        Key: { email: email },
        UpdateExpression: 'set resetToken = :resetToken, resetTokenExpires = :expires',
        ExpressionAttributeValues: {
            ':resetToken': resetToken,
            ':expires': Date.now() + 3600000 // Token expires in 1 hour
        }
    };
    
    console.log("Success");

    try {
        await dynamodb.update(params).promise();
        console.log("DB updated"); // debugging

        // Send password reset email
        const resetUrl = `http://127.0.0.1:8080/reset-password.html?token=${resetToken}&email=${email}`;
        const emailParams = {
            Source: 'shaurya1096@gmail.com',
            Destination: { ToAddresses: [email] },
            Message: {
                Subject: { Data: 'Password Reset Request' },
                Body: {
                    Text: { Data: `You are receiving this email because you requested a password reset. Please click the following link to reset your password: ${resetUrl}` }
                }
            }
        };
        
        console.log("Sending email with params:", emailParams); // debugging

        await ses.sendEmail(emailParams).promise();
        console.log("Email sent successfully"); // debugging
        
        return buildResponse(200, { message: "Password reset email sent!" });

    } catch (error) {
        console.error("Error handling forgot password:", error);
        return buildResponse(500, { error: "Internal Server Errorr" });
    }
}


async function resetPassword(requestBody) {
    const { email, token, password } = requestBody;
    
    console.log("Function invoked");

    // Verify the token
    const tokenParams = {
        TableName: "forgot_password",
        Key: { email: email }
    };

    try {
        const tokenResponse = await dynamodb.get(tokenParams).promise();

        if (!tokenResponse.Item || tokenResponse.Item.resetToken !== token || tokenResponse.Item.resetTokenExpires < Date.now()) {
            return buildResponse(400, { message: "Invalid or expired token." });
        }

        // Update the password in the auth table
        // const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        const updateParams = {
            TableName: dynamodbTableName,
            Key: { email: email },
            UpdateExpression: 'set password = :password',
            ExpressionAttributeValues: {
                ':password': password
            }
        };

        await dynamodb.update(updateParams).promise();

        // Delete the reset token so it can't be reused
        const deleteTokenParams = {
            TableName: "forgot_password",
            Key: { email: email }
        };
        await dynamodb.delete(deleteTokenParams).promise();

        return buildResponse(200, { message: "Password reset successful." });

    } catch (error) {
        console.error("Error resetting password:", error);
        return buildResponse(500, { error: "Internal Server Error" });
    }
}



















// async function checkEmailExists(email) {
//     const params = {
//         TableName: dynamodbTableName,
//         Key: {
//             "email": email
//         }
//     };

//     try {
//         const response = await dynamodb.get(params).promise();
//         return !!response.Item; // Return true if the email exists, false otherwise
//     } catch (error) {
//         console.error("Error checking email existence:", error);
//         return false;
//     }
// }


// async function addRequestFP(requestBody) {
    
//     // Check if email already exists
//     // const emailExists = await checkEmailExists(requestBody.email);

//     // if (emailExists) {
//     //     const errorBody = {
//     //         Operation: "SAVE",
//     //         Message: "Error: Email already exists. Please use a different email."
//     //     };
//     //     return buildResponse(400, errorBody);
//     // }
    
//     try {

//         for (const row of requestBody) {
//             await storeRowInDynamoDB(row);
//         }
        
//         // await storeRowInDynamoDB(requestBody);

//         const successBody = {
//             Operation: "SAVE",
//             Message: "SUCCESS",
//             Item: requestBody
//         };
//         return buildResponse(200, successBody);
//     } catch (error) {
//         const errorBody = {
//             Operation: "SAVE",
//             Message: "Error: There was an error with your post request, please try again"
//         };
//         return buildResponse(500, errorBody);
//     }
// }






// Hash the password
// const hashedPassword = crypto.createHash('sha256').update(requestBody.password).digest('hex');
// requestBody.password = hashedPassword;

// previous code:
// const AWS = require("aws-sdk");
// AWS.config.update({
//     region: "us-east-2"
// });
// const dynamodb = new AWS.DynamoDB.DocumentClient();
// const dynamodbTableName = "auth";

// // const requestParamPath = "/register/{id}"; // path gets a ticket by ID
// const requestPath = "/register";
// const getAllItems = "/getAllItems"

// exports.handler = async function (event) {
//     console.log("Request event method: ", event.httpMethod);
//     console.log("EVENT\n" + JSON.stringify(event, null, 2));
//     let response;
//     switch (true) {
        
//         //get customer email by id
//         case event.httpMethod === "GET" && event.requestContext.resourcePath === requestPath:
//             response = await getStart(event.queryStringParameters.email);
//             break;
            
//         //post a new request
//         case event.httpMethod === "POST" && event.requestContext.resourcePath === requestPath:
//             response = await addRequest(JSON.parse(event.body)); // change addRequest() to your function
//             break;
            
//         //gets all items
//         case event.httpMethod === "GET" && event.requestContext.resourcePath === getAllItems:
//             response = await getRequests();
//             break;
            
        
//         default:
//             response = buildResponse(404, { message: "Not Found" });
//     }
//     return response;
//     }
    
// function buildResponse(statusCode, body) {
//     return {
//         statusCode: statusCode,
//         headers: {
//             "Content-Type": "application/json",
//             'Access-Control-Allow-Origin': '*'
//         },
//         body: JSON.stringify(body)
//     }
// }


// async function getStart(RequestId) { // gets start date given an ID
//     const params = {
//         TableName: dynamodbTableName,
//         Key: {
//             "email": RequestId
//         }
//     }
//     try {
//         const response = await dynamodb.get(params).promise();

//         if (!response.Item) { 
//             // Item not found in the table, returns error
//             return buildResponse(404, { error: "ID not found, please enter a valid one" });
//         }
//         const body = {
//             message: "Start date successfully retrieved",
//             requestId: RequestId,
//             name: response.Item.name,
//             projects: response.Item.projects,
//             password: response.Item.password
//             // dateStart: response.Item.dateStart,
//         };

//         // Item found, return successful response
//         return buildResponse(200, body);
//     } catch (error) {
//         console.error("Error fetching item from DynamoDB: ", error);
//         // Handle other errors (e.g., DynamoDB service errors)
//         return buildResponse(500, { error: "Internal Server Errorrrrr" });
//     }
// }


// async function getRequests() { // gets all requests in the system
//     const params = {
//         TableName: dynamodbTableName
//     }

//     try {
//         const dynamoData = await dynamodb.scan(params).promise();
//         const filteredRequests = dynamoData.Items.filter(item => item.hasOwnProperty("email"));
//         const body = {
//             requests: filteredRequests
//         }
//         //Item found, return successful response
//         return buildResponse(200, body);
//     } catch (error) {
//         //Build error response
//         console.error('Error scanning DynamoDB records: ', error);
//         return buildResponse(500, { error: "Internal Server Errorrrr" });
//     }
// }

// async function addRequest(requestBody) { // adds a request to the table
//     // Validate required fields

// /*
//     const requiredFields = ["name", "email", "projects"];
//     // const requiredFields = ["id"];
//     const missingFields = requiredFields.filter(field => !(field in requestBody));

//     if (missingFields.length > 0) {
//         const errorMessage = `Missing required fields: ${missingFields.join(", ")}`;
//         return buildResponse(400, { error: errorMessage });
//     }
// */
    
//     try {
//     for (const row of requestBody) {
//             await storeRowInDynamoDB(row);
//         }

//     // If all required fields are present, proceed with DynamoDB put
//     // const params = {
//     //     TableName: dynamodbTableName,
//     //     Item: requestBody
//     // };

    
//         //Successful response
//         // await dynamodb.put(params).promise();
//         const successBody = {
//             Operation: "SAVE",
//             Message: "SUCCESS",
//             Item: requestBody
//         };
//         return buildResponse(200, successBody);
//         //Error handling
//     } catch (error) {
//         const errorBody = {
//             Operation: "SAVE",
//             Message: "Error: There was an error with your post request, please try again"
//         };
//         return buildResponse(500, errorBody);
//     }
// }

// async function storeRowInDynamoDB(row) {
//     const params = {
//         TableName: dynamodbTableName,
//         Item: row
//     };

//     // Put item in DynamoDB
//     await dynamodb.put(params).promise();
    
//     return
// }
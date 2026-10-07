# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0
import os
import json
import logging
import uuid
import boto3
from datetime import datetime, timezone
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')

# Bind to your specific table (ideally passed via environment variables)
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME')
table = dynamodb.Table(TABLE_NAME) if TABLE_NAME else None
table.load()

# Print the key schema array
print("Key Schema:", table.key_schema)
# CRITICAL: Agents require the 'bedrock-agent-runtime' client interface
bedrock_agent_runtime = boto3.client("bedrock-agent-runtime", region_name="us-east-2")

def lambda_handler(event, context):

    body = event.get("body")
    if not body:
        return { "statusCode": 400, "body": json.dumps("Missing request body") }
    
    #logger.info(f"Received API Gateway event: {json.dumps(event)}")

    payload = json.loads(body)
    logger.info(f"Payload: {payload}" )

    #3. Extract your frontend data safely
    inputText = payload.get("inputText","")
    dbContext = payload.get("dbcontext", {})


    required_fields = ["roomAssigned", "taskID", "username"]
    missing_fields = [field for field in required_fields if field not in dbContext]

    if missing_fields:
        return {
            "statusCode": 400,
            "body": json.dumps({
                "error": f"Missing required context fields: {', '.join(missing_fields)}"
            })
        }
    
    username = dbContext.get("username")
    roomAssigned = dbContext.get("roomAssigned")# // Will be undefined if missing
    taskId = dbContext.get("taskID")  
    logger.info(f"DB Context: {dbContext}")

    
    
    # 1. Maintain session context using API Gateway variables, or generate a fresh tracking ID
    safe_username = str(username).replace("@", "-")
    session_id = f"{taskId}_{safe_username}"
    logger.info(f"Session ID set to: {session_id}")
    
    # 2. Check if TaskHistory Currently Exists in DynamoDB
    task_history = ""
    timestamp = datetime.now(timezone.utc).isoformat()

    
    if 'table' in globals() or 'table' in locals():
        try:
            logger.info(f"Checking history for session_id: {session_id}")
            history_response = table.get_item( 
                Key={
                    "session_id": str(session_id), # Matches HASH attribute name exactly
                    "username": str(username)  # Matches RANGE attribute name exactly
                }
            )
            if "Item" in history_response:
                task_history = history_response["Item"].get("historyText", set())
                if inputText in task_history:
                    logger.info("Message already exists in history. Skipping update.")
   
                    pass
                else:
                    table.update_item(
                        Key={
                            "session_id": str(session_id),
                            "username": str(username)
                        },
                        UpdateExpression="ADD historyText :new_msg  SET last_updated = :time",
                        ExpressionAttributeValues={
                            ":new_msg": inputText,
                            ":time": timestamp,
                            
                        }
                    )
                logger.info("Found existing task history.")
            else:
                logger.info("No prior task history found. Creating entry")
                table.put_item(Item={
                    "session_id": str(session_id),
                    "username": str(username),
                    "historyText": [str(inputText)],
                    "agentResponse":[],
                    "roomAssigned": roomAssigned,
                    "last_updated": timestamp,
                    "conversationlog":[str(timestamp)]
                })
        except ClientError as de:
            logger.error(f"DynamoDB lookup failed: {de.response['Error']['Message']}")

    # 3. Extract the text prompt from API Gateway body
    user_prompt = inputText
    try:
        if event.get("body"):
            body = json.loads(event["body"])
            user_prompt = body.get("prompt", user_prompt)
    except Exception as e:
        logger.error(f"Failed to parse body JSON: {str(e)}")
        return build_api_response(400, {"error": "Invalid JSON format inside HTTP body."})

    # 4. Configure Bedrock Agent Target Metadata
    AGENT_ID = os.environ.get("AGENT_ID")
    AGENT_ALIAS_ID = os.environ.get("ALIAS_ID")

    # 5. Conditional execution block
   
    try:
        logger.info(f"Invoking Bedrock Agent {AGENT_ID} with prompt: {user_prompt}")
        
        # Call the Agent Runtime API
        response = bedrock_agent_runtime.invoke_agent(
            agentId=AGENT_ID,
            agentAliasId=AGENT_ALIAS_ID,
            sessionId=session_id,
            inputText=user_prompt
        )
        
        # Stream and assemble the event chunks
        full_agent_response = ""
        completion_stream = response.get("completion")
        
        if completion_stream:
            for event in completion_stream:
                if "chunk" in event:
                    data_bytes = event["chunk"]["bytes"]
                    full_agent_response += data_bytes.decode("utf-8")
        
        logger.info(f"Agent Response: {full_agent_response}")
        log_entry_data = {
                "timestamp": datetime.utcnow().isoformat(),  # Tracks when the interaction happened
                "user_prompt": str(user_prompt),
                "agent_response": str(full_agent_response),
            }
        #dynamoDB add updated response
        table.update_item(
            Key={
                "session_id": str(session_id),
                "username": str(username)
            },
            UpdateExpression="SET agentResponse = list_append(if_not_exists(agentResponse, :empty_list), :new_msg)",
            ExpressionAttributeValues={
                ":new_msg": [log_entry_data],  # Square brackets create a Python List
                ":empty_list": []                        # Creates a baseline empty list if needed
            })
        return build_api_response(200, {
            "agentId": AGENT_ID,
            "sessionId": session_id,
            "response": full_agent_response
        })
        
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        error_msg = e.response["Error"]["Message"]
        logger.error(f"Bedrock Agent Error [{error_code}]: {error_msg}")
        
        if error_code == "AccessDeniedException":
            return build_api_response(403, {"error": "Lambda IAM role lacks 'bedrock:InvokeAgent' permissions."})
        return build_api_response(500, {"error": f"Agent communication failed: {error_msg}"})
        
    except Exception as e:
        logger.error(f"Unexpected processing fault: {str(e)}")
        return build_api_response(500, {"error": "An internal processing error occurred."})
        
    # Default fallback response if x evaluates to False
    return build_api_response(200, {"message": "Execution skipped because configuration flag is disabled."})

def build_api_response(status_code, body_dict):
    """Formats payload to adhere to API Gateway Lambda Proxy criteria."""
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(body_dict)
    }

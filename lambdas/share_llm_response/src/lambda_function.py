import json
import os
import logging
import uuid
import boto3
from datetime import datetime, timezone
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')

TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME')
table = dynamodb.Table(TABLE_NAME) if TABLE_NAME else None


try:
    if table:
        table.load()  # DescribeTable network call
        print("Key Schema:", table.key_schema)
    else:
        logger.error("Environment variable DYNAMODB_TABLE_NAME is missing.")
except Exception as e:
    # Catching initialization errors so the entire container doesn't hard-crash
    logger.error(f"Failed to load table during initialization: {str(e)}")





def lambda_handler(event, context):
    logger.warning(f"Received event: {json.dumps(event)}")

    payload = json.dumps(event)

    required_fields = ["project_id", "task_id", "user"]
    missing_fields = [field for field in required_fields if field not in event]

    if missing_fields:
        return {
            "statusCode": 400,
            "body": json.dumps({
                "error": f"Missing required context fields: {', '.join(missing_fields)}"
            })
        }

    username = event['user']
    taskId = event['task_id']
    project_id = event['project_id']
    input_text=event['message']


    safe_username = str(username).replace("@", "-")
    session_id = f"{taskId}_{safe_username}"
    logger.info(f"Session ID set to: {session_id}")

    timestamp = datetime.now(timezone.utc).isoformat()

    msg_with_timestamp = f"[{timestamp}]- {input_text}"
    
    


    
    try:
        logger.info(f"Checking history for session_id: {session_id}")
        history_response = table.get_item( 
            Key={
                "session_id": str(session_id), # Matches HASH attribute name exactly
                "username": str(username)  # Matches RANGE attribute name exactly
            }
        )
        if "Item" in history_response:
            logger.info("Found existing task history.")
            table.update_item(
                Key={
                    "session_id": str(session_id),
                    "username": str(username)
                },
                UpdateExpression="SET shareLog = list_append(if_not_exists(shareLog, :empty_list), :new_msg), last_updated = :time",
                ExpressionAttributeValues={
                    ":new_msg": [msg_with_timestamp],   # Must be a Python list
                    ":empty_list": [],          # Fallback value if column is missing
           
                    ":time": timestamp,
                    
                }
            )
       
        else:
            logger.info("No prior task history found. Creating entry")
            table.put_item(Item={
                "session_id": str(session_id),
                "username": str(username),
                "historyText": [],
                "shareLog":[],
                "agentResponse":[],
                "roomAssigned": project_id,
                "last_updated": timestamp,
                "conversationlog":[str(timestamp)]
            })
    except ClientError as de:
        logger.error(f"DynamoDB lookup failed: {de.response['Error']['Message']}")
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": "Failed to update history due to a database error."
            })
        }
    logger.info("Successfully logged new event")
    return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Successfully processed event.",
                "session_id": session_id
    })
}

    
    


   


    

    
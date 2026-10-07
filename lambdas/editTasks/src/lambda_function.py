import json
import time
import uuid
import boto3
from decimal import Decimal
from botocore.exceptions import ClientError

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("tasks")

def decimal_serializer(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError

def response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS,PATCH"
        },
        "body": json.dumps(body, default=decimal_serializer)
    }

def lambda_handler(event, context):
    method = event.get("httpMethod")

    if method == "OPTIONS":
        return response(200, {})

    elif method == "POST":
        params = event.get("queryStringParameters") or {}
        if params.get("batchRequest") == "true":
            return batch_get_tasks(event)
        return create_task(event)
    
    elif method == "PATCH":
        return update_task(event)

    elif method == "GET":
        return get_task(event)

    else:
        return response(405, {"error": "Method not allowed"})


def create_task(event):
    try:
        body = json.loads(event.get("body", "{}"))

        task_id = str(uuid.uuid4())
        room_id = body["room_assigned"]

        task_item = {
            "task_id": task_id,
            "time_created": int(time.time()),
            "room_assigned": room_id,
            "users_assigned": body["users_assigned"],
            "emoji": body["emoji"],
            "task_content": body["task_content"]
        }

        table.put_item(Item=task_item)

        rooms_table = dynamodb.Table("Rooms")

        rooms_table.update_item(
            Key={"room_id": room_id},
            UpdateExpression="""
                SET tasks = list_append(
                    if_not_exists(tasks, :empty_list),
                    :task_id
                )
            """,
            ExpressionAttributeValues={
                ":task_id": [task_id],
                ":empty_list": []
            }
        )

        return response(201, task_item)

    except KeyError as e:
        return response(400, {"error": f"Missing field: {str(e)}"})

    except ClientError as e:
        return response(500, {"error": e.response["Error"]["Message"]})


def update_task(event):
    try:
        body = json.loads(event.get("body", "{}"))

        task_id = body.get("task_id")
        if not task_id:
            return response(400, {"error": "task_id is required"})

        # All other fields will be updated
        fields = {k: v for k, v in body.items() if k != "task_id"}

        if not fields:
            return response(400, {"error": "No fields to update"})

        update_expr_parts = []
        expr_attr_names = {}
        expr_attr_values = {}

        for i, (key, value) in enumerate(fields.items()):
            name_key = f"#k{i}"
            value_key = f":v{i}"

            update_expr_parts.append(f"{name_key} = {value_key}")
            expr_attr_names[name_key] = key
            expr_attr_values[value_key] = value

        result = table.update_item(
            Key={"task_id": task_id},
            UpdateExpression="SET " + ", ".join(update_expr_parts),
            ExpressionAttributeNames=expr_attr_names,
            ExpressionAttributeValues=expr_attr_values,
            ConditionExpression="attribute_exists(task_id)",
            ReturnValues="UPDATED_NEW"
        )

        return response(200, {
            "message": "Task updated successfully",
            "updated_fields": result.get("Attributes", {})
        })

    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return response(404, {"error": "Task not found"})
        return response(500, {"error": e.response["Error"]["Message"]})

    except Exception as e:
        return response(500, {"error": str(e)})

def get_task(event):
    params = event.get("queryStringParameters") or {}
    task_id = params.get("task_id")

    if not task_id:
        return response(400, {"error": "task_id query parameter required"})

    try:
        result = table.get_item(Key={"task_id": task_id})
        item = result.get("Item")

        if not item:
            return response(404, {"error": "Task not found"})

        return response(200, item)

    except ClientError as e:
        return response(500, {"error": e.response["Error"]["Message"]})

def batch_get_tasks(event):
    try:
        body = json.loads(event.get("body", "{}"))
        ids_string = body.get("ids")

        if not ids_string:
            return response(400, {"error": "ids field required"})

        ids = [i.strip() for i in ids_string.split(",") if i.strip()]
        tasks = []

        for task_id in ids:
            result = table.get_item(Key={"task_id": task_id})
            item = result.get("Item")
            if item:
                tasks.append(item)

        return response(200, {
            "count": len(tasks),
            "tasks": tasks
        })

    except ClientError as e:
        return response(500, {"error": e.response["Error"]["Message"]})
import json
import decimal
import boto3


# Initialize Powertools Logger instance
#logger = Logger()

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            if o % 1 == 0:
                return int(o)
            else:
                return float(o)
        return super(DecimalEncoder, self).default(o)


dynamodb = boto3.resource('dynamodb')
breakout_table = dynamodb.Table('breakout')
room_table = dynamodb.Table('Rooms')

def handle_get(event):
    query = event.get("queryStringParameters") 

    if not query or 'room' not in query:
        return {
          'statusCode': 400,
          'body': json.dumps({'error': 'Missing user or room in request body'})
        }
    
    try:
        if 'user' in query:
            uid = query.get("room") + ":" + query.get("user")
            response = breakout_table.get_item(Key={'id': uid})
            item = response.get('Item')
            print(item)
            if item:
                return {
                    'statusCode': 200,
                    'body': json.dumps(item, cls=DecimalEncoder)
                }
            else:
                return {
                    'statusCode': 404,
                    'body': json.dumps({'message': 'Item not found'})
                }
            
        elif 'batch' in query:
            raw_users = query.get("batch").split(",")
            room = query.get("room")
            unique_users = {user.strip() for user in raw_users if user.strip()}

            keys = [{'id': f"{room}:{user}"} for user in unique_users]
            items = []

            # Batch fetch only if keys are present
            if keys:
                response = breakout_table.meta.client.batch_get_item(
                    RequestItems={
                        breakout_table.name: {
                            'Keys': keys
                        }
                    }
                )
                items = response['Responses'].get(breakout_table.name, [])

            # Fetch base room configuration safely
            base_room = room_table.get_item(Key={"room_id": room}).get('Item', {})
            shared_vc = bool(base_room.get("shared_vc", False))

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'assignments': items,
                    'shared_vc': shared_vc,
                }, cls=DecimalEncoder)
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }


def handle_post(body):
    if not body or not isinstance(body, dict):
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Invalid request body'})
        }

    room = body.get("room")
    if not room:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Missing room'})
        }

    try:
        roomnum = int(body.get("roomnum"))
    except (TypeError, ValueError):
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Invalid roomnum'})
        }

    if roomnum < 0 or roomnum > 9:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'enter valid breakout room index'})
        }

    roomdict = room_table.get_item(Key={"room_id": room}).get('Item')
    if not roomdict:
        return {
            'statusCode': 404,
            'body': json.dumps({'error': 'Room not found'})
        }

    lower_bound = int(roomdict.get("breakouts", 0))
    view_only = bool(body.get("view_only", False))
    shared_vc = bool(body.get("shared_vc", False))

    if not body.get("user") and roomnum >= 1:
        room_table.update_item(
            Key={"room_id": room},
            UpdateExpression="SET #svc = :svc",
            ExpressionAttributeNames={"#svc": "shared_vc"},
            ExpressionAttributeValues={":svc": shared_vc}
        )

    if roomnum > lower_bound:
        for breakout_id in range(lower_bound + 1, roomnum + 1):
            try:
                room_table.put_item(Item={
                    "room_id": f"{room}:{breakout_id}",
                    "mode": "self",
                    "name": f"{roomdict['name']}_{breakout_id}",
                    "view_only": view_only,
                    "shared_vc": shared_vc,
                })
            except Exception as e:
                return {
                    'statusCode': 500,
                    'body': json.dumps({'error': str(e)})
                }

        room_table.update_item(
            Key={"room_id": room},
            UpdateExpression="SET #field = :val",
            ExpressionAttributeNames={"#field": "breakouts"},
            ExpressionAttributeValues={":val": roomnum}
        )
    else:
        room_table.update_item(
            Key={"room_id": f"{room}:{roomnum}"},
            UpdateExpression="SET #vo = :vo, #svc = :svc",
            ExpressionAttributeNames={
                "#vo": "view_only",
                "#svc": "shared_vc",
            },
            ExpressionAttributeValues={
                ":vo": view_only,
                ":svc": shared_vc,
            }
        )

    if body.get("user"):
        breakout_table.update_item(
            Key={"id": f"{room}:{body['user']}"},
            UpdateExpression="SET #attr = :val",
            ExpressionAttributeNames={"#attr": "redirect"},
            ExpressionAttributeValues={":val": roomnum}
        )

    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Item added', 'item': body})
    }

def handle_options():
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
        'body': ''
    }

def with_cors(response):
    if 'headers' not in response:
        response['headers'] = {}
    response['headers']['Access-Control-Allow-Origin'] = '*'
    response['headers']['Access-Control-Allow-Headers'] = 'Content-Type'
    response['headers']['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
    return response


def handler(event, context):
    # Fixed broken syntax and passed parameters cleanly
    #logger.info({"message": "Incoming event tracking", "event": event})
    method = event.get('httpMethod', '')
    
    if method == 'OPTIONS':
        return handle_options()

    try:
        body = json.loads(event.get('body') or '{}')
    except json.JSONDecodeError:
        return with_cors({
            'statusCode': 400,
            'body': json.dumps({'error': 'Malformed JSON'})
        })

    if method == 'GET':
        return with_cors(handle_get(event))
    elif method == 'POST':
        return with_cors(handle_post(body))
    else:
        return with_cors({
            'statusCode': 405,
            'body': json.dumps({'error': f'Method {method} not allowed'})
        })

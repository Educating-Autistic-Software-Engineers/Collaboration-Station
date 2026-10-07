import json
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('dashboardActivity')

def lambda_handler(event, context):
    # TODO implement
    
    id = event['queryStringParameters']['id']
    date = event['queryStringParameters']['date']
    time = event['queryStringParameters']['time']
    user = event['queryStringParameters']['user']
    repo = event['queryStringParameters']['repo']
    div = event['queryStringParameters']['div']
    action = event['queryStringParameters']['action']
    serial = event['queryStringParameters']['serial']
    
    
    response = table.put_item(
        Item = {
            'id': id,
            'date': date,
            'time': time,
            'user': user,
            'repo': repo,
            'div': div,
            'action': action,
            'serial': serial,
        }
        )
    
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'body': json.dumps(div)
    }

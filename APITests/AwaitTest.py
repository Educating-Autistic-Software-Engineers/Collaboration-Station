import json
import requests

# 1. Define the API Gateway endpoint URL
    

url = "https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/task-chat"

# 2. Define the payload matching the Bedrock Agent event structure
payload = {
    "messageVersion": "1.0",
    "agent": {
        "name": "AI_Assistant_Agent",
        "id": "AGT1234567",
        "alias": "TSTALIASID",
        "version": "DRAFT",
    },
   
    "apiPath": "/v1/task-chat",
    "httpMethod": "POST",
    "inputText": "What Are the design pieces needed to Make a Character Move in Scratch.io",
    "sessionAttributes": {},
    "promptSessionAttributes": {},
}

# 3. Define the headers to match your original configuration
headers = {"Content-Type": "text/plain"}

# 4. Serialize the payload to a JSON string and send the POST request
response = requests.post(url, data=json.dumps(payload), headers=headers)

# Replace your final step with this:
print(f"Status Code: {response.status_code}")
print("Response Text:")
print(response.text)
import requests
import os

url = "http://localhost:8001/api/ai/summarize"
files = {'file': ('test.txt', 'This is a test study note content.')}
data = {'user_id': 'test_user', 'subject': 'Testing'}

try:
    print("Triggering test upload...")
    response = requests.post(url, files=files, data=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")

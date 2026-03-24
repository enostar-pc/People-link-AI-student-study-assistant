import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def test():
    print("Testing Submit Request...")
    res = requests.post(f"{BASE_URL}/api/mentorship/request/", json={
        "student_id": "student_123",
        "student_name": "Test Student",
        "mentor_id": "mentor_456",
        "topic": "Python Generators",
        "department": "Computer Science"
    })
    print("Submit status:", res.status_code)
    print("Submit response:", res.text)
    
    print("\nTesting Mentor Progress...")
    res = requests.get(f"{BASE_URL}/api/notes/mentor_progress/mentor_456")
    print("Progress status:", res.status_code)
    print("Progress data:", res.text)
    
    if res.status_code == 200 and "Python Generators" in res.text or "Computer Science" in res.text:
         print("SUCCESS")
    else:
         print("FAILURE")

if __name__ == "__main__":
    test()

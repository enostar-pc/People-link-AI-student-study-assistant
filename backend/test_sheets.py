import gspread
from google.oauth2.service_account import Credentials
import os

try:
    sheet_id = "1tAgy_9Xll6tZv6iY6pRA_h3YIs9aQpIQZa1Nvl7jM30"
    scope = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
    key_path = os.path.join(os.path.dirname(__file__), "google_sheets_key.json")
    
    print(f"Checking for key at: {key_path}")
    if os.path.exists(key_path):
        creds = Credentials.from_service_account_file(key_path, scopes=scope)
        gc = gspread.authorize(creds)
        sh = gc.open_by_key(sheet_id)
        worksheet = sh.get_worksheet(0)
        print("Successfully connected to Google Sheet.")
        print(f"Sheet Title: {sh.title}")
    else:
        print("Key file NOT found!")
except Exception as e:
    print(f"Error: {e}")

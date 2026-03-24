# Educator backend views
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import os
import pypdf
import datetime
import re
import traceback
import logging
import time
from groq import Groq
from dotenv import load_dotenv
from google import genai
from .mongo import db
import csv
import io
import gspread
from google.oauth2.service_account import Credentials
from django.core.mail import EmailMessage
from django.contrib.auth.hashers import make_password

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(filename='backend_errors.log', level=logging.ERROR)

def call_gemini_with_fallback(client, contents, config=None, is_prompt=False):
    """
    Attempts to generate content using Gemini, with an immediate fallback to Groq
    if Gemini's quota is exhausted (429) or other errors occur.
    """
    models = ["gemini-2.0-flash", "gemini-1.5-flash"]
    last_error = None

    for model_name in models:
        try:
            print(f">>> TRYING {model_name}...")
            response = client.models.generate_content(
                model=model_name,
                contents=contents,
                config=config
            )
            return response.text
        except Exception as e:
            last_error = e
            error_msg = str(e)
            print(f">>> {model_name} FAILED: {error_msg}")
            logging.error(f">>> {model_name} FAILED: {error_msg}")
            
            # If it's a 429 (Resource Exhausted), don't bother trying other Gemini models
            # usually the quota is per-project or per-account.
            if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                print(">>> 429 Detected. Skipping further Gemini attempts to save time.")
                break
            
            # For other errors (like 404), maybe another model works, but usually not.
            # We'll try at most 2 models
            continue
    
    # --- FALLBACK: GROQ (LLAMA-3) ---
    groq_key = os.getenv('GROQ_API_KEY')
    if groq_key:
        try:
            print(">>> CALLING GROQ (LLAMA-3.3-70B)...")
            groq_client = Groq(api_key=groq_key)
            
            # Format messages for Groq (OpenAI-like format)
            messages = []
            if config and config.get("system_instruction"):
                messages.append({"role": "system", "content": config["system_instruction"]})
            
            if is_prompt:
                messages.append({"role": "user", "content": str(contents)})
            else:
                # contents is a list of Gemini content parts
                for part in contents:
                    role = "assistant" if part.get("role") == "model" else "user"
                    text = part.get("parts", [{}])[0].get("text", "")
                    messages.append({"role": role, "content": text})

            chat_completion = groq_client.chat.completions.create(
                messages=messages,
                model="llama-3.3-70b-versatile",
                max_tokens=2048
            )
            return chat_completion.choices[0].message.content
        except Exception as ge:
            print(f">>> GROQ FAILED: {ge}")
            logging.error(f">>> GROQ FAILED: {ge}")
            last_error = ge

    if last_error:
        raise last_error
    raise Exception("AI service unavailable (All models failed)")

def extract_text_from_file(file):
    filename = file.name
    content = ""
    try:
        if filename.lower().endswith('.pdf'):
            reader = pypdf.PdfReader(file)
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    content += text + "\n"
        elif filename.lower().endswith('.txt'):
            content = file.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error extracting text: {e}")
    return content.strip()

def status(request):
    return JsonResponse({"status": "Backend is running", "database": "Connected to MongoDB"})

@csrf_exempt
def register_user(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            email = data.get('email')
            uid = data.get('user_id')
            
            if not username or not email:
                return JsonResponse({"error": "Missing fields"}, status=400)
            
            if db is None:
                return JsonResponse({"error": "Database connection unavailable"}, status=503)
            
            # Save to MongoDB
            users_col = db['users']
            
            # Build the update document
            update_fields = {
                "username": username,
                "email": email,
                "uid": uid,
                "created_at": datetime.datetime.now().isoformat()
            }
            
            # Only update role and specialization if provided in the data
            if 'role' in data:
                update_fields["role"] = data['role']
            if 'specialization' in data:
                update_fields["specialization"] = data['specialization']
            
            # For new users, we need defaults if not provided
            # MongoDB's update_one with upsert can use $setOnInsert for things that should only be set when creating
            set_on_insert = {}
            if 'role' not in data:
                set_on_insert["role"] = "student"
            if 'specialization' not in data:
                set_on_insert["specialization"] = ""

            users_col.update_one(
                {"email": email},
                {
                    "$set": update_fields,
                    "$setOnInsert": set_on_insert
                },
                upsert=True
            )
            
            log_activity(uid, "Account Registration", f"User {username} registered.")
            return JsonResponse({"message": "User mapping saved"})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Method not allowed"}, status=405)

def log_activity(user_id, action, details=""):
    """
    Saves a log entry for user activity.
    Ensures logs are associated with the user's username for easy tracking.
    """
    if db is None: return
    try:
        user = db['users'].find_one({"uid": user_id})
        if not user:
            user = db['users'].find_one({"email": user_id}) # Fallback for some old UIDs
            
        username = user.get('username', 'anonymous') if user else 'anonymous'
        
        log_entry = {
            "user_id": user_id,
            "username": username,
            "action": action,
            "details": details,
            "timestamp": datetime.datetime.now().isoformat()
        }
        
        # Save to a central logs collection
        db['activity_logs'].insert_one(log_entry)
        
        # Also save to a user-specific 'collection' for separation as requested
        # Note: In MongoDB, small collections are fine, but many can hit limits.
        # We'll stick to tagging them clearly in the central log and the main user doc.
    except Exception as e:
        print(f"Logging Error: {e}")

@csrf_exempt
def update_username(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            new_username = data.get('new_username')
            email = data.get('email')
            
            if not new_username or not email:
                return JsonResponse({"error": "Missing fields"}, status=400)
                
            if db is None:
                return JsonResponse({"error": "Database connection unavailable"}, status=503)
                
            users_col = db['users']
            
            # Check if new username is already taken by someone else
            existing = users_col.find_one({"username": new_username})
            if existing and existing['email'] != email:
                return JsonResponse({"error": "Username already taken"}, status=400)
                
            # Update the mapping
            result = users_col.update_one(
                {"email": email},
                {"$set": {"username": new_username}},
                upsert=True
            )
            
            return JsonResponse({"message": "Username updated successfully"})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Method not allowed"}, status=405)

def get_email_by_username(request):
    username = request.GET.get('username')
    if not username:
        return JsonResponse({"error": "Missing username"}, status=400)
        
    if db is None:
        return JsonResponse({"error": "Database connection unavailable"}, status=503)
        
    users_col = db['users']
    # Case-insensitive search for username
    user = users_col.find_one({"username": {"$regex": f"^{re.escape(username)}$", "$options": "i"}})
    if user:
        return JsonResponse({"email": user['email']})
    return JsonResponse({"error": "User not found"}, status=404)

def get_user_role(request, user_id):
    if db is None:
        return JsonResponse({"error": "Database connection unavailable"}, status=503)
    try:
        user_doc = db['users'].find_one({"uid": user_id})
        if user_doc:
            return JsonResponse({
                "role": user_doc.get('role', 'student'),
                "specialization": user_doc.get('specialization', '')
            })
        return JsonResponse({"role": "student", "specialization": ""})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def update_specialization(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            specialization = data.get('specialization', '')
            
            if not email:
                return JsonResponse({"error": "Missing email"}, status=400)
                
            if db is None:
                return JsonResponse({"error": "Database connection unavailable"}, status=503)
                
            db['users'].update_one(
                {"email": email},
                {"$set": {"specialization": specialization}},
                upsert=True
            )
            return JsonResponse({"message": "Specialization updated successfully"})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def update_password(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            new_password = data.get('password')
            
            if not email or not new_password:
                return JsonResponse({"error": "Missing fields"}, status=400)
                
            if db is None:
                return JsonResponse({"error": "Database connection unavailable"}, status=503)
            
            hashed_pwd = make_password(new_password)
            
            db['users'].update_one(
                {"email": email},
                {"$set": {"password_hashed": hashed_pwd}},
                upsert=True
            )
            return JsonResponse({"message": "Password updated in backend successfully"})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def study_rooms(request):
    if request.method == 'GET':
        try:
            if db is None:
                return JsonResponse({"error": "Database connection unavailable"}, status=503)
            
            rooms_col = db['study_rooms']
            # Fetch all active rooms (optional: filter by timestamp if you want auto-expiry)
            rooms = list(rooms_col.find().sort("created_at", -1))
            
            # Convert ObjectId to string
            for r in rooms:
                r['_id'] = str(r['_id'])
                
            return JsonResponse({"rooms": rooms})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
            
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            mentor_id = data.get('mentor_id')
            mentor_name = data.get('mentor_name')
            room_name = data.get('name')
            topic = data.get('topic')
            meet_link = data.get('meet_link')
            
            if not all([mentor_id, mentor_name, room_name, topic, meet_link]):
                return JsonResponse({"error": "Missing required fields"}, status=400)
                
            if db is None:
                return JsonResponse({"error": "Database connection unavailable"}, status=503)
                
            rooms_col = db['study_rooms']
            
            new_room = {
                "mentor_id": mentor_id,
                "mentor_name": mentor_name,
                "name": room_name,
                "topic": topic,
                "meet_link": meet_link,
                "created_at": datetime.datetime.now().isoformat()
            }
            
            result = rooms_col.insert_one(new_room)
            new_room['_id'] = str(result.inserted_id)
            
            return JsonResponse({"message": "Room created successfully", "room": new_room})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def delete_study_room(request, room_id):
    if request.method == 'DELETE' or (request.method == 'POST' and request.POST.get('_method') == 'DELETE'):
        try:
            if db is None:
                return JsonResponse({"error": "Database connection unavailable"}, status=503)
                
            rooms_col = db['study_rooms']
            from bson import ObjectId
            rooms_col.delete_one({"_id": ObjectId(room_id)})
            return JsonResponse({"message": "Room deleted successfully"})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def ask_question(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id', 'anonymous')
            question = data.get('question')
            history = data.get('history', [])
            
            gemini_key = os.getenv('GEMINI_API_KEY')
            if not gemini_key or gemini_key == 'your_gemini_api_key_here':
                return JsonResponse({"answer": "Gemini AI is not configured. Please add GEMINI_API_KEY to .env"}, status=200)

            client = genai.Client(api_key=gemini_key)
            
            # Format history for the SDK
            contents = []
            for h in history:
                contents.append({"role": "user", "parts": [{"text": h['question']}]})
                contents.append({"role": "model", "parts": [{"text": h['answer']}]})
            
            # Add current question
            contents.append({"role": "user", "parts": [{"text": question}]})

            # Use fallback system (Ask for answer + 3 youtube search topics)
            ai_res = call_gemini_with_fallback(
                client, 
                contents, 
                config={
                    "system_instruction": "You are a helpful AI study assistant. Answer the student's question clearly. After your answer, if relevant, provide 3 highly relevant YouTube videos for visual understanding. Format each suggestion as 'Title | VideoID' (e.g., 'Introduction to Algorithms | dPw2g8_17eA'). Format the final suggestions as: VIDEO_SUGGESTIONS: [Title 1 | ID 1, Title 2 | ID 2, Title 3 | ID 3]"
                }
            )
            
            # Split answer and video suggestions
            answer = ai_res
            video_suggestions = []
            if "VIDEO_SUGGESTIONS:" in ai_res:
                parts = ai_res.split("VIDEO_SUGGESTIONS:")
                answer = parts[0].strip()
                # Robust regex to find: Title | VideoID
                # Supports variations in spacing and list formats
                matches = re.findall(r"([^\|\n]+)\|\s*([a-zA-Z0-9_-]{11})", parts[1])
                for m_title, m_id in matches:
                    video_suggestions.append(f"{m_title.strip()} | {m_id.strip()}")
            
            # Fallback if no specific IDs found but list exists
            if not video_suggestions and "VIDEO_SUGGESTIONS:" in ai_res:
                try:
                    suggestions_raw = ai_res.split("VIDEO_SUGGESTIONS:")[1].strip().strip('[]')
                    video_suggestions = [s.strip() for s in suggestions_raw.split(',') if s.strip()]
                except:
                    video_suggestions = []
            
            # Save to MongoDB
            if db is not None:
                db['chats'].insert_one({
                    "user_id": user_id,
                    "question": question,
                    "answer": answer,
                    "timestamp": datetime.datetime.now().isoformat()
                })
                log_activity(user_id, "AI Chat", f"Asked: {question[:50]}...")
            
            return JsonResponse({
                "answer": answer,
                "video_suggestions": video_suggestions
            })
            
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                return JsonResponse({"answer": "Gemini API Quota Exceeded for this model. Switching to a backup model, please try your message again in a moment."}, status=200)
            return JsonResponse({"answer": f"Gemini Error: {error_msg}"}, status=200)
            
    return JsonResponse({"error": "Method not allowed"}, status=405)

def get_chat_history(request, user_id):
    if db is None:
        return JsonResponse({"error": "Database connection unavailable"}, status=503)
        
    chats = list(db['chats'].find({"user_id": user_id}, {"_id": 0}).sort("timestamp", 1))
    return JsonResponse({"history": chats})

# Missing endpoints expected by frontend
@csrf_exempt
def summarize_file(request):
    if request.method == 'POST':
        try:
            file = request.FILES.get('file')
            user_id = request.POST.get('user_id', 'anonymous')
            subject = request.POST.get('subject', 'General')
            
            if not file:
                return JsonResponse({"error": "No file uploaded"}, status=400)
                
            filename = file.name
            raw_text = extract_text_from_file(file)
            
            if not raw_text:
                return JsonResponse({"error": "Could not extract text from file"}, status=400)

            # Use Gemini to summarize
            gemini_key = os.getenv('GEMINI_API_KEY')
            if not gemini_key:
                return JsonResponse({"error": "GEMINI_API_KEY not found in environment"}, status=500)
            print(">>> INITIALIZING GEMINI CLIENT")
            client = genai.Client(api_key=gemini_key)
            
            print(">>> REQUESTING SUMMARY")
            # Use Gemini to summarize + provide video suggestions
            summary_prompt = f"Please provide a concise and structured summary for the following engineering study notes:\n\n{raw_text[:8000]}\n\nAfter the summary, suggest 3 highly relevant YouTube videos that would help understand these concepts visually. Format each suggestion as 'Title | VideoID' (e.g., 'Data Structures Overview | 8hly31CYzvc'). Format the final list as: VIDEO_SUGGESTIONS: [Title 1 | ID 1, Title 2 | ID 2, Title 3 | ID 3]"
            
            ai_res = call_gemini_with_fallback(
                client,
                summary_prompt,
                config={
                    "system_instruction": "You are a helpful AI study assistant. Summarize clearly. Provide 3 specific YouTube video suggestions (Title | VideoID) at the end as requested."
                },
                is_prompt=True
            )
            
            summary = ai_res
            video_suggestions = []
            if "VIDEO_SUGGESTIONS:" in ai_res:
                parts = ai_res.split("VIDEO_SUGGESTIONS:")
                summary = parts[0].strip()
                # Robust regex to find: Title | VideoID
                matches = re.findall(r"([^\|\n]+)\|\s*([a-zA-Z0-9_-]{11})", parts[1])
                for m_title, m_id in matches:
                    video_suggestions.append(f"{m_title.strip()} | {m_id.strip()}")
            
            # Fallback if no specific IDs found but list exists
            if not video_suggestions and "VIDEO_SUGGESTIONS:" in ai_res:
                try:
                    suggestions_raw = ai_res.split("VIDEO_SUGGESTIONS:")[1].strip().strip('[]')
                    video_suggestions = [s.strip() for s in suggestions_raw.split(',') if s.strip()]
                except:
                    video_suggestions = []
            print(">>> SUMMARY GENERATED")          
            if db is not None:
                db['summaries'].insert_one({
                    "user_id": user_id,
                    "filename": filename,
                    "subject": subject,
                    "summary": summary,
                    "raw_text": raw_text,
                    "timestamp": datetime.datetime.now().isoformat()
                })
                log_activity(user_id, "File Upload", f"Uploaded and summarized: {filename}")
                
            return JsonResponse({
                "summary": summary,
                "raw_text": raw_text,
                "filename": filename,
                "subject": subject,
                "video_suggestions": video_suggestions
            })
        except Exception as e:
            traceback.print_exc()
            logging.error("Summarize Error: %s", traceback.format_exc())
            return JsonResponse({"error": f"Summarize failed: {str(e)}"}, status=500)
    return JsonResponse({"error": "Method not allowed"}, status=405)

def get_user_summaries(request, user_id):
    if db is None:
        return JsonResponse({"error": "Database connection unavailable"}, status=503)
        
    summaries = list(db['summaries'].find({"user_id": user_id}, {"_id": 0}))
    return JsonResponse({"summaries": summaries})

@csrf_exempt
def generate_quiz(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            text = data.get('text')
            subject = data.get('subject')
            num_q = data.get('num_questions', 5)
            
            if not text:
                return JsonResponse({"error": "No text provided for quiz generation"}, status=400)

            gemini_key = os.getenv('GEMINI_API_KEY')
            client = genai.Client(api_key=gemini_key)
            
            prompt = f"""
            Generate {num_q} unique and high-quality multiple choice questions (MCQs) for the subject '{subject}' based on the following study material:
            
            {text[:8000]}
            
            Important: Ensure the questions are diverse and cover different parts of the text. Avoid generic or overly simple questions.
            
            For each question:
            1. Provide 4 options, each starting with 'A)', 'B)', 'C)', or 'D)'.
            2. Mark the correct answer (just the letter, e.g., 'A').
            
            Return ONLY a JSON list of objects. Each object should have:
            - 'question': the question text
            - 'options': a list of 4 options
            - 'answer': the correct option letter ('A', 'B', 'C', or 'D')
            """

            questions_text = call_gemini_with_fallback(
                client,
                prompt,
                config={
                    "response_mime_type": "application/json"
                },
                is_prompt=True
            )
            
            # The SDK with response_mime_type should return valid JSON
            try:
                questions = json.loads(questions_text)
                if isinstance(questions, dict) and 'questions' in questions:
                    questions = questions['questions']
            except:
                # Fallback if AI gets creative
                match = re.search(r'\[.*\]', questions_text, re.DOTALL)
                if match:
                    questions = json.loads(match.group())
                else:
                    raise Exception("Failed to parse quiz JSON from AI")

            return JsonResponse({
                "quiz_id": f"quiz_{os.urandom(4).hex()}",
                "questions": questions
            })
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def track_login(request, user_id):
    if db is None:
        return JsonResponse({"error": "Database connection unavailable"}, status=503)
    try:
        today = datetime.datetime.now().date().isoformat()
        
        # Upsert: Add entry for today if not already present
        # Storing unique dates to simplify frontend calendar
        db['logins'].update_one(
            {"user_id": user_id, "date": today},
            {"$set": {"last_login": datetime.datetime.now().isoformat()}},
            upsert=True
        )
        log_activity(user_id, "Login", f"Logged in on {today}")
        return JsonResponse({"status": "Login tracked", "date": today})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def get_progress(request, user_id):
    if db is None:
        return JsonResponse({"error": "Database connection unavailable"}, status=503)
        
    try:
        # 1. Total notes uploaded
        total_notes = db['summaries'].count_documents({"user_id": user_id})
        
        # 2. Total quizzes taken
        scores_col = db['scores']
        user_scores = list(scores_col.find({"user_id": user_id}))
        total_quizzes = len(user_scores)
        
        # 3. Average score calculation (Safe)
        avg_score = 0
        valid_scores_sum = 0
        valid_count = 0
        
        for s in user_scores:
            score = s.get('score', 0)
            total = s.get('total', 1)
            if total > 0:
                valid_scores_sum += (score / total) * 100
                valid_count += 1
        
        if valid_count > 0:
            avg_score = round(valid_scores_sum / valid_count)
            
        # 4. Unique subjects from summaries and scores (with frequency)
        summary_recs = list(db['summaries'].find({"user_id": user_id}, {"subject": 1, "filename": 1}))
        score_recs = list(db['scores'].find({"user_id": user_id}, {"subject": 1}))
        
        subject_counts = {}
        for r in summary_recs:
            sub = r.get('subject') or str(r.get('filename', 'Unknown')).split('.')[0]
            if sub: subject_counts[sub] = subject_counts.get(sub, 0) + 1
        for r in score_recs:
            sub = r.get('subject')
            if sub: subject_counts[sub] = subject_counts.get(sub, 0) + 1
            
        all_subjects = list(subject_counts.keys())
        
        # 5. Recent quizzes for the chart
        recent_quizzes = []
        for s in user_scores[-10:]:
            try:
                score = s.get('score', 0)
                total = max(s.get('total', 1), 1) # Ensure non-zero
                recent_quizzes.append({
                    "score": score,
                    "total": total,
                    "quiz_id": str(s.get('quiz_id', 'unknown'))
                })
            except:
                continue
        
        # 6. Login dates and Streak calculation
        login_recs = list(db['logins'].find({"user_id": user_id}, {"_id": 0, "date": 1}))
        login_dates = sorted(list(set([r['date'] for r in login_recs])), reverse=True)
        
        # 7. Account creation date
        user_doc = db['users'].find_one({"uid": user_id})
        joined_at = user_doc.get('created_at', 'Unknown') if user_doc else 'Unknown'
        
        streak = 0
        if login_dates:
            today = datetime.datetime.now().date()
            current_check = today
            date_set = set(login_dates)
            
            # If not logged in today, streak starts from yesterday or stays 0
            if today.isoformat() not in date_set:
                current_check = today - datetime.timedelta(days=1)
                
            while current_check.isoformat() in date_set:
                streak += 1
                current_check -= datetime.timedelta(days=1)
            
        return JsonResponse({
            "total_notes": total_notes,
            "total_quizzes": total_quizzes,
            "avg_score": avg_score,
            "streak": streak,
            "subjects": all_subjects,
            "subject_counts": subject_counts,
            "recent_quizzes": recent_quizzes,
            "login_dates": [r['date'] for r in login_recs],
            "joined_at": joined_at
        })
    except Exception as e:
        print(f"Progress Error: {e}")
        return JsonResponse({"error": f"Failed to calculate progress: {str(e)}"}, status=500)

@csrf_exempt
def save_score(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id')
            score = data.get('score')
            total = data.get('total')
            quiz_id = data.get('quiz_id')
            subject = data.get('subject', 'General Quiz')
            
            if not user_id or score is None or total is None:
                return JsonResponse({"error": "Missing fields"}, status=400)
                
            if db is not None:
                db['scores'].insert_one({
                    "user_id": user_id,
                    "score": score,
                    "total": total,
                    "quiz_id": quiz_id,
                    "subject": subject,
                    "timestamp": datetime.datetime.now().isoformat()
                })
                log_activity(user_id, "Quiz Completed", f"Scored {score}/{total} in {subject}")
                
            return JsonResponse({"message": "Score saved successfully"})
        except Exception as e:
            print("Save Score Error:")
            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def submit_feedback(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username', 'Anonymous')
            email = data.get('email', 'N/A')
            feedback_text = data.get('feedback', '')

            if not feedback_text:
                return JsonResponse({"error": "Feedback content is empty"}, status=400)

            # 1. Save to MongoDB
            feedback_doc = {
                "username": username,
                "email": email,
                "feedback": feedback_text,
                "timestamp": datetime.datetime.now().isoformat()
            }
            if db is not None:
                db['feedbacks'].insert_one(feedback_doc)
                log_activity(email, "Feedback Submitted", f"User {username} sent feedback.")

            # 2. Generate Excel (CSV) file
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(['Username', 'User Email', 'Feedback', 'Timestamp'])
            writer.writerow([username, email, feedback_text, feedback_doc['timestamp']])
            csv_content = output.getvalue()

            # 3. Send Email
            admin_email = "enostarhermas@gmail.com"
            subject = f"New Feedback from {username}"
            body = f"Hello,\n\nYou have received a new feedback entry.\n\nUsername: {username}\nEmail: {email}\nFeedback: {feedback_text}\n\nA CSV version (Excel compatible) is attached."
            
            try:
                email_msg = EmailMessage(
                    subject,
                    body,
                    os.getenv('EMAIL_HOST_USER', 'noreply@ai-study-assistant.com'),
                    [admin_email]
                )
                email_msg.attach(f'feedback_{username}.csv', csv_content, 'text/csv')
                email_msg.send()
            except Exception as mail_err:
                print(f"Mail sending failed (likely SMTP not configured): {mail_err}")
                # We don't fail the request because MongoDB save was successful
            
            # 4. Update Google Sheet
            try:
                sheet_id = "1tAgy_9Xll6tZv6iY6pRA_h3YIs9aQpIQZa1Nvl7jM30"
                scope = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
                
                # Path to your service account key file
                base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                key_path = os.path.join(base_dir, 'google_sheets_key.json')
                
                if os.path.exists(key_path):
                    creds = Credentials.from_service_account_file(key_path, scopes=scope)
                    gc = gspread.authorize(creds)
                    sh = gc.open_by_key(sheet_id)
                    worksheet = sh.get_worksheet(0) # Open first sheet
                    worksheet.append_row([username, email, feedback_text, feedback_doc['timestamp']])
                    print("Google Sheet updated successfully.")
                else:
                    print(f"Google Sheets key file not found at {key_path}. Skipping sheet update.")
            except Exception as sheet_err:
                print(f"Google Sheet update failed: {sheet_err}")
                # Don't fail the main request if sheet update fails
            
            return JsonResponse({"message": "Feedback submitted successfully! Thank you."})
        except Exception as e:
            traceback.print_exc()
            logging.error("Feedback Submission Error: %s", traceback.format_exc())
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def analyze_resume(request):
    if request.method == 'POST':
        try:
            domain = request.POST.get('domain', 'Engineering')
            goals = request.POST.get('goals', 'Software Engineer')
            file = request.FILES.get('file')

            resume_text = ""
            if file:
                resume_text = extract_text_from_file(file)

            gemini_key = os.getenv('GEMINI_API_KEY')
            if not gemini_key:
                 return JsonResponse({"error": "GEMINI_API_KEY not found in environment"}, status=500)
            
            client = genai.Client(api_key=gemini_key)

            prompt = f"""
            The student is in the domain: '{domain}' and their career goal is: '{goals}'.
            
            {'Here is their current resume content:' if resume_text else 'The student did not provide a resume. Give general advice.'}
            {resume_text[:5000]}
            
            Based on their domain, career goals, and current resume (if provided), generate intelligent career and resume suggestions.
            
            Return ONLY a valid JSON object strictly adhering to this format:
            {{
                "suggestions": {{
                    "projects": ["Project idea 1", "Project idea 2", "Project idea 3"],
                    "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4"],
                    "internships": ["Target Role 1", "Target Role 2"],
                    "resumeTips": ["Specific tip 1 based on their resume or goals", "Specific tip 2", "Specific tip 3"]
                }}
            }}
            """

            analysis_text = call_gemini_with_fallback(
                client,
                prompt,
                config={
                    "response_mime_type": "application/json"
                },
                is_prompt=True
            )
            
            try:
                data = json.loads(analysis_text)
                if 'suggestions' not in data:
                    data = {"suggestions": data} # If the AI just returned the inner object
            except:
                match = re.search(r'\{.*\}', analysis_text, re.DOTALL)
                if match:
                    data = json.loads(match.group())
                    if 'suggestions' not in data:
                        data = {"suggestions": data}
                else:
                    raise Exception("Failed to parse analysis JSON from AI")

            return JsonResponse(data)
        except Exception as e:
            traceback.print_exc()
            logging.error("Resume Analysis Error: %s", traceback.format_exc())
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def submit_mentorship_request(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            student_id = data.get('student_id', 'anonymous')
            mentor_id = data.get('mentor_id')
            topic = data.get('topic')
            department = data.get('department')
            student_name = data.get('student_name', 'Student')
            time_preference = data.get('time_preference', 'Not specified')
            year_of_study = data.get('year_of_study', 'Not specified')
            
            if not mentor_id or not topic:
                return JsonResponse({"error": "Missing mentor_id or topic"}, status=400)
                
            if db is not None:
                req_doc = {
                    "student_id": student_id,
                    "student_name": student_name,
                    "mentor_id": str(mentor_id),
                    "topic": topic,
                    "department": department,
                    "year_of_study": year_of_study,
                    "time_preference": time_preference,
                    "status": "pending",
                    "timestamp": datetime.datetime.now().isoformat(),
                    "replies": []
                }
                db['mentorship_requests'].insert_one(req_doc)
                log_activity(student_id, "Mentorship Request", f"Requested mentorship for {topic}")
                
                # Proactive Notification: Send email to all registered mentors
                try:
                    mentors = list(db['users'].find({"role": "mentor"}, {"email": 1, "username": 1}))
                    mentor_emails = [m['email'] for m in mentors if m.get('email')]
                    
                    if mentor_emails:
                        subject = f"New Mentorship Request: {topic[:30]}..."
                        body = f"Hello Mentor,\n\nA student has applied for mentorship.\n\n" \
                               f"Student: {student_name}\n" \
                               f"Department: {department}\n" \
                               f"Topic: {topic}\n" \
                               f"Preferred Time: {time_preference}\n\n" \
                               f"Please log in to the Community Hub to accept or resolve this request.\n\n" \
                               f"Best regards,\nPeople Link AI Assistant"
                        
                        email_msg = EmailMessage(
                            subject,
                            body,
                            os.getenv('EMAIL_HOST_USER', 'noreply@ai-study-assistant.com'),
                            mentor_emails # Send to all mentors
                        )
                        email_msg.send()
                except Exception as mail_err:
                    print(f"Mentorship notification email failed: {mail_err}")
                
            return JsonResponse({"message": "Request submitted successfully. Mentors have been notified."})
        except Exception as e:
            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def resolve_mentorship_request(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            request_id = data.get('request_id')
            
            if not request_id:
                return JsonResponse({"error": "Missing request_id"}, status=400)
                
            if db is not None:
                from bson import ObjectId
                db['mentorship_requests'].update_one(
                    {"_id": ObjectId(request_id)},
                    {"$set": {"status": "resolved"}}
                )
            return JsonResponse({"message": "Request resolved"})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def get_mentor_progress(request, user_id):
    if db is None:
        return JsonResponse({"error": "Database connection unavailable"}, status=503)
        
    try:
        all_reqs = list(db['mentorship_requests'].find({"mentor_id": user_id}))
        
        total_attended = len(all_reqs)
        
        subject_counts = {}
        for r in all_reqs:
            # We use department as the subject category for the knowledge mix
            topic = r.get('department')
            if not topic: 
                topic = 'General'
            subject_counts[topic] = subject_counts.get(topic, 0) + 1
                
        all_subjects = list(subject_counts.keys())
        
        login_recs = list(db['logins'].find({"user_id": user_id}, {"_id": 0, "date": 1}))
        login_dates = sorted(list(set([r['date'] for r in login_recs])), reverse=True)
        
        user_doc = db['users'].find_one({"uid": user_id})
        joined_at = user_doc.get('created_at', 'Unknown') if user_doc else 'Unknown'
        
        streak = 0
        if login_dates:
            today = datetime.datetime.now().date()
            current_check = today
            date_set = set(login_dates)
            
            if today.isoformat() not in date_set:
                current_check = today - datetime.timedelta(days=1)
                
            while current_check.isoformat() in date_set:
                streak += 1
                current_check -= datetime.timedelta(days=1)
                
        return JsonResponse({
            "total_attended": total_attended,
            "subjects": all_subjects,
            "subject_counts": subject_counts,
            "login_dates": [r['date'] for r in login_recs],
            "streak": streak,
            "joined_at": joined_at
        })
    except Exception as e:
        print(f"Mentor Progress Error: {e}")
        return JsonResponse({"error": f"Failed to calculate progress: {str(e)}"}, status=500)

def get_pending_requests(request, user_id):
    if db is None:
        return JsonResponse({"error": "Database connection unavailable"}, status=503)
    try:
        # Fetch requests for this specific mentor OR from the general pool
        reqs = list(db['mentorship_requests'].find({
            "$or": [{"mentor_id": user_id}, {"mentor_id": "general"}],
            "status": "pending"
        }))
        for r in reqs:
            r['_id'] = str(r['_id'])
        return JsonResponse({"requests": reqs})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def add_mentorship_reply(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            request_id = data.get('request_id')
            mentor_id = data.get('mentor_id')
            mentor_name = data.get('mentor_name')
            message = data.get('message')
            
            if not request_id or not message:
                return JsonResponse({"error": "Missing request_id or message"}, status=400)
                
            if db is not None:
                from bson import ObjectId
                reply_obj = {
                    "sender_id": mentor_id,
                    "sender_name": mentor_name,
                    "specialization": data.get('specialization', ''),
                    "message": message,
                    "timestamp": datetime.datetime.now().isoformat()
                }
                db['mentorship_requests'].update_one(
                    {"_id": ObjectId(request_id)},
                    {"$push": {"replies": reply_obj}}
                )
            return JsonResponse({"message": "Reply added successfully"})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Method not allowed"}, status=405)

def get_student_requests(request, user_id):
    if db is None:
        return JsonResponse({"error": "Database connection unavailable"}, status=503)
    try:
        reqs = list(db['mentorship_requests'].find({"student_id": user_id}).sort("timestamp", -1))
        for r in reqs:
            r['_id'] = str(r['_id'])
        return JsonResponse({"requests": reqs})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
@csrf_exempt
def get_live_notices(request):
    """Fetches real-world-like engineering notices using AI."""
    try:
        gemini_key = os.getenv('GEMINI_API_KEY')
        if not gemini_key:
            return JsonResponse({"error": "AI not configured"}, status=500)
            
        client = genai.Client(api_key=gemini_key)
        
        # Today's date context
        now_str = datetime.datetime.now().strftime("%B %d, %Y")
        
        prompt = f"""Generate 15 highly relevant, realistic engineering and academic notices for today ({now_str}).
        Focus on: GATE/GRE/TOEFL Exams, M.Tech/B.Tech Admissions, Results (Phase 1/2), and Global Tech Events.
        
        Output strictly as a JSON array of objects with these fields:
        - id: (unique number)
        - title: (Clear engineering/academic news title)
        - category: (Exactly one of: Results, Admissions, Exams, Events)
        - description: (One or two concise sentences)
        - url: (Use a real major official URL if known, else an engineering news portal link)
        - isNew: (true)
        - timestamp: (ISO 8601 format for today or yesterday)
        """
        
        ai_res = call_gemini_with_fallback(
            client, 
            prompt,
            config={"system_instruction": "You are a professional educational news scraper. Output ONLY raw JSON."}
        )
        
        # Robustly find the JSON part (in case model adds code blocks)
        json_match = re.search(r"(\[.*\])", ai_res, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group(1))
        else:
            data = json.loads(ai_res)
            
        return JsonResponse(data, safe=False)
    except Exception as e:
        # Fallback if AI fails completely - return something better than 500
        print(f"Notice AI Error: {e}")
        return JsonResponse([
            {"id":1, "title":"GATE 2026 Registration Phase 2", "category":"Exams", "description":"Primary registration closed, late entry begins.", "isNew":True, "timestamp":datetime.datetime.now().isoformat()}
        ], safe=False)

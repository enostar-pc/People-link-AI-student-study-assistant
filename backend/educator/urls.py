"""
URL configuration for educator project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from .views import status, register_user, get_email_by_username, update_username, track_login, ask_question, summarize_file, generate_quiz, get_progress, save_score, get_user_summaries, get_chat_history, submit_feedback, analyze_resume, submit_mentorship_request, resolve_mentorship_request, get_mentor_progress, get_pending_requests, get_user_role, add_mentorship_reply, get_student_requests, update_specialization, update_password, study_rooms, delete_study_room, get_live_notices

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/status/', status),
    path('api/users/register/', register_user),
    path('api/users/get-email/', get_email_by_username),
    path('api/users/update-username/', update_username),
    path('api/users/track-login/<str:user_id>', track_login),
    path('api/chat/ask/', ask_question),
    path('api/chat/history/<str:user_id>', get_chat_history),
    path('api/ai/summarize', summarize_file),
    path('api/ai/summaries/<str:user_id>', get_user_summaries),
    path('api/quiz/generate', generate_quiz),
    path('api/quiz/score', save_score),
    path('api/notes/progress/<str:user_id>', get_progress),
    path('api/feedback/', submit_feedback),
    path('api/career/analyze/', analyze_resume),
    path('api/mentorship/request/', submit_mentorship_request),
    path('api/mentorship/resolve/', resolve_mentorship_request),
    path('api/notes/mentor_progress/<str:user_id>', get_mentor_progress),
    path('api/mentorship/requests/<str:user_id>', get_pending_requests),
    path('api/users/role/<str:user_id>', get_user_role),
    path('api/mentorship/reply/', add_mentorship_reply),
    path('api/mentorship/student-requests/<str:user_id>', get_student_requests),
    path('api/users/update-specialization/', update_specialization),
    path('api/users/update-password/', update_password),
    path('api/community/rooms/', study_rooms),
    path('api/community/rooms/<str:room_id>/', delete_study_room),
    path('api/notices/live', get_live_notices),
]

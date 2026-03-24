import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

export const summarizeFile = async (file, userId, subject) => {
  const form = new FormData();
  form.append('file', file);
  form.append('user_id', userId);
  form.append('subject', subject);
  const res = await axios.post(`${API}/api/ai/summarize`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const getUserSummaries = async (userId) => {
  const res = await axios.get(`${API}/api/ai/summaries/${userId}`);
  return res.data;
};

export const generateQuiz = async (text, subject, userId) => {
  const res = await axios.post(`${API}/api/quiz/generate`, {
    text, subject, user_id: userId, num_questions: 5
  });
  return res.data;
};

export const saveScore = async (quizId, userId, score, total, subject) => {
  const res = await axios.post(`${API}/api/quiz/score`, {
    quiz_id: quizId, user_id: userId, score, total, subject
  });
  return res.data;
};

export const askQuestion = async (userId, question, history) => {
  const res = await axios.post(`${API}/api/chat/ask/`, {
    user_id: userId, question, history
  });
  return res.data;
};

export const getChatHistory = async (userId) => {
  const res = await axios.get(`${API}/api/chat/history/${userId}`);
  return res.data;
};

export const getProgress = async (userId) => {
  const res = await axios.get(`${API}/api/notes/progress/${userId}`);
  return res.data;
};

export const makeFlashcards = async (text) => {
  const res = await axios.post(`${API}/api/ai/flashcards`, { text });
  return res.data;
};

export const updateUsername = async (new_username, email) => {
  const res = await axios.post(`${API}/api/users/update-username/`, { new_username, email });
  return res.data;
};

export const registerUserMapping = async (username, email, userId, role = 'student', specialization = '') => {
  const res = await axios.post(`${API}/api/users/register/`, { username, email, user_id: userId, role, specialization });
  return res.data;
};

export const getUserRole = async (userId) => {
  const res = await axios.get(`${API}/api/users/role/${userId}`);
  return res.data;
};

export const trackLogin = async (userId) => {
  const res = await axios.post(`${API}/api/users/track-login/${userId}`);
  return res.data;
};

export const getEmailByUsername = async (username) => {
  const res = await axios.get(`${API}/api/users/get-email/?username=${username}`);
  return res.data;
};

export const submitFeedback = async (username, email, feedback) => {
  const res = await axios.post(`${API}/api/feedback/`, { username, email, feedback });
  return res.data;
};

export const analyzeResume = async (file, domain, goals) => {
  const form = new FormData();
  if (file) form.append('file', file);
  form.append('domain', domain);
  form.append('goals', goals);
  
  const res = await axios.post(`${API}/api/career/analyze/`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const submitMentorshipRequest = async (studentId, studentName, mentorId, topic, department, timePreference, yearOfStudy) => {
  const res = await axios.post(`${API}/api/mentorship/request/`, {
    student_id: studentId, 
    student_name: studentName, 
    mentor_id: mentorId, 
    topic, 
    department, 
    time_preference: timePreference,
    year_of_study: yearOfStudy
  });
  return res.data;
};

export const resolveMentorshipRequest = async (requestId) => {
  const res = await axios.post(`${API}/api/mentorship/resolve/`, {
    request_id: requestId
  });
  return res.data;
};

export const addMentorshipReply = async (requestId, mentorId, mentorName, message, specialization) => {
  const res = await axios.post(`${API}/api/mentorship/reply/`, {
    request_id: requestId,
    mentor_id: mentorId,
    mentor_name: mentorName,
    message: message,
    specialization: specialization
  });
  return res.data;
};

export const getStudentRequests = async (userId) => {
  const res = await axios.get(`${API}/api/mentorship/student-requests/${userId}`);
  return res.data;
};

export const getMentorProgress = async (userId) => {
  const res = await axios.get(`${API}/api/notes/mentor_progress/${userId}`);
  return res.data;
};

export const updateSpecialization = async (specialization, email) => {
  const res = await axios.post(`${API}/api/users/update-specialization/`, { specialization, email });
  return res.data;
};

export const updatePasswordBackend = async (password, email) => {
  const res = await axios.post(`${API}/api/users/update-password/`, { password, email });
  return res.data;
};

export const getStudyRooms = async () => {
  const res = await axios.get(`${API}/api/community/rooms/`);
  return res.data;
};

export const createStudyRoom = async (roomData) => {
  const res = await axios.post(`${API}/api/community/rooms/`, roomData);
  return res.data;
};

export const deleteStudyRoom = async (roomId) => {
  const res = await axios.delete(`${API}/api/community/rooms/${roomId}/`);
  return res.data;
};

export const getLiveNotices = async () => {
  const res = await axios.get(`${API}/api/notices/live`);
  return res.data;
};
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

export const registerUserMapping = async (username, email, userId) => {
  const res = await axios.post(`${API}/api/users/register/`, { username, email, user_id: userId });
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
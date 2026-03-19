import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { generateQuiz, saveScore, getUserSummaries } from '../api';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GuestModal from '../components/GuestModal';
import PageTransition from '../components/PageTransition';

export default function Quiz() {
  const location = useLocation();
  const prefill  = location.state || {};
  const [text,      setText]      = useState(prefill.text    || '');
  const [subject,   setSubject]   = useState(prefill.subject || '');
  const [questions, setQuestions] = useState([]);
  const [quizId,    setQuizId]    = useState('');
  const [answers,   setAnswers]   = useState({});
  const [score,     setScore]     = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [summaries, setSummaries] = useState([]);
  const [fetching,  setFetching]  = useState(false);
  const { isGuest, user } = useAuth();
  const [showGuestModal, setShowGuestModal] = useState(false);

  useEffect(() => {
    const fetchSummaries = async () => {
      if (!auth.currentUser || isGuest) return;
      setFetching(true);
      try {
        const data = await getUserSummaries(auth.currentUser.uid);
        setSummaries(data.summaries);
      } catch (err) {
        console.error('Failed to fetch summaries:', err);
      } finally {
        setFetching(false);
      }
    };
    fetchSummaries();
  }, []);

  const handleSelectSummary = (s) => {
    setText(s.raw_text);
    setSubject(s.filename.split('.')[0]); // Dummy subject from filename
  };

  const handleGenerate = async () => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    if (!text || !subject) return setError('Enter text and subject first');
    setLoading(true); setError(''); setScore(null); setAnswers({});
    try {
      const data = await generateQuiz(text, subject, user.uid);
      setQuestions(data.questions);
      setQuizId(data.quiz_id);
    } catch (err) {
      setError('Failed to generate quiz: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    let correct = 0;
    questions.forEach((q, i) => { if (answers[i] === q.answer) correct++; });
    setScore(correct);
    await saveScore(quizId, user.uid, correct, questions.length, subject);
    
    // Smooth scroll to top to show results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pct = score !== null ? Math.round(score / questions.length * 100) : 0;

  return (
    <PageTransition>
    <div className='page'>
      <h1>Quiz Generator</h1>

      {score !== null && (
        <div className='card' style={{ 
          textAlign: 'center', 
          marginBottom: '2rem',
          background: 'var(--surface)',
          padding: 'var(--gutter)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.06)'
        }}>
          <h2 style={{ marginBottom: '0.5rem', fontSize: 'var(--font-lg)' }}>Quiz Results</h2>
          <div style={{
            fontSize: 'var(--font-2xl)', 
            fontWeight: 900,
            background: pct >= 70 ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'linear-gradient(135deg, #f59e0b, #ef4444)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.1,
            margin: '1rem 0'
          }}>
            {score} / {questions.length}
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 'var(--font-base)', fontWeight: 600 }}>
            {pct}% Correct — {pct >= 70 ? 'Excellent performance! 🎉' : 'Needs a bit more focus! 💪'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '2rem', flexWrap: 'wrap' }}>
            <button className='btn btn-ghost btn-auto' onClick={() => { setScore(null); setAnswers({}); window.scrollTo({top:0, behavior:'smooth'}); }} style={{ padding: '0.75rem 2rem' }}>↺ Retry</button>
            <button className='btn btn-primary btn-auto' onClick={handleGenerate} style={{ padding: '0.75rem 2.5rem' }}>✎ New Quiz</button>
          </div>
        </div>
      )}

      {questions.length === 0 ? (
        <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
          {summaries.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.75rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Quick Select Notes
              </p>
              <div 
                style={{ 
                  display: 'flex', 
                  gap: '0.75rem', 
                  overflowX: 'auto', 
                  paddingBottom: '1rem',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                {summaries.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectSummary(s)}
                    style={{
                      padding: '0.65rem 1.1rem',
                      borderRadius: 'var(--radius-md)',
                      background: subject === s.filename.split('.')[0] ? 'rgba(108,99,255,0.1)' : 'var(--bg)',
                      border: `1px solid ${subject === s.filename.split('.')[0] ? 'var(--accent)' : 'var(--border)'}`,
                      color: subject === s.filename.split('.')[0] ? 'var(--accent)' : 'var(--text)',
                      fontSize: 'var(--font-xs)',
                      whiteSpace: 'nowrap',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: subject === s.filename.split('.')[0] ? '0 4px 12px rgba(108,99,255,0.15)' : 'none'
                    }}
                  >
                    📄 {s.filename}
                  </button>
                ))}
              </div>
            </div>
          )}

          <textarea
            data-lenis-prevent
            placeholder='Or paste your own study notes here...'
            value={text}
            onChange={e => setText(e.target.value)}
            style={{ 
              marginBottom: '1.5rem', 
              minHeight: 'clamp(250px, 40vh, 400px)',
              lineHeight: '1.7',
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              fontSize: '1rem',
              background: 'var(--surface2)',
              border: '1px solid var(--border)'
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type='text'
              placeholder='Subject name (e.g. Thermodynamics)'
              value={subject}
              onChange={e => setSubject(e.target.value)}
              style={{ padding: '0.85rem 1.25rem', fontSize: '1rem' }}
            />
            {error && <div className='banner-error'>{error}</div>}
            <button
              className='btn btn-primary'
              style={{ width: '100%', padding: '1.1rem', fontSize: '1.1rem' }}
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <><span className='typing-dots'><span/><span/><span/></span>&nbsp; Creating Quiz...</>
              ) : 'Start Quiz Session'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
          {questions.map((q, i) => (
            <div className='card' key={i} style={{ 
              marginBottom: '1.5rem', 
              padding: 'clamp(1.25rem, 5vw, 2rem)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <p style={{ fontWeight: 800, marginBottom: '1.5rem', fontSize: 'var(--font-base)', lineHeight: 1.5 }}>
                <span style={{ color: 'var(--accent)', marginRight: '0.75rem', fontSize: 'var(--font-lg)' }}>{i + 1}.</span>
                {q.question}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {q.options.map((opt, j) => {
                  const letter = opt[0];
                  const isCorrect = score !== null && letter === q.answer;
                  const isWrong   = score !== null && answers[i] === letter && letter !== q.answer;
                  const isSelected = answers[i] === letter;

                  return (
                    <label
                      key={j}
                      className={`quiz-option ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                      style={{
                        padding: '1rem 1.25rem',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                        background: isSelected ? 'rgba(108,99,255,0.05)' : 'var(--bg)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        cursor: score !== null ? 'default' : 'pointer',
                        minHeight: '56px'
                      }}
                    >
                      <input
                        type='radio'
                        name={`q${i}`}
                        value={letter}
                        checked={isSelected}
                        disabled={score !== null}
                        onChange={e => setAnswers({ ...answers, [i]: e.target.value })}
                        style={{ 
                          accentColor: 'var(--accent)', 
                          width: '20px', 
                          height: '20px',
                          cursor: 'pointer'
                        }}
                      />
                      <span style={{ fontWeight: isSelected ? 700 : 500, fontSize: '0.95rem' }}>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {score === null && (
            <button
              className='btn btn-green'
              style={{ width: '100%', padding: '1.1rem', fontSize: '1.1rem', marginTop: '1.5rem', borderRadius: 'var(--radius-lg)' }}
              onClick={handleSubmit}
              disabled={Object.keys(answers).length < questions.length}
            >
              Verify Answers
            </button>
          )}
        </div>
      )}

      <GuestModal 
        isOpen={showGuestModal} 
        onClose={() => setShowGuestModal(false)} 
        title="Account Required for Quizzes"
      />
    </div>
    </PageTransition>
  );
}
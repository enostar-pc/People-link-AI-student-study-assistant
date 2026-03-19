import { useState, useRef, useEffect } from 'react';
import { auth } from '../firebase';
import { askQuestion, getChatHistory } from '../api';
import { useAuth } from '../context/AuthContext';
import GuestModal from '../components/GuestModal';
import PageTransition from '../components/PageTransition';

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! I\'m your AI study assistant. Ask me anything about your subjects. 📚' }
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const bottomRef = useRef(null);
  const { isGuest, user } = useAuth();
  const [showGuestModal, setShowGuestModal] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      if (!auth.currentUser || isGuest) {
        setInitialLoading(false);
        return;
      }
      try {
        const data = await getChatHistory(auth.currentUser.uid);
        if (data.history && data.history.length > 0) {
          const formattedHistory = [];
          data.history.forEach(chat => {
            formattedHistory.push({ role: 'user', text: chat.question });
            formattedHistory.push({ role: 'ai', text: chat.answer, videos: [] });
          });
          setMessages(prev => [prev[0], ...formattedHistory]);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setInitialLoading(false);
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildHistory = () => {
    const pairs = [];
    for (let i = 1; i < messages.length - 1; i += 2) {
      if (messages[i]?.role === 'user' && messages[i+1]?.role === 'ai')
        pairs.push({ question: messages[i].text, answer: messages[i+1].text });
    }
    return pairs.slice(-3);
  };

  const sendMessage = async () => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    if (!input.trim() || loading) return;
    const question = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setLoading(true);
    try {
      const data = await askQuestion(user.uid, question, buildHistory());
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: data.answer, 
        videos: data.video_suggestions || [] 
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
    <div className='page' style={{ maxWidth: '1000px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 220px)', minHeight: '450px', gap: '0.5rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>Doubt Solver</h1>

      {/* Message window */}
      <div 
        data-lenis-prevent
        style={{
          flex: 1,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          padding: 'clamp(1rem, 4vw, 2rem)',
          marginBottom: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
          position: 'relative'
        }}
      >
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '100%'
          }}>
            <div className={msg.role === 'user' ? 'bubble-user' : 'bubble-ai'} style={{
              borderRadius: msg.role === 'user' ? 'var(--radius-lg) var(--radius-lg) 4px var(--radius-lg)' : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px',
              boxShadow: msg.role === 'user' ? '0 4px 12px rgba(108,99,255,0.2)' : '0 4px 12px rgba(0,0,0,0.05)',
              fontSize: 'var(--font-base)',
              padding: '1rem 1.25rem',
            }}>
              {msg.text}
            </div>
            {msg.role === 'ai' && msg.videos && msg.videos.length > 0 && (
              <div style={{
                display: 'flex',
                gap: '0.6rem',
                flexWrap: 'wrap',
                marginTop: '0.75rem',
                paddingLeft: '0.25rem'
              }}>
                {msg.videos.map((v, j) => {
                  const [title, videoId] = v.includes('|') ? v.split('|').map(s => s.trim()) : [v, ''];
                  const href = videoId ? `https://www.youtube.com/watch?v=${videoId}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(v)}`;
                  return (
                    <a
                      key={j}
                      href={href}
                      target='_blank'
                      rel='noreferrer'
                      style={{
                        fontSize: 'var(--font-xs)',
                        background: 'rgba(239,68,68,0.08)',
                        color: '#ef4444',
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-xl)',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        border: '1px solid rgba(239,68,68,0.15)',
                        fontWeight: 700,
                        transition: 'all 0.2s ease',
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                    >
                      <span style={{ fontSize: '1rem' }}>▶</span> {title}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div className='bubble-ai' style={{ padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px' }}>
              <span className='typing-dots'>
                <span /><span /><span />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} style={{ height: '1px' }} />
      </div>

      {/* Input area */}
      <div style={{ 
        display: 'flex', 
        gap: '0.75rem', 
        padding: '0.5rem 0 1rem',
        background: 'transparent',
        flexShrink: 0
      }}>
        <input
          type='text'
          placeholder='Ask a question...'
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          style={{ 
            flex: 1, 
            padding: '1rem 1.5rem', 
            borderRadius: 'var(--radius-xl)',
            fontSize: '1rem',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
          }}
        />
        <button
          className='btn btn-primary btn-auto'
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{ 
            width: 'clamp(80px, 15vw, 120px)', 
            borderRadius: 'var(--radius-xl)',
            fontWeight: 800
          }}
        >
          Send
        </button>
      </div>

      <GuestModal 
        isOpen={showGuestModal} 
        onClose={() => setShowGuestModal(false)} 
        title="Account Required to Chat"
      />
    </div>
    </PageTransition>
  );
}
import { useState } from 'react';
import { summarizeFile } from '../api';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GuestModal from '../components/GuestModal';
import PageTransition from '../components/PageTransition';

export default function Upload() {
  const [file,    setFile]    = useState(null);
  const [subject, setSubject] = useState('');
  const [summary, setSummary] = useState('');
  const [videos,  setVideos]  = useState([]);
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const { isGuest, user } = useAuth();
  const [showGuestModal, setShowGuestModal] = useState(false);
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    if (!file)    return setError('Please select a file');
    if (!subject) return setError('Please enter a subject');
    setLoading(true); setError('');
    try {
      const data = await summarizeFile(file, user.uid, subject);
      setSummary(data.summary);
      setVideos(data.video_suggestions || []);
      setRawText(data.raw_text);
    } catch (err) {
      setError('Upload failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
    <div className='page' style={{ maxWidth: 1100, margin: '0 auto' }}>
      <h1>Upload Notes</h1>

      {/* Drop zone and inputs */}
      <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <label className='dropzone' style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'clamp(180px, 30vh, 260px)',
          marginBottom: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '2px dashed var(--accent)',
          background: 'rgba(108,99,255,0.03)',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', marginBottom: '1rem' }}>📄</div>
          <p style={{ fontWeight: 700, fontSize: 'var(--font-base)', marginBottom: '0.5rem', textAlign: 'center' }}>
            {file ? file.name : 'Choose a file to analyze'}
          </p>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--muted)', textAlign: 'center' }}>
            {file
              ? <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓ File selected</span>
              : 'PDF or TXT (Max 10MB)'
            }
          </p>
          <input
            type='file' accept='.pdf,.txt'
            style={{ display: 'none' }}
            onChange={e => { setFile(e.target.files[0]); setSummary(''); }}
          />
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <input
            type='text'
            placeholder='What subject is this about?'
            value={subject}
            onChange={e => setSubject(e.target.value)}
            style={{ 
              padding: '1rem', 
              fontSize: '1rem', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)' 
            }}
          />

          {error && <div className='banner-error' style={{ margin: 0 }}>{error}</div>}

          <button
            className='btn btn-primary'
            style={{ padding: '1.1rem', fontSize: '1rem' }}
            onClick={handleUpload}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className='typing-dots'>
                  <span /><span /><span />
                </span>
                &nbsp; Generating...
              </>
            ) : 'Summarize Document'}
          </button>
        </div>
      </div>

      {summary && (
        <div className='card responsive-split' style={{ 
          marginTop: '3rem', 
          display: 'flex', 
          gap: 'var(--gutter)', 
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          padding: 'var(--gutter)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)'
        }}>
          {/* Left Side: Summary */}
          <div style={{ flex: '1 1 450px', minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ margin: 0 }}>✦ AI Summary</h2>
              <span className='tag' style={{ padding: '0.5rem 1rem' }}>{subject}</span>
            </div>
            <div style={{ 
              color: 'var(--text)', 
              lineHeight: 1.8, 
              fontSize: 'var(--font-base)',
              background: 'var(--bg)',
              padding: '1.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)'
            }}>
              {summary}
            </div>
            
            <button
              className='btn btn-primary'
              style={{ marginTop: '2.5rem', width: 'auto', padding: '1rem 2rem' }}
              onClick={() => navigate('/quiz', { state: { text: rawText, subject } })}
            >
              Master this with a Quiz →
            </button>
          </div>

          {/* Right Side: Visual Learning */}
          {videos.length > 0 && (
            <div className="video-recommendations" style={{ 
              flex: '1 1 300px',
              minWidth: 0
            }}>
              <h3 style={{ 
                fontSize: '0.8rem', 
                color: 'var(--muted)', 
                marginBottom: '1.5rem', 
                letterSpacing: '0.15rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1.2rem' }}>📺</span> Visual Learning
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {videos.map((v, i) => {
                  const [vTitle, videoId] = v.includes('|') ? v.split('|').map(s => s.trim()) : [v, 'dQw4w9WgXcQ'];
                  const finalVideoId = videoId || 'dQw4w9WgXcQ';
                  
                  return (
                    <a
                      key={i}
                      href={`https://www.youtube.com/watch?v=${finalVideoId}`}
                      target='_blank'
                      rel='noreferrer'
                      className="video-card"
                      style={{
                        display: 'block',
                        textDecoration: 'none',
                        color: 'var(--text)',
                        background: 'var(--bg)',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        border: '1px solid var(--border)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                    <div style={{
                      width: '100%',
                      aspectRatio: '16/9',
                      background: 'var(--surface2)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <img 
                        src={`https://img.youtube.com/vi/${finalVideoId}/mqdefault.jpg`} 
                        alt={vTitle}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.1)'
                      }}>
                        <div style={{
                          width: 44, height: 44,
                          background: 'rgba(239, 68, 68, 0.95)',
                          borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: '1.3rem', paddingLeft: '4px',
                          boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                        }}>▶</div>
                      </div>
                    </div>
                    <div style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 800, fontSize: 'var(--font-sm)', lineHeight: 1.4, marginBottom: '0.4rem' }}>{vTitle}</div>
                      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--muted)' }}>Expert Tutorial</div>
                    </div>
                  </a>
                );})}
              </div>
            </div>
          )}
        </div>
      )}

      <GuestModal 
        isOpen={showGuestModal} 
        onClose={() => setShowGuestModal(false)} 
        title="Account Required to Upload"
      />
    </div>
    </PageTransition>
  );
}
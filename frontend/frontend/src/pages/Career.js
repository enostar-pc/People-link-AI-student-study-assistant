import React, { useState } from 'react';
import { Target, FileText, Briefcase, Award, TrendingUp, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { analyzeResume } from '../api';
import { useAuth } from '../context/AuthContext';
import GuestModal from '../components/GuestModal';
import PageTransition from '../components/PageTransition';

export default function Career() {
  const [domain, setDomain] = useState('Computer Science');
  const [goals, setGoals] = useState('Backend Software Engineering');
  const [resumeFile, setResumeFile] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [error, setError] = useState('');
  
  const { isGuest } = useAuth();
  const [showGuestModal, setShowGuestModal] = useState(false);

  const fetchSuggestions = async () => {
    setGenerating(true);
    setError('');
    setSuggestions(null);
    try {
      const data = await analyzeResume(resumeFile, domain, goals);
      setSuggestions(data.suggestions);
    } catch (err) {
      console.error(err);
      setError('Failed to analyze profile: ' + (err.response?.data?.error || err.message));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <PageTransition>
    <div className='page' style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 'clamp(2rem, 8vw, 4rem)' }}>
        <h1 style={{ fontSize: 'var(--font-2xl)', marginBottom: '0.75rem' }}>Career Optimizer</h1>
        <p style={{ color: 'var(--muted)', fontSize: 'var(--font-base)', maxWidth: 650, margin: '0 auto', fontWeight: 500 }}>
          Bridge the gap between your studies and industry requirements with AI-powered career guidance.
        </p>
      </div>

      <div className='card' style={{ 
        marginBottom: '3rem', 
        padding: 'var(--gutter)', 
        borderRadius: 'var(--radius-xl)',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(200px, 100%, 240px), 1fr))', gap: '1.5rem', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>Academic Domain</label>
            <input type='text' value={domain} onChange={e => setDomain(e.target.value)} placeholder='e.g. Computer Science' style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>Dream Role</label>
            <input type='text' value={goals} onChange={e => setGoals(e.target.value)} placeholder='e.g. Frontend Specialist' style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>Resume Upload</label>
            <label 
              onClick={(e) => {
                if (isGuest) {
                  e.preventDefault();
                  setShowGuestModal(true);
                }
              }}
              className="dropzone"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '0.85rem 1.25rem', fontSize: '0.95rem',
                color: resumeFile ? 'var(--green)' : 'var(--text)', cursor: 'pointer',
                height: '52px', overflow: 'hidden', margin: 0, fontWeight: 500
              }}
            >
              <Upload size={18} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {resumeFile ? resumeFile.name : 'Select PDF/TXT'}
              </span>
              <input type='file' accept='.pdf,.txt' style={{ display: 'none' }} onChange={e => setResumeFile(e.target.files[0])} />
            </label>
          </div>
          <button 
            className='btn btn-primary' 
            onClick={fetchSuggestions} 
            disabled={generating} 
            style={{ height: '52px', fontSize: '1rem', fontWeight: 800 }}
          >
            {generating ? (
              <span className='typing-dots'><span/><span/><span/></span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Target size={20} /> Analyze Profile
              </span>
            )}
          </button>
        </div>
      </div>
      
      {error && <div className='banner-error' style={{ marginBottom: '2.5rem', textAlign: 'center' }}>{error}</div>}

      {suggestions && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(280px, 100%, 400px), 1fr))', gap: 'var(--gutter)' }}>
            
            <div className='card' style={{ borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--accent)', marginBottom: '2rem', fontSize: 'var(--font-base)' }}>
                <TrendingUp size={24} /> Skill Mastery
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {suggestions.skills.map(s => <span key={s} className='tag' style={{ padding: '0.6rem 1.1rem', fontSize: '0.85rem', fontWeight: 700 }}>{s}</span>)}
              </div>
            </div>

            <div className='card' style={{ borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--green)', marginBottom: '2rem', fontSize: 'var(--font-base)' }}>
                <Briefcase size={24} /> Project Roadmap
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {suggestions.projects.map((p, i) => (
                  <div key={i} style={{ padding: '1rem', background: 'var(--surface2)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', fontWeight: 500, borderLeft: '3px solid var(--green)' }}>
                    {p}
                  </div>
                ))}
              </div>
            </div>

            <div className='card' style={{ borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#f59e0b', marginBottom: '2rem', fontSize: 'var(--font-base)' }}>
                <FileText size={24} /> Optimization Tips
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 {suggestions.resumeTips.map((r, i) => (
                  <div key={i} style={{ padding: '1rem', background: 'var(--surface2)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', color: 'var(--text)', borderLeft: '3px solid #f59e0b' }}>
                    {r}
                  </div>
                ))}
              </div>
            </div>

            <div className='card' style={{ borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--accent2)', marginBottom: '2rem', fontSize: 'var(--font-base)' }}>
                <Award size={24} /> Opportunities
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 {suggestions.internships.map((r, i) => (
                  <div key={i} style={{ padding: '1rem', background: 'var(--surface2)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', borderLeft: '3px solid var(--accent2)' }}>
                    {r}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </motion.div>
      )}

      <GuestModal 
        isOpen={showGuestModal} 
        onClose={() => setShowGuestModal(false)} 
        title="Account Required"
      />
    </div>
    </PageTransition>
  );
}

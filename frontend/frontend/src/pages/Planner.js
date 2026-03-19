import React, { useState, useEffect } from 'react';
import { Calendar, BookOpen, Clock, Zap, UploadCloud, FileText, CheckCircle, Bell, BellOff, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../context/AuthContext';

export default function Planner() {
  const { user } = useAuth();
  const [examDate, setExamDate] = useState('');
  const [weakSubjects, setWeakSubjects] = useState('');
  const [file, setFile] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(localStorage.getItem('planner_notif') === 'true');
  const [logs, setLogs] = useState(JSON.parse(localStorage.getItem(`planner_logs_${user?.uid}`) || '[]'));

  useEffect(() => {
    localStorage.setItem('planner_notif', notificationsEnabled);
  }, [notificationsEnabled]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleGenerate = () => {
    if (!examDate) return alert("Please select an exam date first.");
    
    setLoading(true);
    // Mock AI Analysis of notes and parameters
    setTimeout(() => {
      const generatedSchedule = [
        { 
          day: 'Day 1: Foundation', 
          focus: 'Core Theory & Concepts', 
          topics: ['Introduction to Thermodynamics', 'Laws of Energy Conservation', 'Entropy Basics'],
          tasks: ['Read Chapter 1-2', 'Review Uploaded Lecture Notes', 'Complete 5 conceptual questions'] 
        },
        { 
          day: 'Day 2: Application', 
          focus: 'Problem Solving & Calculation', 
          topics: ['Heat Engines', 'Refrigerators & Heat Pumps', 'Carnot Cycle'],
          tasks: ['Practice 10 numerical problems', 'Solve past year questions', 'Watch video explanation for Carnot Cycle'] 
        },
        { 
          day: 'Day 3: Mastery', 
          focus: 'Final Revision & Mock Test', 
          topics: ['Phase Equilibrium', 'Chemical Potential', 'Comprehensive Review'],
          tasks: ['Take AI-Generated Mock Exam', 'Summarize key formulas', 'Review weak areas from Day 1'] 
        },
      ];
      
      setSchedule(generatedSchedule);
      
      // Save logs to "database" (localStorage for this demo)
      const newLog = {
        id: Date.now(),
        date: new Date().toISOString(),
        examDate,
        subjects: weakSubjects,
        fileName: file ? file.name : 'Manual Entry',
        status: 'Generated & Monitoring'
      };
      
      const updatedLogs = [newLog, ...logs];
      setLogs(updatedLogs);
      localStorage.setItem(`planner_logs_${user?.uid}`, JSON.stringify(updatedLogs));
      
      setLoading(false);
    }, 2000);
  };

  return (
    <PageTransition>
    <div className='page' style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: 'clamp(2rem, 8vw, 3rem)' }}>
        <h1 style={{ fontSize: 'var(--font-2xl)', marginBottom: '0.75rem' }}>AI Study Architect</h1>
        <p style={{ color: 'var(--muted)', fontSize: 'var(--font-base)', maxWidth: 700, margin: '0 auto', fontWeight: 500 }}>
          Upload your notes and let AI build a precision-timed study schedule focused on your specific curriculum.
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(320px, 45%, 500px), 1fr))', 
        gap: '2rem',
        alignItems: 'flex-start'
      }}>
        {/* Left Column: Input & Upload */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className='card' style={{ 
            padding: '2.5rem 2rem',
            borderRadius: '24px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', fontSize: '1.25rem' }}>
              <Calendar size={24} color='var(--accent)' /> Planner Parameters
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* File Upload Section */}
              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Upload Study Material (PDF/Notes)</label>
                <div 
                  onClick={() => document.getElementById('planner-file').click()}
                  style={{
                    border: '2px dashed var(--border)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: file ? 'rgba(108,99,255,0.05)' : 'transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input type='file' id='planner-file' hidden onChange={handleFileChange} />
                  {file ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--accent)' }}>
                      <FileText size={20} />
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{file.name}</span>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--muted)' }}>
                      <UploadCloud size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                      <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Click to upload notes for AI analysis</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Exam Date</label>
                <input 
                  type='date' 
                  value={examDate} 
                  onChange={e => setExamDate(e.target.value)} 
                  style={{ padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border)', width: '100%', fontSize: '1rem', background: 'var(--bg)', color: 'var(--text)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Focus Subjects</label>
                <input 
                  type='text' 
                  placeholder='e.g., Quantum Physics, Linear Algebra' 
                  value={weakSubjects} 
                  onChange={e => setWeakSubjects(e.target.value)} 
                  style={{ padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border)', width: '100%', fontSize: '1rem', background: 'var(--bg)', color: 'var(--text)' }}
                />
              </div>

              <div style={{ 
                background: 'var(--surface)', 
                padding: '1rem', 
                borderRadius: '16px', 
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Bell size={18} color={notificationsEnabled ? 'var(--accent)' : 'var(--muted)'} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Sync Notifications</span>
                </div>
                <button 
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    style={{
                        padding: '0.4rem 1rem',
                        borderRadius: '20px',
                        border: 'none',
                        background: notificationsEnabled ? 'var(--accent)' : 'var(--muted)',
                        color: 'white',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                    }}
                >
                    {notificationsEnabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              <button 
                className='btn btn-primary' 
                onClick={handleGenerate} 
                disabled={loading} 
                style={{ padding: '1.25rem', marginTop: '1rem', fontSize: '1rem', fontWeight: 800, borderRadius: '16px' }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Zap size={20} /></motion.div>
                    Analyzing Material...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Zap size={20} /> Generate AI Schedule
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Activity Logs (Database Monitoring Simulation) */}
          {logs.length > 0 && (
            <div className='card' style={{ padding: '1.5rem', borderRadius: '20px' }}>
                <h3 style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Info size={14} /> Database Plan Logs
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {logs.slice(0, 3).map(log => (
                        <div key={log.id} style={{ fontSize: '0.75rem', padding: '0.75rem', borderRadius: '12px', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 800 }}>AI Analysis Complete</div>
                                <div style={{ opacity: 0.6 }}>{log.fileName} • {new Date(log.date).toLocaleDateString()}</div>
                            </div>
                            <div style={{ color: 'var(--accent)', fontWeight: 700 }}>Active</div>
                        </div>
                    ))}
                </div>
            </div>
          )}
        </div>

        {/* Right Column: Generated Schedule */}
        <div style={{ 
          background: schedule ? 'var(--surface)' : 'rgba(0,0,0,0.01)',
          padding: '2.5rem 2rem',
          borderRadius: '24px',
          minHeight: '600px',
          border: schedule ? '1px solid var(--border)' : '1px dashed var(--border)',
          boxShadow: schedule ? '0 12px 64px rgba(0,0,0,0.08)' : 'none',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', fontSize: '1.25rem' }}>
            <Clock size={24} color='var(--accent2)' /> Your Targeted Workflow
          </h2>
          
          <AnimatePresence mode='wait'>
            {!schedule && !loading && (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ textAlign: 'center', color: 'var(--muted)', padding: '6rem 1rem' }}
              >
                <BookOpen size={64} style={{ margin: '0 auto 2rem', opacity: 0.2 }} />
                <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>Ready for Analysis</h3>
                <p style={{ fontWeight: 500, fontSize: '0.9rem', maxWidth: 300, margin: '0 auto' }}>Provide your study material above to generate a precise curriculum-based roadmap.</p>
              </motion.div>
            )}

            {loading && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ textAlign: 'center', padding: '6rem 1rem' }}
              >
                <div className='typing-dots' style={{ fontSize: '2rem' }}><span/><span/><span/></div>
                <p style={{ color: 'var(--muted)', marginTop: '2rem', fontWeight: 600 }}>Deconstructing notes & identifying key topics...</p>
              </motion.div>
            )}

            {schedule && !loading && (
              <motion.div 
                key="content"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
              >
                {schedule.map((s, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: i * 0.1 }} 
                    key={i} 
                    style={{ 
                      padding: '1.5rem', 
                      background: 'var(--bg)', 
                      borderRadius: '20px', 
                      border: '1px solid var(--border)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 800, marginBottom: '0.25rem', textTransform: 'uppercase' }}>{s.day}</div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{s.focus}</h3>
                      </div>
                      <CheckCircle size={20} color='var(--border)' style={{ cursor: 'pointer' }} />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>Core Topics to Cover</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {s.topics.map((topic, k) => (
                                <span key={k} style={{ padding: '0.35rem 0.75rem', background: 'rgba(108,99,255,0.08)', color: 'var(--accent)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
                                    {topic}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>Suggested Tasks</div>
                        <ul style={{ paddingLeft: '1.25rem', color: 'var(--text)', fontSize: '0.85rem', opacity: 0.9, lineHeight: 1.6 }}>
                            {s.tasks.map((t, j) => <li key={j} style={{ marginBottom: '0.8rem' }}>{t}</li>)}
                        </ul>
                    </div>
                  </motion.div>
                ))}
                
                <div style={{ 
                    marginTop: '1rem', 
                    padding: '1.5rem', 
                    background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)', 
                    borderRadius: '20px', 
                    color: 'white',
                    textAlign: 'center'
                }}>
                    <Bell size={24} style={{ marginBottom: '0.5rem' }} />
                    <h4 style={{ margin: 0 }}>Smart Notifications Active</h4>
                    <p style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.5rem' }}>We'll alert you every morning with your daily study focus.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
    </PageTransition>
  );
}

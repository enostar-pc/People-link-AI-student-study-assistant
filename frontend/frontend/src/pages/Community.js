import React, { useState } from 'react';
import { Users, MessageSquare, Video, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import PageTransition from '../components/PageTransition';

export default function Community() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('forum');

  // Hardcoded mock mentorship requests for display
  const MOCK_REQUESTS = [
    { id: 101, name: "Pranjal S.", topic: "React Native Performance", date: "2 mins ago" },
    { id: 102, name: "Aman V.", topic: "Thermodynamics in Chemical Engineering", date: "15 mins ago" },
    { id: 103, name: "Juhi J.", topic: "Graph Theory Midterm prep", date: "1 hour ago" }
  ];

  return (
    <PageTransition>
    <div className='page' style={{ maxWidth: 1100, margin: '0 auto' }}>
      
      {/* Role-Based Header */}
      <div style={{ textAlign: 'center', marginBottom: 'clamp(2rem, 8vw, 3rem)' }}>
        <h1 style={{ fontSize: 'var(--font-2xl)', marginBottom: '1rem' }}>
          {role === 'mentor' ? 'Mentor Command Center' : 'Community Hub'}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 'var(--font-base)', maxWidth: 600, margin: '0 auto', fontWeight: 500 }}>
          {role === 'mentor' 
            ? 'Access your students, manage discussions, and facilitate the learning journey.'
            : 'Master engineering together. Collaborative learning and student mentorship.'}
        </p>
      </div>

      {/* Mentor Notification Bar */}
      {role === 'mentor' && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.5rem',
            marginBottom: '3rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
             <Users size={20} color='var(--accent2)' />
             <h3 style={{ fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Incoming Mentorship Requests</h3>
          </div>
          <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
            {MOCK_REQUESTS.map(req => (
              <div key={req.id} style={{
                minWidth: '280px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{req.name}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{req.date}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>Topic: <span style={{ color: 'var(--text)' }}>{req.topic}</span></div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button className='btn btn-primary' style={{ flex: 1, padding: '0.4rem', fontSize: '0.7rem', background: 'var(--green)', border: 'none' }}>Approve</button>
                  <button className='btn btn-ghost' style={{ flex: 1, padding: '0.4rem', fontSize: '0.7rem' }}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tabs Selection */}
      <div style={{ 
        display: 'flex', 
        gap: '0.75rem', 
        justifyContent: 'center', 
        marginBottom: '3rem',
        overflowX: 'auto',
        padding: '0.25rem'
      }}>
        {[
          { id: 'forum', icon: MessageSquare, label: role === 'mentor' ? 'Moderate Forum' : 'Forum' },
          { id: 'rooms', icon: Video, label: role === 'mentor' ? 'Manage Rooms' : 'Rooms' },
          { id: 'mentors', icon: ShieldCheck, label: role === 'mentor' ? 'Mentor Directory' : 'Mentors' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: 'clamp(0.6rem, 2vw, 0.85rem) clamp(1rem, 4vw, 2rem)',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              background: activeTab === t.id ? (role === 'mentor' ? 'var(--accent2)' : 'var(--accent)') : 'var(--surface)',
              color: activeTab === t.id ? '#fff' : 'var(--text)',
              border: `1px solid ${activeTab === t.id ? 'transparent' : 'var(--border)'}`,
              borderRadius: 'var(--radius-xl)',
              fontWeight: 800,
              fontSize: 'var(--font-sm)',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              whiteSpace: 'nowrap',
              boxShadow: activeTab === t.id ? `0 10px 20px ${role === 'mentor' ? 'rgba(236,72,153,0.25)' : 'rgba(108,99,255,0.25)'}` : 'none'
            }}
          >
            <t.icon size={20} /> {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode='wait'>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'forum' && (
            <div className='card' style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1.25rem',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--gutter)',
              border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: 'var(--font-lg)' }}>{role === 'mentor' ? 'Ongoing Discussions (Moderation)' : 'Active Conversations'}</h2>
                {role === 'mentor' && <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent2)', background: 'var(--surface2)', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>Discord Admin Access Active</span>}
              </div>
              
              {[
                { title: 'Efficient Heat Transfer in Reactor Designs', author: 'Alex M.', replies: 12, link: 'https://discord.gg/ebX8PZxS' },
                { title: 'Best Practice for Implementing Redux Toolkits', author: 'Sarah J.', replies: 5, link: 'https://discord.gg/zkHaBR3U' },
                { title: 'Midterm Prep: Algorithms and Complexity', author: 'David K.', replies: 28, link: 'https://discord.gg/TygCDREZ' },
              ].map((p, i) => (
                <div 
                  key={i} 
                  onClick={() => window.open(p.link, '_blank')}
                  style={{ 
                    padding: '1.25rem', 
                    background: 'var(--bg)', 
                    borderRadius: 'var(--radius-lg)', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    gap: '1rem',
                    border: '1px solid var(--border)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = role === 'mentor' ? 'var(--accent2)' : 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: 'var(--font-base)', color: 'var(--text)', marginBottom: '0.5rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</h3>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--muted)', fontWeight: 600 }}>Thread by <span style={{ color: role === 'mentor' ? 'var(--accent2)' : 'var(--accent)' }}>{p.author}</span></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      color: role === 'mentor' ? 'var(--accent2)' : 'var(--accent)', 
                      fontSize: 'var(--font-xs)', 
                      fontWeight: 800,
                      flexShrink: 0,
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(236,72,153,0.06)',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      <MessageSquare size={16} /> {p.replies}
                    </div>
                    {role === 'mentor' && (
                        <button style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-md)', fontSize: '0.65rem', fontWeight: 700 }}>Discord Panel</button>
                    )}
                  </div>
                </div>
              ))}
              <button 
                className='btn btn-primary' 
                onClick={() => window.open('https://discord.gg/m3rvMr2W', '_blank')}
                style={{ 
                    marginTop: '1.5rem', 
                    padding: '1.1rem', 
                    fontWeight: 800,
                    background: role === 'mentor' ? 'var(--accent2)' : 'var(--accent)',
                    border: 'none'
                }}
              >
                {role === 'mentor' ? 'Start Mentor Discussion' : 'Start New Conversation'}
              </button>
            </div>
          )}

          {activeTab === 'rooms' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--gutter)' }}>
              {[
                { name: 'Late Night Coders', users: 4, limit: 10, topic: 'Web Dev' },
                { name: 'Physics 101 Prep', users: 2, limit: 5, topic: 'Mechanics' },
                { name: 'Silent Study Zone', users: 8, limit: 12, topic: 'Focus' },
              ].map((r, i) => (
                <div key={i} className='card' style={{ 
                  textAlign: 'center', 
                  padding: 'var(--gutter)',
                  borderRadius: 'var(--radius-xl)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    background: 'var(--bg)', 
                    borderRadius: '50%', 
                    margin: '0 auto 1.5rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.05)'
                  }}>
                    <Users size={32} color={role === 'mentor' ? 'var(--accent2)' : 'var(--accent)'} />
                  </div>
                  <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 800 }}>{r.name}</h3>
                  <p style={{ color: 'var(--muted)', fontSize: 'var(--font-sm)', marginTop: '0.5rem', fontWeight: 600 }}>Topic: {r.topic}</p>
                  <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 800, color: r.users >= r.limit ? '#ef4444' : '#10b981' }}>
                      {r.users} / {r.limit} Online
                    </span>
                    <button 
                      className='btn btn-primary' 
                      onClick={() => window.open('https://meet.google.com/new', '_blank')}
                      style={{ 
                        padding: '0.65rem 1.25rem', 
                        fontSize: 'var(--font-xs)', 
                        fontWeight: 800,
                        background: role === 'mentor' ? 'var(--accent2)' : 'var(--accent)',
                        border: 'none'
                      }}
                    >
                      {role === 'mentor' ? 'Host Room' : 'Connect'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'mentors' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className='card' style={{ 
                textAlign: 'center', 
                padding: 'clamp(2rem, 10vw, 4rem) var(--gutter)',
                borderRadius: 'var(--radius-xl)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.04)'
              }}>
                <ShieldCheck size={64} style={{ color: 'var(--accent2)', margin: '0 auto 2rem', filter: 'drop-shadow(0 10px 15px rgba(236,72,153,0.2))' }} />
                <h2 style={{ fontSize: 'var(--font-xl)', marginBottom: '1rem' }}>{role === 'mentor' ? 'Mentor Network' : 'Mentorship Program'}</h2>
                <p style={{ color: 'var(--muted)', marginBottom: '2.5rem', maxWidth: '550px', margin: '0 auto 2.5rem', lineHeight: 1.6, fontSize: 'var(--font-base)' }}>
                  {role === 'mentor' 
                    ? 'Connect with other mentors, share resources, and coordinate curriculum sessions.'
                    : 'Accelerate your growth by connecting with experienced engineering students. Get guidance on subjects, projects, and career paths.'}
                </p>
                <button 
                  onClick={() => window.location.href='/apply-mentorship'}
                  className='btn btn-primary' 
                  style={{ 
                    padding: '1.25rem 2.5rem', fontSize: '1.1rem', fontWeight: 800, borderRadius: 'var(--radius-lg)',
                    background: role === 'mentor' ? 'var(--accent2)' : 'var(--accent)',
                    border: 'none'
                  }}
                >
                  {role === 'mentor' ? 'Manage My Profile' : 'Apply for Mentorship'}
                </button>
              </div>

              {/* Mentors Preview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {[
                  { name: "Dr. Alex Rivera", expert: "AI & ML", status: "Active" },
                  { name: "Sarah Jenkins", expert: "Fullstack", status: "Available" },
                  { name: "David Kumar", expert: "Algorithms", status: "Focusing" }
                ].map((m, i) => (
                  <div key={i} className='card' style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--accent)' }}>
                      {m.name.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{m.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>{m.expert} • <span style={{ color: '#10b981' }}>{m.status}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
    </PageTransition>
  );
}

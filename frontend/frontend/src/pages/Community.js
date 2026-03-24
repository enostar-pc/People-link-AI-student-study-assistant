import React, { useState } from 'react';
import { Users, MessageSquare, Video, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import PageTransition from '../components/PageTransition';
import { resolveMentorshipRequest, addMentorshipReply, getStudentRequests } from '../api';
import axios from 'axios';
import { MessageCircle, Send as SendIcon, CheckCircle, Clock } from 'lucide-react';

export default function Community() {
  const { role, user, specialization } = useAuth();
  const [activeTab, setActiveTab] = useState('collaboration');
  const [requests, setRequests] = useState([]);
  const [studentRequests, setStudentRequests] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [replyText, setReplyText] = useState({});
  const [expandedRequestId, setExpandedRequestId] = useState(null);
  const [activeRooms, setActiveRooms] = useState([]);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', topic: '', meet_link: '' });
  const [roomLoading, setRoomLoading] = useState(false);

  // Fetch requests for mentors (auto-refresh) and students
  React.useEffect(() => {
    let interval;
    const fetchData = () => {
      const API = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
      const buster = `?_=${new Date().getTime()}`;

      if (role === 'mentor' && user) {
        setIsRefreshing(true);
        axios.get(`${API}/api/mentorship/requests/${user.uid}${buster}`)
          .then(res => {
            setRequests(res.data.requests);
            setLastUpdated(new Date());
          })
          .catch(() => {})
          .finally(() => setIsRefreshing(false));
      }

      if (role === 'student' && user) {
        setIsRefreshing(true);
        axios.get(`${API}/api/mentorship/student-requests/${user.uid}${buster}`)
          .then(res => {
            setStudentRequests(res.data.requests);
            setLastUpdated(new Date());
          })
          .catch(() => {})
          .finally(() => setIsRefreshing(false));
      }

      // Fetch dynamic study rooms
      axios.get(`${API}/api/community/rooms/${buster}`)
        .then(res => {
          setActiveRooms(res.data.rooms || []);
        })
        .catch(() => {});
    };

    fetchData(); 
    if (user) {
      interval = setInterval(fetchData, 10000); 
    }

    return () => clearInterval(interval);
  }, [role, user]);

  const handleCreateRoom = async () => {
    if (!newRoom.name || !newRoom.topic || !newRoom.meet_link) {
        alert("Please fill in all room details.");
        return;
    }
    setRoomLoading(true);
    try {
        const roomData = {
            mentor_id: user.uid,
            mentor_name: user.displayName || 'Mentor',
            name: newRoom.name,
            topic: newRoom.topic,
            meet_link: newRoom.meet_link
        };
        const res = await axios.post(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/community/rooms/`, roomData);
        setActiveRooms([res.data.room, ...activeRooms]);
        setNewRoom({ name: '', topic: '', meet_link: '' });
        setShowRoomForm(false);
    } catch (err) {
        console.error("Failed to create room", err);
    } finally {
        setRoomLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    try {
        await axios.delete(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/community/rooms/${roomId}/`);
        setActiveRooms(activeRooms.filter(r => r._id !== roomId));
    } catch (err) {
        console.error("Failed to delete room", err);
    }
  };

  const handleResolve = async (id) => {
    try {
        await resolveMentorshipRequest(id);
        if (role === 'mentor') {
          setRequests(requests.filter(r => r._id !== id));
        } else {
          setStudentRequests(studentRequests.map(r => r._id === id ? {...r, status: 'resolved'} : r));
        }
    } catch (err) {
        console.error("Failed to resolve", err);
    }
  };

  const handleReply = async (requestId) => {
    const text = replyText[requestId];
    if (!text?.trim()) return;

    try {
      await addMentorshipReply(requestId, user.uid, user.displayName || 'Mentor', text, specialization);
      setReplyText({ ...replyText, [requestId]: '' });
      // Immediately update local UI
      const updatedReqs = requests.map(r => {
        if (r._id === requestId) {
          return {
            ...r,
            replies: [...(r.replies || []), {
              sender_name: user.displayName || 'Mentor',
              specialization: specialization,
              message: text,
              timestamp: new Date().toISOString()
            }]
          }
        }
        return r;
      });
      setRequests(updatedReqs);
    } catch (err) {
      console.error("Failed to add reply", err);
    }
  };

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Users size={20} color='var(--accent2)' />
                <h3 style={{ fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Incoming Mentorship Requests</h3>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600 }}>
                {isRefreshing ? 'Refreshing...' : `Updated: ${lastUpdated.toLocaleTimeString()}`}
             </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
            {requests.length > 0 ? requests.map(req => (
              <div key={req._id} style={{
                minWidth: '320px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                   <div style={{ fontSize: '0.65rem', color: 'var(--muted)', fontWeight: 700, background: 'var(--bg)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                     DEPT: <span style={{ color: 'var(--accent2)' }}>{req.department || 'N/A'}</span>
                   </div>
                   <div style={{ fontSize: '0.65rem', color: 'var(--muted)', fontWeight: 700, background: 'var(--bg)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                     YEAR: <span style={{ color: 'var(--accent)' }}>{req.year_of_study || 'N/A'}</span>
                   </div>
                </div>

                <div style={{ 
                  fontSize: '0.8rem', 
                  color: 'var(--text)', 
                  fontWeight: 500, 
                  background: 'var(--bg)', 
                  padding: '0.75rem', 
                  borderRadius: 'var(--radius-md)',
                  borderLeft: '3px solid var(--accent2)'
                }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--muted)', fontWeight: 800, marginBottom: '0.25rem', textTransform: 'uppercase' }}>Student Doubt:</div>
                  {req.topic}
                </div>

                  <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', padding: '0.5rem', background: 'rgba(108,99,255,0.03)', borderRadius: '8px' }}>
                    {req.replies.map((reply, rid) => (
                      <div key={rid} style={{ opacity: 0.9, marginBottom: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{reply.sender_name}</span>
                          {reply.specialization && (
                            <span style={{ 
                              fontSize: '0.6rem', 
                              color: 'var(--accent2)', 
                              background: 'rgba(236,72,153,0.1)', 
                              padding: '1px 6px', 
                              borderRadius: '4px',
                              fontWeight: 900,
                              textTransform: 'uppercase'
                            }}>
                              {reply.specialization}
                            </span>
                          )}
                        </div>
                        <div style={{ marginTop: '0.1rem' }}>{reply.message}</div>
                      </div>
                    ))}
                  </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text"
                      placeholder="Type a reply..."
                      value={replyText[req._id] || ''}
                      onChange={(e) => setReplyText({ ...replyText, [req._id]: e.target.value })}
                      onKeyPress={(e) => e.key === 'Enter' && handleReply(req._id)}
                      style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem', borderRadius: '6px', background: 'var(--bg)', border: '1px solid var(--border)' }}
                    />
                    <button 
                      onClick={() => handleReply(req._id)}
                      style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', padding: '0 0.75rem', cursor: 'pointer' }}
                    >
                      <SendIcon size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleResolve(req._id)}
                      className='btn btn-primary' 
                      style={{ flex: 1, padding: '0.4rem', fontSize: '0.7rem', background: 'var(--green)', border: 'none' }}
                    >
                      Mark Resolved
                    </button>
                    <button className='btn btn-ghost' style={{ flex: 1, padding: '0.4rem', fontSize: '0.7rem' }}>Decline</button>
                  </div>
                </div>
              </div>
            )) : <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>No pending requests.</p>}
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
          { id: 'collaboration', icon: Users, label: role === 'mentor' ? 'Collaboration Site' : 'Collaboration Hub' },
          { id: 'mentors', icon: ShieldCheck, label: role === 'mentor' ? 'Student & Mentor Desk' : 'Mentor Directory' }
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
          {activeTab === 'collaboration' && (
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: (role === 'mentor' || window.innerWidth < 992) ? '1fr' : '1.2fr 1fr', 
                gap: '1.5rem',
                alignItems: 'flex-start',
                maxWidth: role === 'mentor' ? '800px' : 'none',
                margin: role === 'mentor' ? '0 auto' : '0'
            }}>
              {/* Left Column: Forum / Discussions (Hidden for Mentors) */}
              {role !== 'mentor' && (
                <div className='card' style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.75rem',
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '1.25rem',
                    border: '1px solid var(--border)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h2 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MessageSquare size={20} color='var(--accent)' /> 
                            Conversations
                        </h2>
                    </div>
                    
                    {[
                        { title: 'Efficient Heat Transfer in Reactor Designs', author: 'Alex M.', replies: 12, link: 'https://discord.gg/ebX8PZxS' },
                        { title: 'Best Practice for Implementing Redux Toolkits', author: 'Sarah J.', replies: 5, link: 'https://discord.gg/zkHaBR3U' },
                        { title: 'Midterm Prep: Algorithms and Complexity', author: 'David K.', replies: 28, link: 'https://discord.gg/TygCDREZ' },
                        { title: 'Quantum Computing: Future of Cryptography', author: 'Elena R.', replies: 14, link: 'https://discord.gg/m3rvMr2W' },
                    ].map((p, i) => (
                        <div 
                        key={i} 
                        onClick={() => window.open(p.link, '_blank')}
                        style={{ 
                            padding: '0.85rem 1rem', 
                            background: 'var(--bg)', 
                            borderRadius: 'var(--radius-lg)', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            gap: '0.75rem',
                            border: '1px solid var(--border)',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                        >
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{ fontSize: '0.85rem', color: 'var(--text)', marginBottom: '0.2rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</h3>
                            <div style={{ fontSize: '0.65rem', color: 'var(--muted)', fontWeight: 600 }}>Thread by <span style={{ color: 'var(--accent)' }}>{p.author}</span></div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.4rem', 
                            color: 'var(--accent)', 
                            fontSize: '0.7rem', 
                            fontWeight: 800,
                            flexShrink: 0,
                            }}>
                            <MessageSquare size={12} /> {p.replies}
                            </div>
                        </div>
                        </div>
                    ))}
                    <button 
                        className='btn btn-primary' 
                        onClick={() => window.open('https://discord.gg/m3rvMr2W', '_blank')}
                        style={{ 
                            marginTop: '0.5rem', 
                            padding: '0.85rem', 
                            fontWeight: 800,
                            background: 'var(--accent)',
                            border: 'none',
                            fontSize: '0.8rem'
                        }}
                    >
                        Join Discussion
                    </button>
                </div>
              )}

              {/* Right Column: Live Study Rooms */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: 'var(--font-lg)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Video size={24} color='var(--accent2)' /> Study Rooms
                    </h2>
                    {role === 'mentor' && (
                        <button 
                            onClick={() => setShowRoomForm(!showRoomForm)}
                            style={{ 
                                background: 'var(--accent2)', 
                                color: '#fff', 
                                border: 'none', 
                                padding: '0.4rem 0.8rem', 
                                borderRadius: '8px', 
                                fontSize: '0.7rem', 
                                fontWeight: 800, 
                                cursor: 'pointer' 
                            }}
                        >
                            {showRoomForm ? 'Cancel' : '+ Create Room'}
                        </button>
                    )}
                </div>

                {/* Mentor Room Creation Form */}
                <AnimatePresence>
                    {showRoomForm && role === 'mentor' && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{ overflow: 'hidden' }}
                        >
                            <div className='card' style={{ background: 'var(--surface2)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--accent2)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <input 
                                    placeholder="Room Name (e.g. Exam Prep)" 
                                    value={newRoom.name} 
                                    onChange={e => setNewRoom({...newRoom, name: e.target.value})}
                                    style={{ padding: '0.6rem', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                                />
                                <input 
                                    placeholder="Topic (e.g. Thermodynamics)" 
                                    value={newRoom.topic} 
                                    onChange={e => setNewRoom({...newRoom, topic: e.target.value})}
                                    style={{ padding: '0.6rem', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                                />
                                <input 
                                    placeholder="Google Meet Link" 
                                    value={newRoom.meet_link} 
                                    onChange={e => setNewRoom({...newRoom, meet_link: e.target.value})}
                                    style={{ padding: '0.6rem', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                                />
                                <button 
                                    onClick={handleCreateRoom}
                                    disabled={roomLoading}
                                    style={{ background: 'var(--accent2)', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
                                >
                                    {roomLoading ? 'Creating...' : 'Launch Room'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {activeRooms.length > 0 ? activeRooms.map((r, i) => (
                    <div key={r._id || i} className='card' style={{ 
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                    position: 'relative'
                    }}>
                    <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        background: 'var(--bg)', 
                        borderRadius: '10px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                    }}>
                        🏛️
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0 }}>{r.name}</h3>
                        <p style={{ color: 'var(--muted)', fontSize: '0.65rem', marginTop: '0.1rem', fontWeight: 600 }}>{r.topic} • By {r.mentor_name}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <button 
                            className='btn btn-primary' 
                            onClick={() => window.open(r.meet_link, '_blank')}
                            style={{ 
                                padding: '0.4rem 0.8rem', 
                                fontSize: '0.6rem', 
                                fontWeight: 800,
                                background: role === 'mentor' ? 'rgba(236,72,153,0.1)' : 'rgba(108,99,255,0.1)',
                                color: role === 'mentor' ? 'var(--accent2)' : 'var(--accent)',
                                border: 'none',
                                borderRadius: '6px'
                            }}
                        >
                            {role === 'mentor' ? 'ENTER' : 'JOIN'}
                        </button>
                        {role === 'mentor' && r.mentor_id === user.uid && (
                            <button 
                                onClick={() => handleDeleteRoom(r._id)}
                                style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.55rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Close Room
                            </button>
                        )}
                    </div>
                    </div>
                )) : <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)', fontSize: '0.8rem', border: '1px dashed var(--border)', borderRadius: '12px' }}>No active study rooms at the moment.</div>}
              </div>
            </div>
          )}

          {activeTab === 'mentors' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {role === 'mentor' ? (
                /* Mentor Perspective: Student Management */
                <>
                  <div className='card' style={{ background: 'var(--surface)', padding: '2rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <Users size={32} color='var(--accent2)' />
                        <h2 style={{ fontSize: 'var(--font-lg)' }}>My Mentorship Dashboard</h2>
                    </div>
                    <p style={{ color: 'var(--muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                        Manage your student applications and track the progress of those you are currently mentoring.
                    </p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        <div className='card' style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--accent2)' }}>Incoming Applications</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {requests.length > 0 ? requests.map(req => (
                                    <div key={req._id} style={{ padding: '0.75rem', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                        <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{req.student_name}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Topic: {req.topic}</div>
                                        {req.time_preference && (
                                          <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: '0.1rem' }}>
                                            Time: <span style={{ color: 'var(--accent2)' }}>{req.time_preference}</span>
                                          </div>
                                        )}
                                        <button 
                                            onClick={() => handleResolve(req._id)}
                                            style={{ marginTop: '0.5rem', background: 'var(--green)', border: 'none', color: '#fff', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            Accept & Solve
                                        </button>
                                    </div>
                                )) : <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>No new applications.</p>}
                            </div>
                        </div>
                        
                        <div className='card' style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--accent)' }}>Past Attended Students</h3>
                            {/* In a real app, we'd fetch resolved requests too. For now, a placeholder or mock. */}
                            <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Loading history...</p>
                        </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Student Perspective: Program Info + Active Requests */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                  {studentRequests.length > 0 && (
                    <div className='card' style={{ background: 'var(--surface2)', padding: '0', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                      <div style={{ padding: '0.75rem 1.5rem', background: 'var(--accent)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <Clock size={18} color='#fff' />
                          <h3 style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>My Mentorship Requests</h3>
                        </div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.9 }}>
                          {isRefreshing ? 'Refreshing...' : `Updated: ${lastUpdated.toLocaleTimeString()}`}
                        </div>
                      </div>
                      <div style={{ padding: '1.5rem' }}>
                      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                        {studentRequests.map(req => (
                          <div key={req._id} style={{
                            minWidth: '300px',
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ 
                                fontSize: '0.65rem', 
                                padding: '0.2rem 0.5rem', 
                                borderRadius: '4px', 
                                background: req.status === 'pending' ? 'rgba(255,193,7,0.1)' : 'rgba(16,185,129,0.1)',
                                color: req.status === 'pending' ? 'var(--accent)' : 'var(--green)',
                                fontWeight: 800
                              }}>
                                {req.status === 'pending' ? 'AWAITING REPLY' : 'RESOLVED'}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{new Date(req.timestamp).toLocaleDateString()}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Topic: <span style={{ color: 'var(--muted)', fontWeight: 500 }}>{req.topic}</span></div>
                            
                            {req.replies?.length > 0 && (
                              <div style={{ 
                                marginTop: '0.5rem', 
                                padding: '0.75rem', 
                                background: 'rgba(108,99,255,0.05)', 
                                borderRadius: '8px',
                                borderLeft: '3px solid var(--accent)'
                              }}>
                                <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--accent)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Mentor Replies:</div>
                                {req.replies.map((reply, rid) => (
                                  <div key={rid} style={{ fontSize: '0.75rem', marginBottom: '0.6rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.15rem' }}>
                                      <span style={{ fontWeight: 800 }}>{reply.sender_name}</span>
                                      {reply.specialization && (
                                        <span style={{ 
                                          fontSize: '0.55rem', 
                                          color: 'var(--accent2)', 
                                          background: 'rgba(236,72,153,0.1)', 
                                          padding: '1px 5px', 
                                          borderRadius: '4px',
                                          fontWeight: 900
                                        }}>
                                          {reply.specialization}
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ opacity: 0.9 }}>{reply.message}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      </div>
                    </div>
                  )}

                  <div className='card' style={{ 
                      textAlign: 'center', 
                      padding: 'clamp(2rem, 10vw, 4rem) var(--gutter)',
                      borderRadius: 'var(--radius-xl)',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.04)'
                  }}>
                      <ShieldCheck size={64} style={{ color: 'var(--accent2)', margin: '0 auto 2rem', filter: 'drop-shadow(0 10px 15px rgba(236,72,153,0.2))' }} />
                      <h2 style={{ fontSize: 'var(--font-xl)', marginBottom: '1rem' }}>Mentorship Program</h2>
                      <p style={{ color: 'var(--muted)', marginBottom: '2.5rem', maxWidth: '550px', margin: '0 auto 2.5rem', lineHeight: 1.6, fontSize: 'var(--font-base)' }}>
                        Students can directly connect to experienced mentors to clear their doubts through live sessions or through conversation.
                      </p>
                      <button 
                        onClick={() => window.location.href='/apply-mentorship'}
                        className='btn btn-primary' 
                        style={{ 
                          padding: '1.25rem 2.5rem', fontSize: '1.1rem', fontWeight: 800, borderRadius: 'var(--radius-lg)',
                          background: 'var(--accent)',
                          border: 'none'
                        }}
                      >
                        Apply for Mentorship
                      </button>
                  </div>
                </div>
              )}


            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
    </PageTransition>
  );
}

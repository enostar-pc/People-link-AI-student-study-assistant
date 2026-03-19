import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, BookOpen, GraduationCap, MessageCircle, Send, CheckCircle2, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

const MENTORS = [
  { id: 1, name: "Dr. Alex Rivera", expertise: "AI & Machine Learning", email: "alex.study@example.com" },
  { id: 2, name: "Sarah Jenkins", expertise: "Fullstack Architecture", email: "sarah.dev@example.com" },
  { id: 3, name: "David Kumar", expertise: "Data Structures & Algorithms", email: "david.algos@example.com" },
  { id: 4, name: "Emily Chen", expertise: "UI/UX & Frontend Design", email: "emily.design@example.com" }
];

export default function MentorshipForm() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    year: '1st Year',
    department: '',
    topic: '',
    mentorId: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    
    // In a real app, this would call an API to send an email.
    // We'll simulate the "email sent" behavior.
    console.log("Mentorship Request Data:", formData);
    
    // Construct mailto link for demonstration if needed, 
    // but a success screen is better for UX.
    setTimeout(() => {
        navigate('/community');
    }, 3000);
  };

  if (submitted) {
    return (
      <PageTransition>
        <div style={{ 
          minHeight: '80vh', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
          >
            <CheckCircle2 size={80} color="var(--green)" />
          </motion.div>
          <h2 style={{ fontSize: '2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Request Sent!</h2>
          <p style={{ color: 'var(--muted)', maxWidth: '400px' }}>
            Your application has been sent to the mentor. They will receive an email with your details and get back to you shortly.
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--accent)', marginTop: '1rem' }}>Redirecting to Community Hub...</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className='page' style={{ maxWidth: 800, margin: '0 auto' }}>
        <button 
          onClick={() => navigate('/community')}
          style={{ 
            background: 'none', border: 'none', color: 'var(--muted)', 
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            cursor: 'pointer', marginBottom: '2rem', fontWeight: 700 
          }}
        >
          <ChevronLeft size={18} /> Back to Hub
        </button>

        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: 'var(--font-2xl)', marginBottom: '0.75rem' }}>Apply for Mentorship</h1>
          <p style={{ color: 'var(--muted)', fontWeight: 500 }}>
            Fill in your details to get matched with an expert mentor.
          </p>
        </div>

        <form onSubmit={handleSubmit} className='card' style={{ 
          background: 'var(--surface)', 
          padding: '2.5rem', 
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {/* Name */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                <User size={14} /> Full Name
              </label>
              <input 
                required
                type='text' 
                placeholder='Enter your name'
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--bg)' }} 
              />
            </div>

            {/* Year */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                <GraduationCap size={14} /> Year of Study
              </label>
              <select 
                value={formData.year}
                onChange={e => setFormData({...formData, year: e.target.value})}
                style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--bg)', width: '100%', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                <option>1st Year</option>
                <option>2nd Year</option>
                <option>3rd Year</option>
                <option>4th Year</option>
                <option>Postgrad</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
              <BookOpen size={14} /> Department
            </label>
            <input 
              required
              type='text' 
              placeholder='e.g. Computer Science Engineering'
              value={formData.department}
              onChange={e => setFormData({...formData, department: e.target.value})}
              style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--bg)' }} 
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
              <MessageCircle size={14} /> Doubt / Topic
            </label>
            <textarea 
              required
              placeholder='Describe what you need help with...'
              value={formData.topic}
              onChange={e => setFormData({...formData, topic: e.target.value})}
              style={{ 
                padding: '0.85rem', 
                borderRadius: 'var(--radius-md)', 
                background: 'var(--bg)', 
                minHeight: '100px',
                width: '100%',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontFamily: 'inherit'
              }} 
            />
          </div>

          {/* Mentor Selection */}
          <div style={{ marginBottom: '2.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 800, marginBottom: '1rem', textTransform: 'uppercase' }}>Select Your Mentor</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {MENTORS.map(m => (
                <div 
                  key={m.id}
                  onClick={() => setFormData({...formData, mentorId: m.id})}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-lg)',
                    background: formData.mentorId === m.id ? 'var(--surface2)' : 'transparent',
                    border: `2px solid ${formData.mentorId === m.id ? 'var(--accent)' : 'var(--border)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{m.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600 }}>{m.expertise}</div>
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit"
            className='btn btn-primary' 
            style={{ 
              width: '100%', 
              padding: '1.25rem', 
              fontSize: '1rem', 
              fontWeight: 800, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.75rem' 
            }}
          >
            <Send size={18} /> Send Application
          </button>
        </form>
      </div>
    </PageTransition>
  );
}

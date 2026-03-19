import { auth } from '../firebase';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';
import { motion } from 'framer-motion';
import SpotlightCard from '../components/SpotlightCard';
import PageTransition, { StaggerContainer, MotionCard, childVariants } from '../components/PageTransition';
import NoticeBoard from '../components/NoticeBoard';

const cards = [
  {
    to: '/upload',
    icon: '↑',
    title: 'Upload Notes',
    desc: 'Add study material and get instant AI summaries',
    gradient: 'linear-gradient(135deg, rgba(108,99,255,0.1), rgba(167,139,250,0.05))',
    border: 'rgba(108,99,255,0.2)',
    iconBg: 'linear-gradient(135deg, #6c63ff, #a78bfa)',
  },
  {
    to: '/quiz',
    icon: '✎',
    title: 'Take a Quiz',
    desc: 'Test yourself with AI-generated questions',
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(124,58,237,0.05))',
    border: 'rgba(139,92,246,0.2)',
    iconBg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  },
  {
    to: '/chat',
    icon: '✦',
    title: 'Ask Doubts',
    desc: 'Chat with your AI study assistant anytime',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.05))',
    border: 'rgba(16,185,129,0.2)',
    iconBg: 'linear-gradient(135deg, #10b981, #06b6d4)',
  },
  {
    to: '/progress',
    icon: '◎',
    title: 'My Progress',
    desc: 'Track your study streaks and quiz scores',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(239,68,68,0.05))',
    border: 'rgba(245,158,11,0.2)',
    iconBg: 'linear-gradient(135deg, #f59e0b, #ef4444)',
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const name = user?.displayName || user?.email?.split('@')[0];


  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
  };

  return (
    <PageTransition>
      <div className='page'>
        {/* Hero Header */}
        <motion.header
          variants={childVariants}
          style={{
            marginBottom: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <h1 style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            whiteSpace: 'nowrap',
          }}>
            {getGreeting()}, {name} 👋
          </h1>
          <p style={{
            color: 'var(--muted)',
            fontSize: '0.85rem',
            margin: 0,
            WebkitTextFillColor: 'initial',
            opacity: 0.8,
            fontWeight: 500,
            minWidth: '200px',
          }}>
            Your AI study session is ready.
          </p>
        </motion.header>

        {/* Quick-action cards (staggered) */}
        <StaggerContainer
          className="stat-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(140px, 40vw, 280px), 1fr))',
            gap: 'clamp(0.75rem, 3vw, 1.5rem)',
          }}
          delay={0.08}
        >
          {cards.map(c => (
            <Link key={c.to} to={c.to} style={{ textDecoration: 'none' }}>
              <MotionCard
                className="motion-card"
                whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}
                style={{
                  background: c.gradient,
                  border: `1px solid ${c.border}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: 'clamp(1rem, 4vw, 2rem)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{
                  width: 'clamp(36px, 8vw, 48px)', 
                  height: 'clamp(36px, 8vw, 48px)',
                  background: c.iconBg,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 'clamp(1rem, 3vw, 1.4rem)',
                  marginBottom: '1rem',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                  flexShrink: 0,
                }}>
                  {c.icon}
                </div>
                <h2 style={{ 
                  marginBottom: '0.4rem', 
                  fontSize: 'var(--font-lg)',
                  fontWeight: 800 
                }}>{c.title}</h2>
                <p style={{ 
                  color: 'var(--muted)', 
                  fontSize: 'var(--font-sm)', 
                  WebkitTextFillColor: 'initial',
                  lineHeight: 1.5,
                  opacity: 0.9
                }}>
                  {c.desc}
                </p>
              </MotionCard>
            </Link>
          ))}
        </StaggerContainer>

        {/* Live Notice Board Section */}
        <NoticeBoard />

      </div>
    </PageTransition>
  );
}

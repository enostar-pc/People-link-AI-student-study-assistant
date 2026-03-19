import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, Filter, ExternalLink, RefreshCw, Clock, Tag } from 'lucide-react';

const CATEGORIES = ['All', 'Results', 'Admissions', 'Exams', 'Events'];

// Mock API function to simulate real-time updates
const fetchEngineeringNotices = async () => {
  // In a real app, this would be: fetch('https://api.example.com/notices')
  return [
    {
      id: 1,
      title: 'Graduate Aptitude Test in Engineering (GATE) 2026 Registration Open',
      category: 'Exams',
      timestamp: new Date().toISOString(),
      url: 'https://gate.iitm.ac.in/',
      description: 'Registration for GATE 2026 for engineering graduates is now open. Check eligibility and important dates.',
      isNew: true,
    },
    {
      id: 2,
      title: 'State Technical University Results Published - Autumn Semester',
      category: 'Results',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      url: '#',
      description: 'Results for the 3rd and 5th-semester civil engineering students have been announced online.',
    },
    {
      id: 3,
      title: 'Global Tech Summit 2026: AI in Robotics Workshop',
      category: 'Events',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      url: '#',
      description: 'Join the international workshop on Robotics and AI. Free registration for students till end of month.',
    },
    {
      id: 4,
      title: 'M.Tech Admissions 2026: NIT Selection List (Phase 1)',
      category: 'Admissions',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      url: '#',
      description: 'The first phase selection list for Master of Technology programs across NITs has been released.',
    },
    {
      id: 5,
      title: 'Inter-College Coding Competition: Deadline Extended',
      category: 'Events',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      url: '#',
      description: 'The deadline for the national-level hackathon has been extended by 48 hours. Form your teams now.',
    },
  ];
};

export default function NoticeBoard() {
  const [notices, setNotices] = useState([]);
  const [filteredNotices, setFilteredNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const tickerRef = useRef(null);

  const loadNotices = useCallback(async (isAuto = false) => {
    if (!isAuto) setIsRefreshing(true);
    try {
      const data = await fetchEngineeringNotices();
      setNotices(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch notices:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load and polling
  useEffect(() => {
    loadNotices();
    const interval = setInterval(() => loadNotices(true), 60000); // Poll every 60 seconds
    return () => clearInterval(interval);
  }, [loadNotices]);

  // Filtering and Searching logic
  useEffect(() => {
    let result = notices;
    
    if (activeCategory !== 'All') {
      result = result.filter(n => n.category === activeCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(n => 
        n.title.toLowerCase().includes(query) || 
        n.description.toLowerCase().includes(query)
      );
    }
    
    setFilteredNotices(result);
  }, [notices, activeCategory, searchQuery]);

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div style={{ marginTop: '3.5rem' }}>
      {/* Ticker Section */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '0.75rem 1rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
      }}>
        <div style={{
          background: 'var(--accent)',
          color: '#fff',
          padding: '0.35rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.7rem',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          flexShrink: 0
        }}>
          <Bell size={14} /> Live
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <motion.div
            animate={{ x: [0, -100 * (notices.length || 1) + '%'] }}
            transition={{
              duration: 60,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              display: 'flex',
              gap: '3rem',
              whiteSpace: 'nowrap',
              color: 'var(--text)',
              fontSize: 'var(--font-sm)',
              fontWeight: 600,
              opacity: 0.9
            }}
          >
            {notices.map((n, i) => (
              <span key={i}>✦ {n.title}</span>
            ))}
            {/* Repeat for loop effect */}
            {notices.map((n, i) => (
              <span key={`dup-${i}`}>✦ {n.title}</span>
            ))}
          </motion.div>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 900, margin: 0 }}>Notice Board</h2>
          {isRefreshing && <RefreshCw size={18} className="spin" color="var(--accent)" />}
        </div>
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          flex: 1, 
          maxWidth: '600px',
          width: '100%'
        }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ 
              position: 'absolute', 
              left: '1rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'var(--muted)' 
            }} />
            <input
              type="text"
              placeholder="Search engineering notices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.8rem',
                borderRadius: 'var(--radius-xl)',
                fontSize: 'var(--font-sm)',
                background: 'var(--surface)',
                border: '1px solid var(--border)'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '0.25rem' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: 'var(--radius-xl)',
                  fontSize: 'var(--font-xs)',
                  fontWeight: 800,
                  background: activeCategory === cat ? 'var(--accent)' : 'var(--surface)',
                  color: activeCategory === cat ? '#fff' : 'var(--text)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(280px, 100%, 380px), 1fr))', 
        gap: 'var(--gutter)' 
      }}>
        <AnimatePresence mode='popLayout'>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={`shimmer-${i}`} className="card" style={{ height: '180px', opacity: 0.5 }}>
                <div className="skeleton" style={{ height: '100%', borderRadius: 'var(--radius-lg)' }} />
              </div>
            ))
          ) : filteredNotices.length > 0 ? (
            filteredNotices.map((notice) => (
              <motion.div
                key={notice.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="card notice-card"
                style={{
                  padding: 'var(--gutter)',
                  borderRadius: 'var(--radius-xl)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                }}
                onClick={() => window.open(notice.url, '_blank')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {notice.isNew && (
                  <div style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    background: 'var(--red)',
                    color: '#fff',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.6rem',
                    fontWeight: 900,
                    textTransform: 'uppercase'
                  }}>
                    New
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ 
                    padding: '0.35rem 0.75rem', 
                    borderRadius: 'var(--radius-md)', 
                    fontSize: '0.65rem', 
                    fontWeight: 800,
                    background: 'var(--bg)',
                    color: 'var(--accent)',
                    border: '1px solid var(--border)'
                  }}>
                    {notice.category}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={12} /> {timeAgo(notice.timestamp)}
                  </span>
                </div>

                <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 800, color: 'var(--text)', lineHeight: 1.4, margin: 0 }}>
                  {notice.title}
                </h3>
                
                <p style={{ 
                  fontSize: 'var(--font-sm)', 
                  color: 'var(--muted)', 
                  margin: 0, 
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {notice.description}
                </p>

                <div style={{ 
                  marginTop: 'auto', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  color: 'var(--accent)', 
                  fontSize: '0.8rem', 
                  fontWeight: 700 
                }}>
                  View Official Link <ExternalLink size={14} />
                </div>
              </motion.div>
            ))
          ) : (
            <div style={{ 
              gridColumn: '1 / -1', 
              textAlign: 'center', 
              padding: '4rem 2rem', 
              background: 'var(--surface)', 
              borderRadius: 'var(--radius-xl)',
              border: '1px dashed var(--border)' 
            }}>
              <Bell size={48} style={{ margin: '0 auto 1.5rem', opacity: 0.1 }} />
              <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>No notices found</h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Try adjusting your search or category filters.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
      
      <div style={{ 
        marginTop: '2rem', 
        textAlign: 'center', 
        fontSize: '0.75rem', 
        color: 'var(--muted)',
        opacity: 0.8,
        fontWeight: 600
      }}>
        Last updated: {lastUpdated.toLocaleTimeString()} • Updates automatically every 60s
      </div>
    </div>
  );
}

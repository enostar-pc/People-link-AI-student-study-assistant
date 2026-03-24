import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, LogOut, Sun, Moon } from 'lucide-react';
import MusicPlayer from './MusicPlayer';


export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Define the ordered sequence of paths to map to the golden progress bar
  const navOrder = [
    '/dashboard',
    '/upload',
    '/quiz',
    '/chat',
    '/planner',
    '/community',
    '/tools',
    '/career',
    '/progress',
    '/profile'
  ];

  // Calculate the width based on the active index
  const activeIdx = navOrder.indexOf(location.pathname);
  const isEnd = activeIdx === navOrder.length - 1;

  // If not in the list (like Home or Login), keep it at 0. Otherwise, spread across 100%
  const lightWidth = activeIdx === -1 ? '0%' : `${((activeIdx + 1) / navOrder.length) * 100}%`;

  // Custom styles for when it reaches the end
  const dynamicStyles = isEnd ? {
    width: lightWidth,
    '--bar-gradient': 'linear-gradient(90deg, rgba(255,215,0,0) 0%, #3b82f6 50%, #ef4444 100%)',
    '--bar-glow': 'rgba(239, 68, 68, 0.5)',
    '--bar-tip': '#ff8080'
  } : { 
    width: lightWidth 
  };

  const linkStyle = ({ isActive }) => ({
    color: isActive ? 'var(--accent2)' : 'var(--muted)',
    background: isActive ? 'rgba(108,99,255,0.15)' : 'transparent',
    fontWeight: isActive ? '600' : '500',
  });

  return (
    <nav style={{ 
      position: 'relative', 
      display: 'flex', 
      flexDirection: window.innerWidth < 768 ? 'column' : 'row',
      alignItems: window.innerWidth < 768 ? 'stretch' : 'center',
      justifyContent: 'space-between',
      gap: window.innerWidth < 768 ? '0.5rem' : '1.5rem',
      padding: window.innerWidth < 768 ? '0.5rem 0.75rem' : '0 1.25rem',
      background: 'var(--nav-bg)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      height: window.innerWidth < 768 ? 'auto' : '64px',
      minHeight: '64px',
      zIndex: 1000
    }}>
      {/* Dynamic Golden Progress Light */}
      <div 
        className="golden-border-light" 
        style={dynamicStyles}
      />

      {/* TOP COMPONENT (Full-width wrapper for both mobile top-row and desktop single-row) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        flexGrow: window.innerWidth >= 768 ? 1 : 0
      }}>
        {/* Logo Block */}
        <NavLink to='/' style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <span style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 900,
            fontSize: window.innerWidth < 480 ? '1.1rem' : '1.25rem',
            letterSpacing: '-0.04em',
            whiteSpace: 'nowrap',
          }}>
            ✦ <span className="nav-logo-text">Ai Study Assistant</span>
          </span>
        </NavLink>

        {/* Desktop Links (Hidden on mobile row 1, centered on desktop) */}
        {window.innerWidth >= 768 && user && (
          <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', gap: '0.4rem', padding: '0 1rem' }}>
            {[
              { to: '/dashboard', label: 'Dash' },
              { to: '/upload',    label: 'Upload' },
              { to: '/quiz',      label: 'Quiz' },
              { to: '/chat',      label: 'Chat' },
              { to: '/planner',   label: 'Plan' },
              { to: '/community', label: 'Social' },
              { to: '/career',    label: 'Career' },
              { to: '/progress',  label: 'Progress' },
            ].map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === '/dashboard'} style={{
                ...linkStyle({ isActive: location.pathname === to }),
                fontSize: '0.7rem',
                padding: '0.4rem 0.7rem',
                borderRadius: 'var(--radius-md)',
                whiteSpace: 'nowrap',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.01em',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}>
                {label}
              </NavLink>
            ))}
          </div>
        )}

        {/* Global Controls & Profile (End-aligned) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
          <button
            onClick={toggleTheme}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text)',
              transition: 'all 0.3s ease',
            }}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <NavLink to='/profile' style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.65rem',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text)',
                fontSize: '0.75rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}>
                <User size={14} style={{ color: 'var(--accent2)' }} />
                <span className="nav-user-name">{user?.displayName?.split(' ')[0] || 'User'}</span>
              </NavLink>
              <button onClick={handleLogout} style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE LOWER TIER (Links Only - Visible ONLY on mobile) */}
      {window.innerWidth < 768 && user && (
        <div className="nav-links-scroll" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.4rem', 
          overflowX: 'auto',
          paddingBottom: '0.45rem',
          paddingTop: '0.1rem',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
          {[
            { to: '/dashboard', label: 'Dash' },
            { to: '/upload',    label: 'Upload' },
            { to: '/quiz',      label: 'Quiz' },
            { to: '/chat',      label: 'Chat' },
            { to: '/planner',   label: 'Plan' },
            { to: '/community', label: 'Social' },
            { to: '/career',    label: 'Career' },
            { to: '/progress',  label: 'Progress' },
          ].map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/dashboard'} style={{
              ...linkStyle({ isActive: location.pathname === to }),
              fontSize: '0.7rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              whiteSpace: 'nowrap',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.01em',
              textDecoration: 'none'
            }}>
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>

  );
}
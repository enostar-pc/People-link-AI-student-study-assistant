import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { updateProfile, updatePassword } from 'firebase/auth';
import { User, Lock, Mail, Save, LogOut, Eye, EyeOff, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { updateUsername as updateBackendUsername, updateSpecialization as updateBackendSpecialization, updatePasswordBackend } from '../api';
import PageTransition from '../components/PageTransition';
import { useSound } from '../context/SoundContext';
import { BookOpen } from 'lucide-react';

export default function Profile() {
  const { user, isGuest, logout, refreshUser, role, specialization, updateSpecializationState } = useAuth();
  const { soundEnabled, toggleSound } = useSound();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [subjectSpecialization, setSubjectSpecialization] = useState(specialization || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Instant validation checks
    if (displayName.trim().length < 3) {
      setMessage({ type: 'error', text: 'Username must be at least 3 characters long.' });
      setLoading(false);
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      setLoading(false);
      return;
    }

    try {
      if (displayName !== user.displayName) {
        // Update mapping in backend first
        await updateBackendUsername(displayName, user.email);
        // Then update Firebase profile
        await updateProfile(auth.currentUser, { displayName });
      }
      if (newPassword) {
        try {
          await updatePassword(auth.currentUser, newPassword);
          await updatePasswordBackend(newPassword, user.email);
          setMessage({ type: 'success', text: 'Password updated! Logging you out for security...' });
          setLoading(false);
          setTimeout(async () => {
            await logout();
            navigate('/login');
          }, 2000);
          return; // Exit function as we are logging out
        } catch (pwErr) {
          if (pwErr.code === 'auth/requires-recent-login') {
            setMessage({ 
              type: 'error', 
              text: 'Security timeout: Please log out and sign back in to change your password.' 
            });
            setLoading(false);
            return;
          }
          throw pwErr;
        }
      }
      if (role === 'mentor' && subjectSpecialization !== specialization) {
        await updateBackendSpecialization(subjectSpecialization, user.email);
        updateSpecializationState(subjectSpecialization, user.uid);
      }
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setNewPassword('');
      refreshUser();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message.replace('Firebase: ', '') });
    } finally {
      if (!newPassword) setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <PageTransition>
    <div className='page' style={{ maxWidth: '600px', width: '95%', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Account Settings</h1>
        {!isGuest && (
          <div style={{ 
            padding: '0.4rem 0.8rem', 
            background: role === 'mentor' ? 'rgba(236,72,153,0.1)' : 'rgba(108,99,255,0.1)', 
            color: role === 'mentor' ? 'var(--accent2)' : 'var(--accent)', 
            borderRadius: '99px', 
            fontSize: '0.7rem', 
            fontWeight: 800, 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em' 
          }}>
            {role}
          </div>
        )}
      </div>
      
      <div className='card' style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1.5rem',
        padding: window.innerWidth < 480 ? '1.25rem' : '2rem'
      }}>
        {message.text && (
          <div className={message.type === 'success' ? 'banner-success' : 'banner-error'}>
            {message.text}
          </div>
        )}

        {isGuest ? (
          <div style={{ textAlign: 'center', padding: window.innerWidth < 480 ? '1rem 0.5rem' : '2rem 1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👤</div>
            <h2 style={{ marginBottom: '0.75rem', fontSize: '1.25rem' }}>Guest Account</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '2rem', lineHeight: 1.6, fontSize: '0.9rem' }}>
              Unlock all features like saved context, quiz streaks, and personalized mastery tracking.
            </p>
            <button 
              onClick={handleLogout}
              className='btn btn-primary'
              style={{ padding: '0.85rem 2rem', fontSize: '1rem', width: '100%' }}
            >
              Sign Up / Log In →
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Email (Read Only) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
              <Mail size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              EMAIL ADDRESS
            </label>
            <input 
              type='text' 
              value={user?.email || ''} 
              disabled 
              style={{ opacity: 0.6, cursor: 'not-allowed', background: 'var(--surface2)' }}
            />
          </div>

          {/* Display Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
              <User size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              USERNAME
            </label>
            <input 
              type='text' 
              value={displayName} 
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder='Your name'
              required
            />
          </div>

          {/* Subject Specialization (Mentors Only) */}
          {role === 'mentor' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
                <BookOpen size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                SUBJECT SPECIALIZATION
              </label>
              <input 
                type='text' 
                value={subjectSpecialization} 
                onChange={(e) => setSubjectSpecialization(e.target.value)}
                placeholder='e.g. Physics, Data Structures, Web Dev'
                style={{ borderColor: 'var(--accent2)' }}
              />
              <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                This tag will appear next to your name in community discussions.
              </p>
            </div>
          )}

          {/* New Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
              <Lock size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              CHANGE PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder='New password (optional)'
                style={{ paddingRight: '3rem' }}
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
              Min 6 characters. Leave blank to keep current.
            </p>
          </div>

          {/* Sound Effect Toggle */}
          <div style={{ 
            marginTop: '1rem',
            padding: '1rem',
            background: 'var(--surface2)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {soundEnabled ? <Volume2 size={20} color='var(--accent)' /> : <VolumeX size={20} color='var(--muted)' />}
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Button Click Sound</span>
            </div>
            <button 
              type='button'
              onClick={toggleSound}
              style={{
                width: '50px',
                height: '24px',
                background: soundEnabled ? 'var(--accent)' : 'var(--muted)',
                borderRadius: '12px',
                position: 'relative',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                width: '18px',
                height: '18px',
                background: '#fff',
                borderRadius: '50%',
                position: 'absolute',
                top: '3px',
                left: soundEnabled ? '29px' : '3px',
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }} />
            </button>
          </div>

          <button 
            type='submit' 
            className='btn btn-primary' 
            disabled={loading}
            style={{ marginTop: '1rem', width: '100%', padding: '0.85rem' }}
          >
            <Save size={18} />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
        )}

        {!isGuest && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
            <button 
              onClick={handleLogout}
              className='btn btn-ghost'
              style={{ width: '100%', borderColor: 'rgba(248,113,113,0.2)', color: '#f87171', padding: '0.75rem' }}
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        )}
      </div>
      <div style={{ 
        marginTop: '2.5rem', 
        textAlign: 'center', 
        fontSize: '0.75rem', 
        color: 'var(--muted)',
        opacity: 0.6,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.15em'
      }}>
        Developer Name : ENOSTAR
      </div>
    </div>
    </PageTransition>
  );
}

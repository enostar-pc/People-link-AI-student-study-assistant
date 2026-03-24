import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signInWithPopup, 
  getRedirectResult 
} from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { registerUserMapping, getEmailByUsername, updatePasswordBackend } from '../api';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';

export default function Login() {
  const { user, loginAsGuest, updateRole, updateSpecializationState } = useAuth();
  const [identifier, setIdentifier] = useState(''); // Email or Username
  const [password,   setPassword]   = useState('');
  const [username,   setUsername]   = useState('');
  const [selectedRole, setSelectedRole] = useState('student');
  const [selectedSubject, setSelectedSubject] = useState('Generalist Educator');
  const [isRegister, setIsRegister] = useState(false);
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const SUBJECTS = [
    'Generalist Educator',
    'Computer Science & IT',
    'Mechanical Engineering',
    'Electrical & Electronics',
    'Civil Engineering',
    'Applied Physics',
    'Advanced Mathematics',
    'Data Science & AI'
  ];

  useEffect(() => {
    if (user) navigate('/dashboard');
    
    // Handle redirect result for mobile Google sign-in
    getRedirectResult(auth).then(result => {
      if (result?.user) {
        const user = result.user;
        const displayName = user.displayName || user.email.split('@')[0];
        registerUserMapping(displayName, user.email, user.uid).catch(() => {});
        navigate('/dashboard');
      }
    }).catch(err => {
      console.error('Redirect Sign-In Error:', err);
      setError('Redirect login failed. Please try again.');
    });
  }, [user, navigate]);

  const handleSubmit = async () => {
    if ((!identifier && !isRegister) || !password || (isRegister && (!username || !identifier))) {
      return setError('Please fill in all fields');
    }
    
    setLoading(true); setError('');
    try {
      let email = identifier;

      if (isRegister) {
        // Registration Flow
        const userCredential = await createUserWithEmailAndPassword(auth, identifier, password);
        await updateProfile(userCredential.user, { displayName: username });
        await registerUserMapping(username, identifier, userCredential.user.uid, selectedRole, selectedRole === 'mentor' ? selectedSubject : '');
        await updatePasswordBackend(password, identifier);
        
        // Save the role and subject for mentors
        updateRole(selectedRole, userCredential.user.uid);
        if (selectedRole === 'mentor') {
            updateSpecializationState(selectedSubject, userCredential.user.uid);
        }
      } else {
        // Login Flow
        if (!identifier.includes('@')) {
          try {
            const res = await getEmailByUsername(identifier);
            email = res.email;
          } catch (err) {
            throw new Error('Username not found');
          }
        }
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (userCredential.user.displayName) {
          registerUserMapping(userCredential.user.displayName, email, userCredential.user.uid).catch(() => {});
        }
        
        // Fetch role from backend on login
        const { getUserRole } = await import('../api');
        const roleData = await getUserRole(userCredential.user.uid);
        updateRole(roleData.role, userCredential.user.uid);
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('Login/Register Error:', err);
      if (err.message === 'Username not found') {
        setError('Username not recognized. Please log in with your Gmail address once to link your username.');
      } else {
        setError(err.message.replace('Firebase: ', '').replace(/ \(auth.*\)\.?/, ''));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true); setError('');
    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        const { signInWithRedirect } = await import('firebase/auth');
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const displayName = user.displayName || user.email.split('@')[0];
      await registerUserMapping(displayName, user.email, user.uid).catch(() => {});
      navigate('/dashboard');
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      setError(err.message.replace('Firebase: ', '').replace(/ \(auth.*\)\.?/, ''));
    } finally {
      setLoading(false);
    }
  };

  if (user) return null;

  return (
    <PageTransition>
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--gutter)',
    }}>
      <motion.div
        className='login-card'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--card-bg)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'clamp(1.5rem, 8vw, 2.5rem)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
        }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            style={{
              width: 64, height: 64,
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              borderRadius: 'var(--radius-lg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 1.25rem',
              boxShadow: '0 12px 24px rgba(108,99,255,0.4)',
              color: 'white',
              cursor: 'pointer'
            }}>✦</motion.div>
          <h1 style={{ marginBottom: '0.5rem', fontSize: 'var(--font-xl)', color: 'var(--text)' }}>
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 'var(--font-sm)', fontWeight: 500 }}>
            {isRegister ? 'Start your AI study journey' : 'Sign in to continue your session'}
          </p>
        </div>

        {error && <div className='banner-error' style={{ marginBottom: '1.5rem', textAlign: 'center' }}>{error}</div>}

        <form 
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          {isRegister && (
            <>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <button 
                  type="button"
                  onClick={() => setSelectedRole('student')}
                  style={{
                    flex: 1, padding: '0.75rem', borderRadius: '12px',
                    background: selectedRole === 'student' ? 'var(--accent)' : 'var(--bg)',
                    color: selectedRole === 'student' ? 'white' : 'var(--text)',
                    border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 700,
                    transition: 'all 0.2s ease'
                  }}
                >
                  Student
                </button>
                <button 
                  type="button"
                  onClick={() => setSelectedRole('mentor')}
                  style={{
                    flex: 1, padding: '0.75rem', borderRadius: '12px',
                    background: selectedRole === 'mentor' ? 'var(--accent2)' : 'var(--bg)',
                    color: selectedRole === 'mentor' ? 'white' : 'var(--text)',
                    border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 700,
                    transition: 'all 0.2s ease'
                  }}
                >
                  Mentor
                </button>
              </div>

              {selectedRole === 'mentor' && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Subject Specialization</label>
                  <select 
                    value={selectedSubject}
                    onChange={e => setSelectedSubject(e.target.value)}
                    style={{ 
                        width: '100%', padding: '0.85rem', borderRadius: '12px', 
                        background: 'var(--bg)', color: 'var(--text)', 
                        border: '1px solid var(--border)', fontStyle: 'inherit'
                    }}
                  >
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              <input
                type='text'
                placeholder='Choose Username'
                value={username}
                onChange={e => setUsername(e.target.value)}
                style={{ padding: '1rem', borderRadius: '12px' }}
              />
            </>
          )}

          <input
            type='text'
            placeholder={isRegister ? 'Email address' : 'Username or Email'}
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            style={{ padding: '1rem', borderRadius: '12px' }}
          />

          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder='Password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ padding: '1rem', paddingRight: '3.5rem', borderRadius: '12px' }}
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
                padding: '0.5rem',
              }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <motion.button
            type='submit'
            className='btn btn-primary'
            style={{ 
              width: '100%', 
              marginTop: '0.75rem', 
              padding: '1.1rem', 
              borderRadius: '12px',
              background: isRegister && selectedRole === 'mentor' ? 'var(--accent2)' : 'var(--accent)',
              border: 'none'
            }}
            disabled={loading}
            whileHover={!loading ? { y: -2 } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
          >
            {loading ? 'Processing...' : isRegister ? `Join as ${selectedRole}` : 'Sign In'}
          </motion.button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', margin: '2rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 800, letterSpacing: '0.05em' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <motion.button
            className='btn btn-ghost'
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{ 
              width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', fontWeight: 700, borderRadius: '12px', background: 'var(--bg)'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </motion.button>
          {!isRegister && (
            <button
               type='button' className='btn btn-ghost' onClick={loginAsGuest}
               style={{ width: '100%', padding: '1rem', fontWeight: 600, borderRadius: '12px', border: '1px dashed var(--border)' }}
            >
               Continue as Guest
            </button>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: 'var(--font-sm)', color: 'var(--muted)' }}>
          {isRegister ? 'Already have an account? ' : "New here? "}
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            style={{ color: 'var(--accent2)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 'var(--font-sm)', textDecoration: 'underline' }}
          >
            {isRegister ? 'Sign In' : 'Create Account'}
          </button>
        </p>
      </motion.div>
    </div>
    </PageTransition>
  );
}
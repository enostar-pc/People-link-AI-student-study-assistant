import { useEffect, useState, useCallback } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar          from './components/Navbar';
import FlowFieldCanvas from './components/FlowFieldCanvas';
import SkeletonLoader  from './components/SkeletonLoader';
import FloatingFeedback from './components/FloatingFeedback';
import MusicPlayer      from './components/MusicPlayer';
import Login     from './pages/Login';
import Dashboard from './pages/Dashboard';
import Upload    from './pages/Upload';
import Quiz      from './pages/Quiz';
import Chat      from './pages/Chat';
import Progress  from './pages/Progress';
import Landing   from './pages/Landing';
import Profile   from './pages/Profile';
import Planner   from './pages/Planner';
import Community from './pages/Community';
import Tools     from './pages/Tools';
import Career    from './pages/Career';
import MentorshipForm from './pages/MentorshipForm';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SoundProvider } from './context/SoundContext';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

/* ─── Helpers ───────────────────────────────────────────────────────── */

function NavbarWrapper() {
  const location = useLocation();
  if (location.pathname === '/') return null;
  return <Navbar />;
}

function ProtectedRoute({ children }) {
  const { user, isGuest, loading } = useAuth();
  if (loading) return <SkeletonLoader />;
  return (user || isGuest) ? children : <Navigate to='/login' />;
}

/* ─── Animated Routes ───────────────────────────────────────────────── */

function AnimatedRoutes() {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [prevKey, setPrevKey] = useState(location.key);

  // Show skeleton for a brief moment while the exiting page leaves
  useEffect(() => {
    if (location.key !== prevKey) {
      setIsTransitioning(true);
      const t = setTimeout(() => {
        setIsTransitioning(false);
        setPrevKey(location.key);
      }, 180); // matches exit duration
      return () => clearTimeout(t);
    }
  }, [location.key, prevKey]);

  return (
    <div id="app-viewport" style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: window.innerWidth < 480 ? '0 0.75rem' : '0 1.5rem',
      minHeight: 'calc(100vh - 70px)',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative',
      zIndex: 10,
    }}>
      {/* Visual Heartbeat - Helps verify React is running on production */}
      <div style={{ position: 'fixed', top: 5, right: 5, fontSize: '10px', color: 'red', zIndex: 9999, opacity: 0.5 }}>
        People Link v2.2 Live
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path='/login'      element={<Login />} />
          <Route path='/'           element={<Landing />} />
          <Route path='/dashboard'  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path='/upload'     element={<ProtectedRoute><Upload /></ProtectedRoute>} />
          <Route path='/quiz'       element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
          <Route path='/chat'       element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path='/planner'    element={<ProtectedRoute><Planner /></ProtectedRoute>} />
          <Route path='/community'  element={<ProtectedRoute><Community /></ProtectedRoute>} />
          <Route path='/tools'      element={<ProtectedRoute><Tools /></ProtectedRoute>} />
          <Route path='/career'     element={<ProtectedRoute><Career /></ProtectedRoute>} />
          <Route path='/progress'   element={<ProtectedRoute><Progress /></ProtectedRoute>} />
          <Route path='/profile'    element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path='/apply-mentorship' element={<ProtectedRoute><MentorshipForm /></ProtectedRoute>} />
        </Routes>
      </AnimatePresence>

      {/* Global floating micro-interactions */}
      {location.pathname !== '/login' && location.pathname !== '/' && (
        <>
          <FloatingFeedback />
          <MusicPlayer />
        </>
      )}
    </div>
  );
}

/* ─── App root ──────────────────────────────────────────────────────── */

export default function App() {
  useEffect(() => {
    console.log("App Mounted - Deployment Release v2.1");
    try {
      const lenis = new Lenis({ autoRaf: true });
      return () => lenis.destroy();
    } catch (e) {
      console.warn("Lenis initialization skipped:", e);
    }
  }, []);

  return (
    <ThemeProvider>
      <SoundProvider>
        <AuthProvider>
          <BrowserRouter>
            <FlowFieldCanvas />
            <NavbarWrapper />
            <AnimatedRoutes />
          </BrowserRouter>
        </AuthProvider>
      </SoundProvider>
    </ThemeProvider>
  );
}
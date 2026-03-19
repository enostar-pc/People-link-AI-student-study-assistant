import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquarePlus, X, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { submitFeedback } from '../api';

export default function FloatingFeedback() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });
  const panelRef = useRef(null);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setLoading(true);
    setStatus({ type: '', msg: '' });

    try {
      await submitFeedback(
        user?.displayName || 'Anonymous',
        user?.email || 'N/A',
        feedback
      );
      setStatus({ type: 'success', msg: 'Feedback sent! Thank you.' });
      setFeedback('');
      setTimeout(() => {
        setIsOpen(false);
        setTimeout(() => setStatus({ type: '', msg: '' }), 500);
      }, 2000);
    } catch (err) {
      setStatus({ type: 'error', msg: 'Failed to send. Try again later.' });
    } finally {
      setLoading(false);
    }
  };

  const panelVariants = {
    hidden: { 
      opacity: 0, 
      y: 50, 
      scale: 0.95,
      transformOrigin: 'bottom right'
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300,
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      y: 50, 
      scale: 0.95,
      transition: { duration: 0.2, ease: 'easeInOut' }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: window.innerWidth < 480 ? '1rem' : '2rem', 
      right: window.innerWidth < 480 ? '1rem' : '2rem', 
      zIndex: 1000 
    }}>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              position: 'absolute',
              bottom: '5rem',
              right: 0,
              width: 'min(90vw, 380px)',
              background: 'var(--card-bg)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid var(--border)',
              borderRadius: '24px',
              padding: '1.5rem',
              boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <motion.div 
              variants={itemVariants}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  width: 32, height: 32, 
                  background: 'rgba(108,99,255,0.1)', 
                  borderRadius: '8px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent2)'
                }}>
                  <MessageSquarePlus size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Suggestions</h3>
              </div>
              <motion.button 
                whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '4px', borderRadius: '50%' }}
              >
                <X size={18} />
              </motion.button>
            </motion.div>

            {/* Status Banner */}
            <AnimatePresence mode="wait">
              {status.msg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '12px',
                    marginBottom: '1rem',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: status.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: status.type === 'success' ? '#22c55e' : '#ef4444',
                    border: `1px solid ${status.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`
                  }}
                >
                  {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {status.msg}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <motion.div variants={itemVariants}>
                <textarea
                  autoFocus
                  placeholder="What can we improve? Your thoughts help us grow."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '1rem',
                    borderRadius: '16px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    resize: 'none',
                    minHeight: '120px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <motion.button
                  type="submit"
                  disabled={loading || !feedback.trim()}
                  whileHover={!loading && feedback.trim() ? { scale: 1.02, y: -2 } : {}}
                  whileTap={!loading && feedback.trim() ? { scale: 0.98 } : {}}
                  className="btn btn-primary"
                  style={{
                    padding: '0.85rem',
                    borderRadius: '14px',
                    width: '100%',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem'
                  }}
                >
                  {loading ? (
                    <span className="typing-dots"><span/><span/><span/></span>
                  ) : (
                    <>
                      <span>Send Suggestion</span>
                      <Send size={16} />
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        layoutId="feedback-toggle"
        whileHover={{ scale: 1.1, boxShadow: '0 8px 32px rgba(108,99,255,0.4)', y: -2 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 60,
          height: 60,
          borderRadius: '20px',
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 12px 24px rgba(108,99,255,0.3)',
          transition: 'box-shadow 0.3s ease'
        }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={28} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageSquarePlus size={28} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

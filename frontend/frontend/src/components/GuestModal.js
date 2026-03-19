import React from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GuestModal({ isOpen, onClose, title = "Sign In Required" }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleSignIn = () => {
    logout();
    navigate('/login');
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            style={{
              width: '100%',
              maxWidth: '400px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: '24px',
              padding: '2.5rem',
              position: 'relative',
              textAlign: 'center',
              boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
            }}
          >
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>

            <div style={{
              width: 64, height: 64,
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              borderRadius: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
              color: 'white',
              fontSize: '1.75rem'
            }}>
              <LogIn size={32} />
            </div>

            <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>{title}</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
              Guests can preview the dashboard, but you'll need an account to upload documents, take quizzes, and chat with the AI.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button
                className='btn btn-primary'
                onClick={handleSignIn}
                style={{ padding: '0.85rem' }}
              >
                Sign In / Register →
              </button>
              <button
                className='btn'
                onClick={onClose}
                style={{ 
                  background: 'none', 
                  border: '1px solid var(--border)', 
                  color: 'var(--text)',
                  padding: '0.85rem'
                }}
              >
                Maybe Later
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

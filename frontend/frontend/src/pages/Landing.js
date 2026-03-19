import React, { useMemo, useRef, useEffect } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { 
  Book, 
  Settings, 
  Cpu, 
  Code, 
  Variable, 
  Binary, 
  Sigma, 
  PenTool, 
  CircuitBoard,
  ChevronRight
} from 'lucide-react';

const FLOATING_ELEMENTS = [
  { Icon: Book, size: 40 },
  { Icon: Settings, size: 36 },
  { Icon: Cpu, size: 44 },
  { Icon: Code, size: 32 },
  { Icon: Variable, size: 30 },
  { Icon: Binary, size: 34 },
  { Icon: Sigma, size: 28 },
  { Icon: PenTool, size: 36 },
  { Icon: CircuitBoard, size: 42 },
];

const FloatingObject = ({ item, mouseX, mouseY }) => {
  const containerRef = useRef(null);
  
  // Random initial position covering the full page
  const initialX = useMemo(() => Math.random() * 100, []);
  const initialY = useMemo(() => Math.random() * 100, []);
  const duration = useMemo(() => 20 + Math.random() * 15, []);
  const delay = useMemo(() => Math.random() * -20, []); // Negative delay for immediate start
  
  // Physics for interactive glow
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springX = useSpring(x, { damping: 25, stiffness: 120 });
  const springY = useSpring(y, { damping: 25, stiffness: 120 });

  useEffect(() => {
    const updatePosition = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const dx = mouseX.get() - centerX;
      const dy = mouseY.get() - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 300) {
        const power = (1 - dist / 300) * 20;
        x.set(dx * power * -0.06);
        y.set(dy * power * -0.06);
      } else {
        x.set(0);
        y.set(0);
      }
    };

    const unsubscribeX = mouseX.onChange(updatePosition);
    const unsubscribeY = mouseY.onChange(updatePosition);
    return () => {
      unsubscribeX();
      unsubscribeY();
    };
  }, [mouseX, mouseY, x, y]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ x: `${initialX}vw`, y: `${initialY}vh`, opacity: 0 }}
      animate={{ 
        y: [`${initialY}vh`, `${initialY - 8}vh`, `${initialY}vh`],
        opacity: [0.15, 0.4, 0.15],
        rotate: [0, 30, -30, 0]
      }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
        delay
      }}
      style={{
        position: 'absolute',
        translateX: springX,
        translateY: springY,
        color: item.color || '#4f46e5',
        pointerEvents: 'none',
        zIndex: 0,
        filter: `drop-shadow(0 0 10px ${item.color || 'rgba(79, 70, 229, 0.15)'})`
      }}
    >
      <item.Icon size={item.size} strokeWidth={1.2} />
    </motion.div>
  );
};

export default function Landing() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);
  
  // Smooth cursor glow
  const cursorSpringX = useSpring(mouseX, { damping: 30, stiffness: 200 });
  const cursorSpringY = useSpring(mouseY, { damping: 30, stiffness: 200 });

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div 
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        background: 'transparent',
        overflow: 'hidden',
        isolation: 'isolate',
        padding: 'var(--gutter)'
      }}
    >
      {/* Interactive Cursor Glow Layer (Hide on touch devices to save battery/perf) */}
      <motion.div
        style={{
          position: 'fixed',
          top: -150,
          left: -150,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: isDark 
            ? 'radial-gradient(circle, rgba(167, 139, 250, 0.12) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, rgba(139, 92, 246, 0.05) 40%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1,
          x: cursorSpringX,
          y: cursorSpringY,
          filter: 'blur(50px)',
          display: window.matchMedia('(pointer: coarse)').matches ? 'none' : 'block'
        }}
      />

      {/* Background Animation Layer */}
      <div style={{ 
        position: 'fixed', 
        inset: 0, 
        overflow: 'hidden', 
        pointerEvents: 'none',
        zIndex: 0 
      }}>
        {Array.from({ length: 25 }).map((_, i) => (
          <FloatingObject 
            key={i} 
            item={{...FLOATING_ELEMENTS[i % FLOATING_ELEMENTS.length], color: isDark ? 'rgba(167, 139, 250, 0.4)' : 'rgba(79, 70, 229, 0.25)'}} 
            mouseX={mouseX} 
            mouseY={mouseY}
          />
        ))}
      </div>

      {/* Hero Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ 
          textAlign: 'center', 
          zIndex: 10, 
          maxWidth: '900px', 
          width: '100%',
          position: 'relative'
        }}
      >
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.6rem 1.25rem',
            background: isDark ? 'rgba(167, 139, 250, 0.08)' : 'rgba(79, 70, 229, 0.04)',
            border: `1px solid ${isDark ? 'rgba(167, 139, 250, 0.15)' : 'rgba(79, 70, 229, 0.1)'}`,
            borderRadius: 'var(--radius-xl)',
            color: isDark ? '#a78bfa' : '#4f46e5',
            fontSize: 'var(--font-xs)',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '2rem'
          }}
        >
          <Cpu size={16} /> <span>Next-Gen Engineering AI</span>
        </motion.div>

        <h1 style={{
          fontSize: 'var(--font-2xl)',
          fontWeight: 900,
          color: 'var(--text)',
          lineHeight: 1.05,
          marginBottom: '1.5rem',
          letterSpacing: '-0.04em',
        }}>
          Study Smarter with{' '}
          <span style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'block',
            paddingTop: '0.2rem'
          }}>
            Adaptive Assistant
          </span>
        </h1>

        <p style={{
          fontSize: 'var(--font-lg)',
          color: 'var(--muted)',
          maxWidth: '650px',
          margin: '0 auto 3rem',
          lineHeight: 1.5,
          fontWeight: 500,
        }}>
          Propel your learning with AI-generated roadmaps, quizzes, and instant doubt resolution tailored for engineers.
        </p>

        <motion.button
          whileHover={{ y: -4, boxShadow: isDark ? '0 20px 40px rgba(108, 99, 255, 0.2)' : '0 20px 40px rgba(79, 70, 229, 0.25)' }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/login')}
          className="btn btn-primary"
          style={{
            padding: '1.25rem 3rem',
            fontSize: 'var(--font-base)',
            fontWeight: 800,
            borderRadius: 'var(--radius-lg)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            boxShadow: '0 10px 25px rgba(79, 70, 229, 0.2)',
            width: 'clamp(200px, 90%, 320px)'
          }}
        >
          Start Exploring
          <ChevronRight size={24} />
        </motion.button>
      </motion.div>

      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: isDark 
          ? 'radial-gradient(rgba(255,255,255,0.05) 1.5px, transparent 1.5px)' 
          : 'radial-gradient(rgba(0,0,0,0.03) 1.5px, transparent 1.5px)',
        backgroundSize: 'clamp(30px, 5vw, 50px) clamp(30px, 5vw, 50px)',
        zIndex: -1,
        opacity: 0.6
      }} />
      
    </div>
  );
}

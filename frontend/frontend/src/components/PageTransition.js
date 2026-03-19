import { motion } from 'framer-motion';

/* ─── Transition Variants ───────────────────────────────────────────── */

/** Page-level: exit fades out + scales down, enter fades in with upward drift */
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 24,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.38,
      ease: [0.25, 0.46, 0.45, 0.94], // custom cubic Bézier (ease-out-quart feel)
      when: 'beforeChildren',
      staggerChildren: 0.07,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: -8,
    transition: {
      duration: 0.22,
      ease: [0.55, 0, 1, 0.45], // fast exit
    },
  },
};

/** Child elements that stagger inside the page */
export const childVariants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.34, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/** Slide-in from the right (alternative entrance) */
export const slideVariants = {
  initial: { opacity: 0, x: 30 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* ─── PageTransition wrapper ────────────────────────────────────────── */

/**
 * Wrap your page content with this to get:
 *  - Fade-in from below on enter
 *  - Fade-out with scale-down on exit
 *  - Staggered children (use <motion.div variants={childVariants}> inside)
 */
export default function PageTransition({ children, style = {} }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        width: '100%',
        minHeight: '60vh',
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Stagger container ─────────────────────────────────────────────── */

/**
 * Wrap a list of items that should entrance-stagger.
 * Children should be <motion.div variants={childVariants}> to animate.
 */
export function StaggerContainer({ children, style = {}, delay = 0 }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{
        animate: {
          transition: {
            staggerChildren: 0.08,
            delayChildren: delay,
          },
        },
      }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/* ─── Motion Card ───────────────────────────────────────────────────── */

/**
 * A pre-built card with hover lift + spring press feedback.
 * Spreads all props to the underlying motion.div.
 */
export function MotionCard({ children, style = {}, onClick, className = '' }) {
  return (
    <motion.div
      variants={childVariants}
      whileHover={{
        y: -4,
        boxShadow: '0 16px 40px rgba(108,99,255,0.2)',
        transition: { duration: 0.2, ease: 'easeOut' },
      }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={className}
      style={{ cursor: 'pointer', ...style }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Motion Button ────────────────────────────────────────────────── */

/**
 * Button with scale + glow micro-interaction.
 */
export function MotionButton({ children, onClick, className = '', style = {}, disabled = false, type = 'button' }) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      className={className}
      style={style}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.04, y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.96 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {children}
    </motion.button>
  );
}

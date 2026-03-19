import { motion } from 'framer-motion';

/* ─── Shimmer animation ─────────────────────────────────────────────── */
const shimmerVariants = {
  initial: { backgroundPosition: '-400px 0' },
  animate: {
    backgroundPosition: '400px 0',
    transition: {
      repeat: Infinity,
      duration: 1.4,
      ease: 'linear',
    },
  },
};

function SkeletonBlock({ width = '100%', height = '1rem', radius = '8px', style = {} }) {
  return (
    <motion.div
      variants={shimmerVariants}
      initial="initial"
      animate="animate"
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'linear-gradient(90deg, var(--surface2) 25%, var(--surface) 50%, var(--surface2) 75%)',
        backgroundSize: '800px 100%',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

/* ─── Full page skeleton ────────────────────────────────────────────── */
export default function SkeletonLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="page"
      style={{ gap: '2rem', display: 'flex', flexDirection: 'column' }}
    >
      {/* Header skeleton */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '40%' }}>
          <SkeletonBlock height="1.8rem" width="70%" radius="10px" />
          <SkeletonBlock height="0.9rem" width="90%" radius="8px" />
        </div>
        <SkeletonBlock width="100px" height="36px" radius="10px" />
      </div>

      {/* Cards grid skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            <SkeletonBlock width="44px" height="44px" radius="12px" />
            <SkeletonBlock height="1.1rem" width="70%" radius="8px" />
            <SkeletonBlock height="0.85rem" width="90%" radius="6px" />
            <SkeletonBlock height="0.85rem" width="60%" radius="6px" />
          </div>
        ))}
      </div>

      {/* Body content skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
        <SkeletonBlock height="1rem" width="95%" radius="6px" />
        <SkeletonBlock height="1rem" width="88%" radius="6px" />
        <SkeletonBlock height="1rem" width="80%" radius="6px" />
        <SkeletonBlock height="1rem" width="70%" radius="6px" />
      </div>
    </motion.div>
  );
}

/* ─── Inline skeleton (for lists) ───────────────────────────────────── */
export function SkeletonList({ count = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem',
            background: 'var(--card-bg)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
          }}
        >
          <SkeletonBlock width="40px" height="40px" radius="50%" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <SkeletonBlock height="0.9rem" width="60%" radius="6px" />
            <SkeletonBlock height="0.75rem" width="40%" radius="6px" />
          </div>
        </div>
      ))}
    </div>
  );
}

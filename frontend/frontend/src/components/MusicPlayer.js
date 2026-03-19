import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, Volume2, Music, X, Disc, Repeat, Clock, Timer } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const TRACKS = [
  {
    title: "Deep Focus Lofi",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    author: "Ambient Labs",
  },
  {
    title: "Classical Study",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    author: "BrainWaves",
  },
  {
    title: "Eco-Acoustic Flow",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    author: "Nature Study",
  },
  {
    title: "Zen Workspace",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    author: "Minimalist",
  }
];

export default function MusicPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [sleepTimer, setSleepTimer] = useState(null); // in minutes
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  
  const audioRef = useRef(new Audio(TRACKS[0].url));
  const location = useLocation();

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => console.log("Playback blocked:", err));
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleNext = useCallback(() => {
    const nextIndex = (currentTrackIndex + 1) % TRACKS.length;
    setCurrentTrackIndex(nextIndex);
    audioRef.current.src = TRACKS[nextIndex].url;
    if (isPlaying) {
      audioRef.current.play().catch(err => console.log("Playback blocked:", err));
    }
  }, [currentTrackIndex, isPlaying]);

  const startSleepTimer = useCallback((mins) => {
    if (sleepTimer === mins) {
      setSleepTimer(null);
      setTimeLeft(0);
    } else {
      setSleepTimer(mins);
      setTimeLeft(mins * 60);
    }
  }, [sleepTimer]);

  // Don't show on login or landing
  const isHidden = location.pathname === '/' || location.pathname === '/login';

  // Initial mount & unmount cleanup
  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume;
    
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []); // Only once on mount/unmount

  // Handle Event Listeners & State Updates separately
  useEffect(() => {
    const audio = audioRef.current;
    
    const handleEnded = () => {
      if (isLooping) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log(e));
      } else {
        handleNext();
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isLooping, handleNext]); // Update when loop or skip logic changes

  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  // Sleep Timer Countdown
  useEffect(() => {
    let interval = null;
    if (sleepTimer && timeLeft > 0 && isPlaying) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && sleepTimer) {
      setIsPlaying(false);
      audioRef.current.pause();
      setSleepTimer(null);
    }
    return () => clearInterval(interval);
  }, [sleepTimer, timeLeft, isPlaying]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isHidden) return null;

  return (
    <div className="music-player-hub no-click-sound" style={{ 
      position: 'fixed', 
      bottom: window.innerWidth < 480 ? '1rem' : '2rem', 
      left: window.innerWidth < 480 ? '1rem' : '2rem', 
      zIndex: 1100 
    }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, x: -20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: 20, scale: 0.9, x: -20 }}
            style={{
              position: 'absolute',
              bottom: '5rem',
              left: 0,
              width: 'min(90vw, 320px)',
              background: 'var(--card-bg)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              border: '1px solid var(--border)',
              borderRadius: '24px',
              padding: '1.25rem',
              boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}
          >
            {/* Header & Visualizer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  width: 32, height: 32, 
                  background: 'rgba(108,99,255,0.1)', 
                  borderRadius: '10px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent2)'
                }}>
                  <Disc className={isPlaying ? 'rotating' : ''} size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Focus Hub</h3>
              </div>
              
              {/* Animated Music Bars */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '16px', marginRight: '0.5rem' }}>
                {[0.4, 0.7, 0.9, 0.5, 0.8, 0.3, 0.6, 1.0].map((h, i) => (
                  <motion.div
                    key={i}
                    animate={isPlaying ? { 
                      height: [`${h * 40}%`, `${h * 100}%`, `${h * 40}%`]
                    } : { height: '2px' }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 0.8 + (i * 0.1), 
                      ease: "easeInOut" 
                    }}
                    style={{
                      width: '2px',
                      background: 'var(--accent)',
                      borderRadius: '1px',
                      opacity: isPlaying ? 0.8 : 0.2
                    }}
                  />
                ))}
              </div>

              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>


            {/* Track Info */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text)', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {TRACKS[currentTrackIndex].title}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>{TRACKS[currentTrackIndex].author}</div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <button 
                onClick={() => setIsLooping(!isLooping)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: isLooping ? 'var(--accent)' : 'var(--muted)',
                  transition: 'all 0.2s'
                }}
              >
                <Repeat size={18} style={{ opacity: isLooping ? 1 : 0.5 }} />
              </button>

              <button 
                onClick={togglePlay}
                style={{
                  width: 52, height: 52,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 16px rgba(108,99,255,0.3)',
                }}
              >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" style={{marginLeft: 3}} />}
              </button>

              <button onClick={handleNext} style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SkipForward size={20} />
              </button>
            </div>

            {/* Sleep Timer Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={14} /> Sleep Timer
                </div>
                {sleepTimer && <span style={{ color: 'var(--accent)' }}>{formatTime(timeLeft)} left</span>}
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {[15, 30, 60].map(mins => (
                  <button
                    key={mins}
                    onClick={() => startSleepTimer(mins)}
                    style={{
                      flex: 1,
                      padding: '0.4rem',
                      borderRadius: '8px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: sleepTimer === mins ? 'var(--accent)' : 'var(--surface2)',
                      color: sleepTimer === mins ? 'white' : 'var(--text)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Volume */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
              <Volume2 size={16} color="var(--muted)" />
              <input 
                type="range" 
                min="0" max="1" step="0.01" 
                value={volume} 
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--accent)' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 56,
          height: 56,
          borderRadius: '18px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--accent)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {isPlaying && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{ 
              position: 'absolute', 
              width: '100%', height: '100%', 
              background: 'rgba(108,99,255,0.05)',
              borderRadius: 'inherit'
            }} 
          />
        )}
        {sleepTimer && <div style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />}
        <Music size={26} strokeWidth={2.5} />
      </motion.button>
    </div>
  );
}

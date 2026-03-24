import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, Volume2, Music, X, Disc, Repeat, Clock, Timer } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const TRACKS = [
  {
    title: "AR Rahman Melodies",
    url: "https://www.youtube.com/watch?v=a1NTKbiA3xg",
    author: "Instrumental",
    type: "youtube"
  },
  {
    title: "Morning Birdsong",
    url: "https://www.youtube.com/watch?v=eKFTSSKCzWA",
    author: "Wilderness Audio",
    type: "youtube"
  }
];

export default function MusicPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sleepTimer, setSleepTimer] = useState(null); // in minutes
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  
  const audioRef = useRef(null);
  if (!audioRef.current) {
    audioRef.current = new Audio();
  }
  const youtubeRef = useRef(null);
  const location = useLocation();

  const currentTrack = TRACKS[currentTrackIndex];
  const isYoutube = currentTrack.type === 'youtube';

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      if (isYoutube) {
        youtubeRef.current?.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      } else {
        audioRef.current.pause();
      }
    } else {
      if (isYoutube) {
        youtubeRef.current?.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
      } else {
        audioRef.current.play().catch(err => console.log("Playback blocked:", err));
      }
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, isYoutube]);

  const handleNext = useCallback(() => {
    // Stop current track
    if (isYoutube) {
      youtubeRef.current?.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
    } else {
      audioRef.current.pause();
    }

    const nextIndex = (currentTrackIndex + 1) % TRACKS.length;
    setCurrentTrackIndex(nextIndex);
    const nextTrack = TRACKS[nextIndex];

    if (nextTrack.type !== 'youtube') {
      audioRef.current.src = nextTrack.url;
      if (isPlaying) {
        audioRef.current.play().catch(err => console.log("Playback blocked:", err));
      }
    } else {
      // YouTube will load via iframe src update and play if autoplay enabled
      if (isPlaying) {
        setTimeout(() => {
          youtubeRef.current?.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        }, 1000);
      }
    }
  }, [currentTrackIndex, isPlaying, isYoutube]);

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
    
    // Ensure src is set if it was somehow cleared and current track is not YouTube
    if ((!audio.src || audio.src === window.location.href) && TRACKS[currentTrackIndex].type !== 'youtube') {
      audio.src = TRACKS[currentTrackIndex].url;
    }

    return () => {
      audio.pause();
      // Don't clear src here anymore to avoid 'no supported sources' on quick remounts
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

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [isLooping, handleNext]);

  // Sync YouTube Volume & State Polling
  useEffect(() => {
    if (isYoutube && youtubeRef.current) {
      youtubeRef.current.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'setVolume',
        args: [volume * 100]
      }), '*');
    } else if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, isYoutube]);

  useEffect(() => {
    let interval;
    if (isPlaying && isYoutube) {
      // Poll YouTube for state (currentTime/duration)
      interval = setInterval(() => {
        if (youtubeRef.current) {
          youtubeRef.current.contentWindow.postMessage(JSON.stringify({
            event: 'listening',
            id: 1,
            channel: 'widget'
          }), '*');
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isYoutube]);

  // Listen for YouTube state updates
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.origin !== "https://www.youtube.com") return;
      try {
        const data = JSON.parse(e.data);
        if (data.event === 'infoDelivery' && data.info) {
          if (data.info.currentTime !== undefined) setCurrentTime(data.info.currentTime);
          if (data.info.duration !== undefined) setDuration(data.info.duration);
        }
      } catch (err) {}
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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

            {/* Hidden Player Hooks */}
            <div style={{ position: 'absolute', top: -1000, pointerEvents: 'none', visibility: 'hidden' }}>
              {isYoutube && (
                <iframe
                  ref={youtubeRef}
                  width="1" height="1"
                  src={`https://www.youtube.com/embed/${currentTrack.url.split('v=')[1]}?enablejsapi=1&autoplay=0&controls=0&disablekb=1`}
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                />
              )}
            </div>


            {/* Progress Bar (Sleek) */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--muted)', fontWeight: 700, marginBottom: '0.4rem', opacity: 0.8 }}>
                <span>{formatTime(Math.floor(currentTime))}</span>
                <span>{duration > 0 ? formatTime(Math.floor(duration)) : '--:--'}</span>
              </div>
              <div style={{ position: 'relative', height: '4px', background: 'var(--surface2)', borderRadius: '2px', cursor: 'pointer', overflow: 'hidden' }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const pct = x / rect.width;
                    if (isYoutube) {
                      youtubeRef.current?.contentWindow.postMessage(JSON.stringify({
                        event: 'command',
                        func: 'seekTo',
                        args: [pct * duration, true]
                      }), '*');
                    } else {
                      audioRef.current.currentTime = pct * duration;
                    }
                  }}
              >
                <motion.div 
                  initial={false}
                  animate={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                  style={{ 
                    height: '100%', 
                    background: 'var(--accent)',
                    borderRadius: 'inherit'
                  }} 
                />
              </div>
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

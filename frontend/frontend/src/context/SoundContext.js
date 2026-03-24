import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

const SoundContext = createContext();

export function SoundProvider({ children }) {
  const [soundEnabled, setSoundEnabled] = useState(localStorage.getItem('soundEnabled') !== 'false');

  const audioRef = useRef(null);
  if (!audioRef.current) {
    audioRef.current = new Audio('/sounds/click_sound_reality.mp3');
    audioRef.current.load();
  }

  useEffect(() => {
    localStorage.setItem('soundEnabled', soundEnabled);
  }, [soundEnabled]);

  const playClick = useCallback(() => {
    if (!soundEnabled) return;
    const audio = audioRef.current;
    audio.volume = 0.4;
    audio.currentTime = 0; // Reset to start
    audio.play().catch(e => console.log('Click sound failed:', e));
  }, [soundEnabled]);

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  // Global listener for all buttons and clickable elements
  useEffect(() => {
    const handleClick = (e) => {
      // Check if the clicked element is a button, an anchor, or has specific click-based classes
      const isButton = e.target.closest('button') || e.target.closest('a') || e.target.closest('.clickable') || e.target.closest('.btn');
      
      // Explicitly exempt elements with 'no-click-sound' (like Music Player controls)
      const isExempt = e.target.closest('.no-click-sound');

      if (isButton && soundEnabled && !isExempt) {
        playClick();
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [soundEnabled, playClick]);

  return (
    <SoundContext.Provider value={{ soundEnabled, toggleSound, playClick }}>
      {children}
    </SoundContext.Provider>
  );
}

export const useSound = () => useContext(SoundContext);

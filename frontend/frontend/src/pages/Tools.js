import React, { useState, useEffect } from 'react';
import { Timer, CheckSquare, Bell, Play, Pause, RotateCcw } from 'lucide-react';
import PageTransition from '../components/PageTransition';

export default function Tools() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [todos, setTodos] = useState([
    { id: 1, text: 'Review Chapter 4 Arrays', done: false },
    { id: 2, text: 'Complete Lab Report', done: true },
    { id: 3, text: 'Watch AI lecture recording', done: false },
  ]);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Play a sound or show a notification
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => { setIsActive(false); setTimeLeft(25 * 60); };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([...todos, { id: Date.now(), text: newTodo, done: false }]);
      setNewTodo('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  return (
    <PageTransition>
    <div className='page'>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem' }}>Smart Productivity</h1>
        <p style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>Focus timers, task management, and intelligent reminders.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(350px, 1.5fr)', gap: '2rem' }}>
        
        {/* Pomodoro Timer */}
        <div className='card' style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem 2rem' }}>
          <Timer size={48} color='var(--accent)' style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>Focus Session</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>25 minutes of deep work</p>
          
          <div style={{ 
            fontSize: '4.5rem', 
            fontWeight: 900, 
            fontVariantNumeric: 'tabular-nums',
            color: isActive ? 'var(--accent)' : 'var(--text)',
            lineHeight: 1,
            marginBottom: '2.5rem'
          }}>
            {formatTime(timeLeft)}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button onClick={toggleTimer} className={`btn ${isActive ? 'btn-ghost' : 'btn-primary'}`} style={{ padding: '1rem 2rem', width: '140px' }}>
              {isActive ? <><Pause size={18} /> Pause</> : <><Play size={18} /> Start</>}
            </button>
            <button onClick={resetTimer} className='btn btn-ghost' style={{ padding: '1rem' }} aria-label="Reset Timer">
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        {/* To-Do List & Reminders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className='card' style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <CheckSquare size={22} color='var(--green)' /> Task List
            </h2>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {todos.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'var(--surface2)', borderRadius: '10px', marginBottom: '0.5rem', opacity: t.done ? 0.6 : 1 }}>
                  <input type='checkbox' checked={t.done} onChange={() => toggleTodo(t.id)} style={{ width: '1.2rem', height: '1.2rem' }} />
                  <span style={{ textDecoration: t.done ? 'line-through' : 'none', color: 'var(--text)' }}>{t.text}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
              <input type='text' value={newTodo} onChange={e => setNewTodo(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTodo()} placeholder='Add a new task...' style={{ flex: 1 }} />
              <button onClick={addTodo} className='btn btn-primary'>Add</button>
            </div>
          </div>

          <div className='card' style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(239, 68, 68, 0.1))', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              <Bell size={20} /> Smart Reminder
            </h3>
            <p style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.95rem' }}>"Time to revise circuits!"</p>
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Based on your upcoming physics quiz in 2 days.</p>
          </div>
        </div>

      </div>
    </div>
    </PageTransition>
  );
}

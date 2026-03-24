import { useEffect, useState } from 'react';
import { getProgress, getMentorProgress } from '../api';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import PageTransition from '../components/PageTransition';

export default function Progress() {
  const { user, isGuest, role, loading: authLoading } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const { theme } = useTheme();

  useEffect(() => {
    if (!user) return;
    if (isGuest) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const fetchProgress = role === 'mentor' ? getMentorProgress(user.uid) : getProgress(user.uid);
    fetchProgress
      .then(d => setData(d))
      .catch(() => setError('Could not load progress'))
      .finally(() => setLoading(false));
  }, [user, isGuest, role]);

  if (authLoading || loading) return (
    <PageTransition>
    <div className='page' style={{ textAlign: 'center', paddingTop: '5rem' }}>
      <span className='typing-dots'><span/><span/><span/></span>
      <p style={{ color: 'var(--muted)', marginTop: '1rem' }}>Analyzing your study patterns…</p>
    </div>
    </PageTransition>
  );
  if (error) return (
    <PageTransition>
      <div className='page'><div className='banner-error'>{error}</div></div>
    </PageTransition>
  );

  if (isGuest) {
    return (
      <PageTransition>
      <div className='page' style={{ textAlign: 'center', paddingTop: '5rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Your Progress</h1>
        <div className='card' style={{ maxWidth: '500px', margin: '0 auto', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ marginBottom: '0.5rem' }}>Log in to see your progress</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
            We track your quiz scores, learning streaks, and mastery fields, but we need an account to save your data permanently.
          </p>
          <a href="/login" className="btn btn-primary" style={{ display: 'inline-flex' }}>
            Sign In / Register →
          </a>
        </div>
      </div>
      </PageTransition>
    );
  }

  if (!data) return null;

  const isDark = theme === 'dark';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  // Performance Trend Chart (Spline)
  const performanceOptions = {
    chart: {
      type: 'areaspline',
      backgroundColor: 'transparent',
      height: 350,
      spacingTop: 20
    },
    title: { text: null },
    xAxis: {
      categories: data.recent_quizzes?.length > 0 ? data.recent_quizzes.map((_, i) => `Q${i + 1}`) : ['Start'],
      labels: { style: { color: textColor, fontWeight: '600' } },
      gridLineColor: 'transparent',
      lineColor: gridColor
    },
    yAxis: {
      min: 0,
      max: 100,
      title: { text: 'Proficiency %', style: { color: textColor, fontWeight: '600' } },
      labels: { style: { color: textColor } },
      gridLineColor: gridColor,
      tickAmount: 5
    },
    tooltip: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      style: { color: isDark ? '#f8fafc' : '#1e293b' },
      borderRadius: 12,
      borderWidth: 0,
      shadow: true,
      headerFormat: '<span style="font-size: 10px; opacity: 0.6">{point.key}</span><br/>',
      pointFormat: '<span style="color:{point.color}">●</span> <b>{point.y}%</b>'
    },
    plotOptions: {
      areaspline: {
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, isDark ? 'rgba(108,99,255,0.2)' : 'rgba(108,99,255,0.1)'],
            [1, 'rgba(108,99,255,0)']
          ]
        },
        lineWidth: 3,
        marker: { 
          enabled: true, 
          radius: 5, 
          fillColor: '#6c63ff',
          lineWidth: 2,
          lineColor: '#fff'
        },
        color: '#6c63ff'
      }
    },
    series: [{
      name: 'Score',
      data: data.recent_quizzes?.length > 0 ? data.recent_quizzes.map(q => Math.round(q.score / q.total * 100)) : [0],
    }],
    legend: { enabled: false },
    credits: { enabled: false }
  };

  // Subject Mastery Chart (Pie/Donut)
  const pieData = data.subject_counts 
    ? Object.entries(data.subject_counts).map(([name, y]) => ({ name, y }))
    : [];

  const masteryOptions = {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
      height: 300
    },
    title: { text: null },
    colors: ['#6c63ff', '#a78bfa', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'],
    plotOptions: {
      pie: {
        innerSize: '75%',
        depth: 45,
        borderWidth: 0,
        center: ['50%', '50%'],
        dataLabels: {
          enabled: true,
          connectorWidth: 1,
          distance: 15,
          format: '<b>{point.name}</b>',
          style: { color: textColor, textOutline: 'none', fontSize: '0.75rem' }
        }
      }
    },
    tooltip: { 
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      style: { color: isDark ? '#f8fafc' : '#1e293b' },
      borderRadius: 12,
      borderWidth: 0
    },
    series: [{
      name: 'Engagement',
      data: pieData.length > 0 ? pieData : [{ name: 'Pending', y: 1, color: gridColor }]
    }],
    credits: { enabled: false }
  };

  const getStatus = (avg) => {
    if (avg === undefined) return { label: 'Active', color: '#6c63ff' };
    if (avg >= 90) return { label: 'Elite', color: '#10b981' };
    if (avg >= 75) return { label: 'Expert', color: '#3b82f6' };
    if (avg >= 50) return { label: 'Adept', color: '#f59e0b' };
    return { label: 'Novice', color: '#ef4444' };
  };

  const status = getStatus(data.avg_score);

  return (
    <PageTransition>
    <div className='page'>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
        <div>
          <div style={{ display: 'inline-block', padding: '0.35rem 0.85rem', background: `${status.color}15`, color: status.color, borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
             {role === 'mentor' ? 'Mentor' : status.label} Status
          </div>
          <h1 style={{ marginBottom: 0 }}>{role === 'mentor' ? 'Mentorship ' : 'Engineering '}<span style={{ color: status.color, WebkitTextFillColor: 'initial' }}>Progress</span></h1>
        </div>
        {role !== 'mentor' && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{data.avg_score || 0}%</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.5rem' }}>Global Mastery</div>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
        gap: '0.85rem', 
        marginBottom: '2rem' 
      }}>
        {(role === 'mentor' ? [
          { label: 'Students Attended', val: data.total_attended || 0, icon: '👨‍🎓', color: '#6c63ff' },
          { label: 'Hot Streak', val: `${data.streak || 0}d`, icon: '🔥', color: '#ef4444' },
          { label: 'Knowledge Nodes', val: data.subjects?.length || 0, icon: '✦', color: '#f59e0b' },
        ] : [
          { label: 'Analyses', val: data.total_notes || 0, icon: '📄', color: '#6c63ff' },
          { label: 'Skill Tests', val: data.total_quizzes || 0, icon: '✓', color: '#10b981' },
          { label: 'Hot Streak', val: `${data.streak || 0}d`, icon: '🔥', color: '#ef4444' },
          { label: 'Knowledge Nodes', val: data.subjects?.length || 0, icon: '✦', color: '#f59e0b' },
        ]).map(({ label, val, icon, color }) => (
          <div className='card' key={label} style={{ 
            background: isDark ? `rgba(${color === '#6c63ff' ? '108,99,255' : color === '#10b981' ? '16,185,129' : color === '#ef4444' ? '239,68,68' : '245,158,11'}, 0.05)` : '#fff',
            textAlign: 'center', 
            padding: '1.25rem 0.75rem',
            borderColor: isDark ? 'var(--border)' : `${color}22`,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem', opacity: 0.8 }}>{icon}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text)' }}>{val}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
          </div>
        ))}
      </div>

      <div className='responsive-split' style={{ display: 'flex', gap: '1.5rem' }}>
        {/* performance dynamics chart */}
        {role !== 'mentor' && (
          <div className='card' style={{ flex: 2, padding: window.innerWidth < 800 ? '1.25rem' : '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 4, height: 18, background: 'var(--accent)', borderRadius: 2 }}></span>
              Performance Dynamics
            </h2>
            <HighchartsReact highcharts={Highcharts} options={performanceOptions} />
          </div>
        )}

        {/* Attendance Calendar */}
        <div className='card' style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ marginBottom: '1rem' }}>Activity</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>Login history for this month</p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: '6px',
            width: '100%',
          }}>
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <div key={`h-${i}`} style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent)', textAlign: 'center', marginBottom: '4px' }}>{d}</div>
            ))}
            {(() => {
              const now = new Date();
              const year = now.getFullYear();
              const month = now.getMonth();
              const firstDay = new Date(year, month, 1).getDay();
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              
              const blanks = Array(firstDay).fill(null);
              const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
              
              return [...blanks, ...days].map((day, i) => {
                if (!day) return <div key={`b-${i}`} />;
                
                // Check if this date has a login recorded
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasLogin = data.login_dates?.includes(dateStr);
                
                return (
                  <div key={day} style={{
                    aspectRatio: '1/1',
                    minWidth: '0',
                    borderRadius: '8px',
                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    position: 'relative',
                    border: hasLogin ? `1px solid #10b98144` : '1px solid transparent',
                    boxShadow: hasLogin && !isDark ? '0 2px 4px rgba(16,185,129,0.1)' : 'none'
                  }}>
                    <span style={{ opacity: day === now.getDate() ? 1 : 0.5, fontWeight: day === now.getDate() ? 800 : 400 }}>{day}</span>
                    {hasLogin && (
                      <div style={{
                        position: 'absolute',
                        bottom: '15%',
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: '#10b981',
                        boxShadow: '0 0 6px #10b981'
                      }} />
                    )}
                  </div>
                );
              });
            })()}
          </div>
          
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              Current Streak: <b style={{ color: 'var(--text)' }}>{data.streak || 0} Days</b>
            </span>
          </div>
        </div>
      </div>

      <div className='responsive-split' style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* Donut Chart */}
        <div className='card' style={{ flex: 1 }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Knowledge Mix</h2>
          <HighchartsReact highcharts={Highcharts} options={masteryOptions} />
        </div>

        {/* Subjects Footer */}
        {data.subjects?.length > 0 && (
          <div className='card' style={{ flex: 2, height: 'fit-content' }}>
            <h2 style={{ marginBottom: '1rem' }}>Mastered Topics</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {data.subjects.map(s => (
                <span key={s} className='tag' style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}>{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </PageTransition>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { LineChart, BarChart, BookOpen, Sun, Moon, User, Lock, LogIn, UserPlus } from 'lucide-react';

export default function EnergyTrackerApp() {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [view, setView] = useState('today');
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [showSimpleLog, setShowSimpleLog] = useState(false);
  const [showDaySummary, setShowDaySummary] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [task, setTask] = useState('');
  const [taskType, setTaskType] = useState('Study');
  const [duration, setDuration] = useState('');
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(3);
  const [productivity, setProductivity] = useState(3);
  const [notes, setNotes] = useState('');

  // Simple log states
  const [simpleEnergy, setSimpleEnergy] = useState(3);
  const [simpleNote, setSimpleNote] = useState('');

  // Day summary states
  const [dayReflection, setDayReflection] = useState('');

  const canvasRef = useRef(null);

  // Initialize - check for logged in user
  useEffect(() => {
    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeApp = () => {
    try {
      const currentSession = localStorage.getItem('energy-tracker-session');
      if (currentSession) {
        const sessionData = JSON.parse(currentSession);
        setUser(sessionData);
        loadUserEntries(sessionData.id);
      }
    } catch (error) {
      console.log('No active session');
    }
    setLoading(false);

    const now = new Date();
    setDate(now.toISOString().split('T')[0]);
    setTime(now.toTimeString().slice(0, 5));
  };

  // Simple hash function for password (basic protection, not cryptographically secure)
  const hashPassword = (password) => {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  };

  // Register new user
  const registerUser = (username, password, name) => {
    const users = JSON.parse(localStorage.getItem('energy-tracker-users') || '{}');

    if (users[username.toLowerCase()]) {
      return { success: false, error: 'Username already exists' };
    }

    const userId = `user_${Date.now()}`;
    const hashedPassword = hashPassword(password);

    users[username.toLowerCase()] = {
      id: userId,
      username: username.toLowerCase(),
      name: name,
      password: hashedPassword,
      created: new Date().toISOString()
    };

    localStorage.setItem('energy-tracker-users', JSON.stringify(users));

    // Auto login after registration
    const session = { id: userId, username: username.toLowerCase(), name: name };
    localStorage.setItem('energy-tracker-session', JSON.stringify(session));
    setUser(session);
    setEntries([]);

    return { success: true };
  };

  // Login user
  const loginUser = (username, password) => {
    const users = JSON.parse(localStorage.getItem('energy-tracker-users') || '{}');
    const user = users[username.toLowerCase()];

    if (!user) {
      return { success: false, error: 'Username not found' };
    }

    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return { success: false, error: 'Incorrect password' };
    }

    // Create session
    const session = { id: user.id, username: user.username, name: user.name };
    localStorage.setItem('energy-tracker-session', JSON.stringify(session));
    setUser(session);
    loadUserEntries(user.id);

    return { success: true };
  };

  const loadUserEntries = (userId) => {
    try {
      const result = localStorage.getItem(`entries_${userId}`);
      if (result) {
        setEntries(JSON.parse(result));
      } else {
        setEntries([]);
      }
    } catch (error) {
      console.log('No entries found for user');
      setEntries([]);
    }
  };

  const saveEntries = (newEntries) => {
    if (!user) return;
    try {
      localStorage.setItem(`entries_${user.id}`, JSON.stringify(newEntries));
      setEntries(newEntries);
    } catch (error) {
      console.error('Failed to save entries:', error);
    }
  };

  const addEntry = () => {
    if (!task.trim()) {
      alert('Please enter a task description');
      return;
    }

    const entry = {
      id: `entry_${Date.now()}`,
      date,
      time,
      task: task.trim(),
      taskType,
      duration: duration ? parseInt(duration) : null,
      energy: parseInt(energy),
      stress: parseInt(stress),
      productivity: parseInt(productivity),
      notes: notes.trim(),
      timestamp: new Date().toISOString(),
      type: 'full'
    };

    const newEntries = [...entries, entry];
    saveEntries(newEntries);

    setTask('');
    setDuration('');
    setNotes('');
    const now = new Date();
    setTime(now.toTimeString().slice(0, 5));
    setShowQuickEntry(false);
  };

  // Simple log - just energy + note
  const addSimpleLog = () => {
    const now = new Date();
    const entry = {
      id: `entry_${Date.now()}`,
      date,
      time: now.toTimeString().slice(0, 5),
      task: simpleNote.trim() || 'Quick check-in',
      taskType: 'Check-in',
      duration: null,
      energy: parseInt(simpleEnergy),
      stress: 3,
      productivity: 3,
      notes: '',
      timestamp: now.toISOString(),
      type: 'simple'
    };

    const newEntries = [...entries, entry];
    saveEntries(newEntries);

    setSimpleEnergy(3);
    setSimpleNote('');
    setShowSimpleLog(false);
    setTime(now.toTimeString().slice(0, 5));
  };

  const quickLog = (energyLevel) => {
    const now = new Date();
    const entry = {
      id: `entry_${Date.now()}`,
      date,
      time: now.toTimeString().slice(0, 5),
      task: 'Quick check-in',
      taskType: 'Check-in',
      duration: null,
      energy: energyLevel,
      stress: 3,
      productivity: 3,
      notes: '',
      timestamp: now.toISOString(),
      type: 'quick'
    };

    const newEntries = [...entries, entry];
    saveEntries(newEntries);
    setTime(now.toTimeString().slice(0, 5));
  };

  // End of day entry
  const addEndOfDayEntry = () => {
    const now = new Date();
    const todayEntries = entries.filter(e => e.date === date);

    const avgEnergy = todayEntries.length > 0
      ? Math.round(todayEntries.reduce((sum, e) => sum + e.energy, 0) / todayEntries.length)
      : 3;

    const entry = {
      id: `entry_${Date.now()}`,
      date,
      time: '23:59',
      task: 'End of Day Reflection',
      taskType: 'Reflection',
      duration: null,
      energy: avgEnergy,
      stress: 3,
      productivity: 3,
      notes: dayReflection.trim(),
      timestamp: now.toISOString(),
      type: 'end-of-day'
    };

    const newEntries = [...entries, entry];
    saveEntries(newEntries);

    setDayReflection('');
    setShowDaySummary(false);
  };

  const deleteEntry = (entryId) => {
    const newEntries = entries.filter(e => e.id !== entryId);
    saveEntries(newEntries);
  };

  const logout = () => {
    localStorage.removeItem('energy-tracker-session');
    setUser(null);
    setEntries([]);
  };

  // Filter entries by view
  const getFilteredEntries = () => {
    const today = new Date().toISOString().split('T')[0];
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);

    switch(view) {
      case 'today':
        return entries.filter(e => e.date === today);
      case 'week':
        return entries.filter(e => new Date(e.date) >= thisWeek);
      case 'all':
        return entries;
      default:
        return entries.filter(e => e.date === today);
    }
  };

  const filteredEntries = getFilteredEntries();
  const todayEntries = entries.filter(e => e.date === new Date().toISOString().split('T')[0]);

  // Calculate insights
  const getInsights = () => {
    if (filteredEntries.length === 0) return null;

    const avgEnergy = (filteredEntries.reduce((sum, e) => sum + e.energy, 0) / filteredEntries.length).toFixed(1);
    const avgStress = (filteredEntries.reduce((sum, e) => sum + e.stress, 0) / filteredEntries.length).toFixed(1);
    const avgProd = (filteredEntries.reduce((sum, e) => sum + e.productivity, 0) / filteredEntries.length).toFixed(1);

    const highStress = filteredEntries.filter(e => e.stress >= 4);
    const lowEnergy = filteredEntries.filter(e => e.energy <= 2);

    return { avgEnergy, avgStress, avgProd, highStress: highStress.length, lowEnergy: lowEnergy.length };
  };

  const insights = getInsights();

  // Draw chart with CONTINUOUS LINES
  useEffect(() => {
    if (!canvasRef.current || filteredEntries.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#0e1524';
    ctx.fillRect(0, 0, width, height);

    // Sort entries by time
    const sorted = [...filteredEntries].sort((a, b) => {
      const aTime = new Date(`${a.date}T${a.time}`);
      const bTime = new Date(`${b.date}T${b.time}`);
      return aTime - bTime;
    });

    if (sorted.length === 0) return;

    const padding = { top: 40, right: 40, bottom: 50, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Draw grid
    ctx.strokeStyle = 'rgba(34, 48, 71, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // Y-axis labels
    ctx.fillStyle = '#93a4b5';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * (5 - i);
      ctx.fillText(i.toString(), padding.left - 10, y + 4);
    }

    // Plot lines - Draw continuous connected lines
    const series = [
      { key: 'energy', color: '#7dd3fc', label: 'Energy' },
      { key: 'stress', color: '#f87171', label: 'Stress' },
      { key: 'productivity', color: '#4ade80', label: 'Prod' }
    ];

    // Draw lines first
    series.forEach(({ key, color }) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();

      sorted.forEach((entry, i) => {
        const x = padding.left + (chartWidth / Math.max(sorted.length - 1, 1)) * i;
        const value = entry[key];
        const y = padding.top + chartHeight - (value / 5) * chartHeight;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    });

    // Draw points on top of lines
    series.forEach(({ key, color }) => {
      sorted.forEach((entry, i) => {
        const x = padding.left + (chartWidth / Math.max(sorted.length - 1, 1)) * i;
        const value = entry[key];
        const y = padding.top + chartHeight - (value / 5) * chartHeight;

        // Outer circle (background)
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#0e1524';
        ctx.fill();

        // Inner circle (colored)
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });
    });

    // X-axis (time labels)
    ctx.fillStyle = '#93a4b5';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    const labelInterval = Math.max(1, Math.ceil(sorted.length / 8));
    sorted.forEach((entry, i) => {
      if (i % labelInterval === 0 || i === sorted.length - 1) {
        const x = padding.left + (chartWidth / Math.max(sorted.length - 1, 1)) * i;
        ctx.fillText(entry.time, x, height - padding.bottom + 20);
      }
    });

    // Legend
    let legendX = padding.left + 10;
    const legendY = padding.top - 20;
    ctx.font = '12px system-ui';
    series.forEach(({ color, label }) => {
      ctx.fillStyle = color;
      ctx.fillRect(legendX, legendY - 8, 20, 4);
      ctx.fillStyle = '#e8eef6';
      ctx.textAlign = 'left';
      ctx.fillText(label, legendX + 26, legendY);
      legendX += 100;
    });

  }, [filteredEntries]);

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 flex items-center justify-center">
        <div className="text-blue-300">Loading...</div>
      </div>
    );
  }

  // Login/Register screen
  if (!user) {
    return <AuthScreen onLogin={loginUser} onRegister={registerUser} />;
  }

  const taskCategories = [
    'Study', 'Portfolio', 'Writing', 'Class assignment', 'Research',
    'Application prep', 'Meetings', 'Admin', 'Exercise', 'Rest', 'Play'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-blue-300">Energy Tracker</h1>
              <p className="text-sm text-gray-400">Welcome, {user.name} <span className="text-gray-500">(@{user.username})</span></p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition flex items-center gap-2"
            >
              <LogIn size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Action Buttons */}
        <div className="mb-6 flex gap-3 flex-wrap">
          {/* Simple Log Button */}
          <button
            onClick={() => setShowSimpleLog(!showSimpleLog)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition flex items-center gap-2"
          >
            <Sun size={16} />
            Quick Log
          </button>

          {/* Full Entry Button */}
          <button
            onClick={() => setShowQuickEntry(!showQuickEntry)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition"
          >
            + Detailed Entry
          </button>

          {/* End of Day Button */}
          <button
            onClick={() => setShowDaySummary(!showDaySummary)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition flex items-center gap-2"
          >
            <Moon size={16} />
            End My Day
          </button>

          {/* Quick Energy Buttons */}
          <div className="flex gap-1 items-center bg-gray-800/50 rounded-lg px-2 ml-auto">
            <span className="text-xs text-gray-400 px-2">Instant:</span>
            {[1, 2, 3, 4, 5].map(level => (
              <button
                key={level}
                onClick={() => quickLog(level)}
                className={`w-8 h-8 text-sm rounded-full transition font-medium ${
                  level <= 2 ? 'hover:bg-red-900/50 text-red-400 border border-red-800/50' :
                  level === 3 ? 'hover:bg-yellow-900/50 text-yellow-400 border border-yellow-800/50' :
                  'hover:bg-green-900/50 text-green-400 border border-green-800/50'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* View Toggles */}
        <div className="mb-6 flex gap-2">
          {['today', 'week', 'all'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 text-sm rounded-lg transition ${
                view === v
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-800/30 text-gray-400 hover:bg-gray-800/50'
              }`}
            >
              {v === 'today' ? 'Today' : v === 'week' ? 'This Week' : 'All Time'}
            </button>
          ))}
        </div>

        {/* Simple Log Form */}
        {showSimpleLog && (
          <div className="mb-6 bg-emerald-900/20 border border-emerald-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-emerald-300 flex items-center gap-2">
              <Sun size={20} />
              Quick Energy Log
            </h3>

            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-2">How's your energy right now?</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      onClick={() => setSimpleEnergy(level)}
                      className={`w-12 h-12 rounded-lg text-lg font-semibold transition ${
                        simpleEnergy === level
                          ? level <= 2 ? 'bg-red-600 text-white' :
                            level === 3 ? 'bg-yellow-600 text-white' :
                            'bg-green-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                  <span>Drained</span>
                  <span>Strong</span>
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-2">Quick note (optional)</label>
                <input
                  type="text"
                  value={simpleNote}
                  onChange={(e) => setSimpleNote(e.target.value)}
                  placeholder="What's happening?"
                  className="w-full px-3 py-3 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <button
                onClick={addSimpleLog}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition"
              >
                Log It
              </button>
            </div>
          </div>
        )}

        {/* End of Day Summary */}
        {showDaySummary && (
          <div className="mb-6 bg-purple-900/20 border border-purple-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-purple-300 flex items-center gap-2">
              <Moon size={20} />
              End of Day Summary
            </h3>

            {/* Today's Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-300">{todayEntries.length}</div>
                <div className="text-xs text-gray-400">Entries Today</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-cyan-400">
                  {todayEntries.length > 0
                    ? (todayEntries.reduce((sum, e) => sum + e.energy, 0) / todayEntries.length).toFixed(1)
                    : '-'}
                </div>
                <div className="text-xs text-gray-400">Avg Energy</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-400">
                  {todayEntries.length > 0
                    ? (todayEntries.reduce((sum, e) => sum + e.stress, 0) / todayEntries.length).toFixed(1)
                    : '-'}
                </div>
                <div className="text-xs text-gray-400">Avg Stress</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">
                  {todayEntries.length > 0
                    ? (todayEntries.reduce((sum, e) => sum + e.productivity, 0) / todayEntries.length).toFixed(1)
                    : '-'}
                </div>
                <div className="text-xs text-gray-400">Avg Productivity</div>
              </div>
            </div>

            {/* Today's Entries List */}
            {todayEntries.length > 0 && (
              <div className="mb-6 bg-gray-800/30 rounded-lg p-4 max-h-48 overflow-y-auto">
                <div className="text-xs text-gray-400 mb-2">Today's Log:</div>
                {todayEntries.map(entry => (
                  <div key={entry.id} className="flex items-center gap-3 py-2 border-b border-gray-700/50 last:border-0">
                    <span className="text-xs text-gray-500 w-12">{entry.time}</span>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      entry.energy <= 2 ? 'bg-red-900/50 text-red-400' :
                      entry.energy === 3 ? 'bg-yellow-900/50 text-yellow-400' :
                      'bg-green-900/50 text-green-400'
                    }`}>
                      {entry.energy}
                    </span>
                    <span className="text-sm text-gray-300 flex-1">{entry.task}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Reflection */}
            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-2">Daily Reflection (optional)</label>
              <textarea
                value={dayReflection}
                onChange={(e) => setDayReflection(e.target.value)}
                placeholder="What went well today? What was challenging? What will you do differently tomorrow?"
                rows="3"
                className="w-full px-3 py-3 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:border-purple-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={addEndOfDayEntry}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition"
              >
                Save & End Day
              </button>
              <button
                onClick={() => setShowDaySummary(false)}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Full Entry Form */}
        {showQuickEntry && (
          <div className="mb-6 bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-300 flex items-center gap-2">
              <BookOpen size={20} />
              Detailed Entry
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-2">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs text-gray-400 mb-2">What are you working on?</label>
              <input
                type="text"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Task description"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs text-gray-400 mb-2">Category</label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                >
                  {taskCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Optional"
                  min="0"
                  step="5"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs text-gray-400 mb-2">Energy (1-5)</label>
                <select
                  value={energy}
                  onChange={(e) => setEnergy(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="1">1 - Drained</option>
                  <option value="2">2 - Low</option>
                  <option value="3">3 - OK</option>
                  <option value="4">4 - Good</option>
                  <option value="5">5 - Strong</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Stress (1-5)</label>
                <select
                  value={stress}
                  onChange={(e) => setStress(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="1">1 - Calm</option>
                  <option value="2">2 - Mild</option>
                  <option value="3">3 - Tense</option>
                  <option value="4">4 - High</option>
                  <option value="5">5 - Intense</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Productivity (1-5)</label>
                <select
                  value={productivity}
                  onChange={(e) => setProductivity(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="1">1 - Stuck</option>
                  <option value="2">2 - Slow</option>
                  <option value="3">3 - Moving</option>
                  <option value="4">4 - Solid</option>
                  <option value="5">5 - Strong</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs text-gray-400 mb-2">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What drove stress? What helped?"
                rows="2"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={addEntry}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition"
              >
                Save Entry
              </button>
              <button
                onClick={() => setShowQuickEntry(false)}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Insights */}
        {insights && (
          <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Entries</div>
              <div className="text-2xl font-semibold text-blue-300">{filteredEntries.length}</div>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Avg Energy</div>
              <div className="text-2xl font-semibold text-cyan-400">{insights.avgEnergy}</div>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Avg Stress</div>
              <div className="text-2xl font-semibold text-red-400">{insights.avgStress}</div>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Avg Productivity</div>
              <div className="text-2xl font-semibold text-green-400">{insights.avgProd}</div>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Low Energy</div>
              <div className="text-2xl font-semibold text-orange-400">{insights.lowEnergy}</div>
            </div>
          </div>
        )}

        {/* Chart */}
        {filteredEntries.length > 0 ? (
          <div className="mb-6 bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-4 text-gray-300 flex items-center gap-2">
              <LineChart size={18} className="text-blue-400" />
              Energy, Stress & Productivity Over Time
            </h3>
            <canvas
              ref={canvasRef}
              width="920"
              height="380"
              className="w-full rounded-lg"
            />
          </div>
        ) : (
          <div className="mb-6 bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
            <BarChart size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No entries yet for this period</p>
            <p className="text-sm text-gray-500 mt-2">Start logging to see your energy patterns</p>
          </div>
        )}

        {/* Entries Table */}
        {filteredEntries.length > 0 && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300">Your Entries</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Time</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Entry</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Type</th>
                    <th className="text-center text-xs font-medium text-gray-400 px-4 py-3">Energy</th>
                    <th className="text-center text-xs font-medium text-gray-400 px-4 py-3">Stress</th>
                    <th className="text-center text-xs font-medium text-gray-400 px-4 py-3">Prod</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Notes</th>
                    <th className="text-right text-xs font-medium text-gray-400 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {[...filteredEntries].reverse().map((entry) => (
                    <tr key={entry.id} className={`border-b border-gray-700/50 hover:bg-gray-700/30 ${
                      entry.type === 'end-of-day' ? 'bg-purple-900/10' : ''
                    }`}>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {entry.date === new Date().toISOString().split('T')[0] ?
                          entry.time :
                          `${entry.date.slice(5)} ${entry.time}`
                        }
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-200">{entry.task}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded ${
                          entry.type === 'end-of-day' ? 'bg-purple-900/30 text-purple-400' :
                          entry.type === 'simple' ? 'bg-emerald-900/30 text-emerald-400' :
                          entry.type === 'quick' ? 'bg-gray-700 text-gray-400' :
                          'bg-blue-900/30 text-blue-400'
                        }`}>
                          {entry.taskType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          entry.energy <= 2 ? 'bg-red-900/30 text-red-400' :
                          entry.energy === 3 ? 'bg-yellow-900/30 text-yellow-400' :
                          'bg-green-900/30 text-green-400'
                        }`}>
                          {entry.energy}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          entry.stress >= 4 ? 'bg-red-900/30 text-red-400' :
                          entry.stress === 3 ? 'bg-yellow-900/30 text-yellow-400' :
                          'bg-green-900/30 text-green-400'
                        }`}>
                          {entry.stress}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          entry.productivity <= 2 ? 'bg-red-900/30 text-red-400' :
                          entry.productivity === 3 ? 'bg-yellow-900/30 text-yellow-400' :
                          'bg-green-900/30 text-green-400'
                        }`}>
                          {entry.productivity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">{entry.notes}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="text-xs text-gray-500 hover:text-red-400 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-6 bg-blue-900/20 border border-blue-800/30 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-blue-300 mb-3">Tips for Better Tracking</h3>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>Use <strong>Quick Log</strong> for fast check-ins throughout the day</li>
            <li>Use <strong>Detailed Entry</strong> when you want to track specific tasks</li>
            <li>Click <strong>End My Day</strong> each evening to see your summary and reflect</li>
            <li>Watch the chart for patterns - when does your energy peak?</li>
            <li>Track rest and play too - recovery is part of productivity</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Login/Register Screen Component
function AuthScreen({ onLogin, onRegister }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    const result = onLogin(username, password);
    if (!result.success) {
      setError(result.error);
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim() || !name.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    const result = onRegister(username, password, name);
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-blue-600/20 rounded-2xl mb-4">
            <BarChart size={48} className="text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-blue-300 mb-2">Energy Tracker</h1>
          <p className="text-gray-400">Track your energy, stress, and productivity patterns</p>
        </div>

        {/* Toggle Login/Register */}
        <div className="flex bg-gray-800/50 rounded-lg p-1 mb-6">
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition flex items-center justify-center gap-2 ${
              mode === 'login' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <LogIn size={16} />
            Login
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition flex items-center justify-center gap-2 ${
              mode === 'register' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <UserPlus size={16} />
            Sign Up
          </button>
        </div>

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="bg-gray-800/50 border border-gray-700 rounded-xl p-8">
            <h2 className="text-lg font-semibold text-white mb-6">Welcome Back</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">Username</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-white transition"
            >
              Login
            </button>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Don't have an account? Click "Sign Up" above
            </p>
          </form>
        )}

        {/* Register Form */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="bg-gray-800/50 border border-gray-700 rounded-xl p-8">
            <h2 className="text-lg font-semibold text-white mb-6">Create Account</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What should we call you?"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">Username</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                  placeholder="Choose a username"
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Letters and numbers only, no spaces</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">At least 4 characters</p>
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-white transition"
            >
              Create Account
            </button>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Already have an account? Click "Login" above
            </p>
          </form>
        )}

        <div className="mt-8 bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Perfect for students who:</h3>
          <ul className="text-sm text-gray-400 space-y-2">
            <li>Want to understand their energy patterns</li>
            <li>Need to manage stress during busy periods</li>
            <li>Want to optimize study schedules</li>
            <li>Track productivity across different tasks</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

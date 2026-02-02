import React, { useState, useEffect, useRef } from 'react';
import { LineChart, BarChart } from 'lucide-react';

export default function EnergyTrackerApp() {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [view, setView] = useState('today');
  const [showQuickEntry, setShowQuickEntry] = useState(false);
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

  const canvasRef = useRef(null);

  // Initialize
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = () => {
    try {
      // Try to get stored user from localStorage
      const storedUser = localStorage.getItem('energy-tracker-user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        loadUserEntries(userData.id);
      }
    } catch (error) {
      console.log('No existing user found');
    }
    setLoading(false);

    // Set current date/time
    const now = new Date();
    setDate(now.toISOString().split('T')[0]);
    setTime(now.toTimeString().slice(0, 5));
  };

  const createUser = (name) => {
    const newUser = {
      id: `user_${Date.now()}`,
      name: name,
      created: new Date().toISOString()
    };

    try {
      localStorage.setItem('energy-tracker-user', JSON.stringify(newUser));
      setUser(newUser);
      setEntries([]);
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const loadUserEntries = (userId) => {
    try {
      const result = localStorage.getItem(`entries_${userId}`);
      if (result) {
        setEntries(JSON.parse(result));
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
      timestamp: new Date().toISOString()
    };

    const newEntries = [...entries, entry];
    saveEntries(newEntries);

    // Reset form
    setTask('');
    setDuration('');
    setNotes('');
    const now = new Date();
    setTime(now.toTimeString().slice(0, 5));
    setShowQuickEntry(false);
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
      timestamp: now.toISOString()
    };

    const newEntries = [...entries, entry];
    saveEntries(newEntries);
    setTime(now.toTimeString().slice(0, 5));
  };

  const deleteEntry = (entryId) => {
    const newEntries = entries.filter(e => e.id !== entryId);
    saveEntries(newEntries);
  };

  const logout = () => {
    try {
      localStorage.removeItem('energy-tracker-user');
      setUser(null);
      setEntries([]);
    } catch (error) {
      console.error('Logout failed:', error);
    }
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

  // Draw chart
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

    // Plot lines
    const series = [
      { key: 'energy', color: '#7dd3fc', label: 'Energy' },
      { key: 'stress', color: '#f87171', label: 'Stress' },
      { key: 'productivity', color: '#4ade80', label: 'Prod' }
    ];

    series.forEach(({ key, color }) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      sorted.forEach((entry, i) => {
        const x = padding.left + (chartWidth / (sorted.length - 1 || 1)) * i;
        const value = entry[key];
        const y = padding.top + chartHeight - (value / 5) * chartHeight;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        // Draw point
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.stroke();
    });

    // X-axis (time labels)
    ctx.fillStyle = '#93a4b5';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    sorted.forEach((entry, i) => {
      if (i % Math.ceil(sorted.length / 6) === 0 || i === sorted.length - 1) {
        const x = padding.left + (chartWidth / (sorted.length - 1 || 1)) * i;
        ctx.fillText(entry.time, x, height - padding.bottom + 20);
      }
    });

    // Legend
    let legendX = padding.left + 10;
    const legendY = padding.top - 20;
    ctx.font = '12px system-ui';
    series.forEach(({ color, label }) => {
      ctx.fillStyle = color;
      ctx.fillRect(legendX, legendY - 8, 16, 3);
      ctx.fillStyle = '#e8eef6';
      ctx.fillText(label, legendX + 22, legendY);
      legendX += 90;
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

  // Login screen
  if (!user) {
    return <LoginScreen onCreate={createUser} />;
  }

  const taskCategories = [
    'Study', 'Portfolio', 'Writing', 'Class assignment', 'Research',
    'Application prep', 'Meetings', 'Admin', 'Exercise', 'Rest', 'Play'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-blue-300">Energy Tracker</h1>
              <p className="text-sm text-gray-400">Welcome back, {user.name}</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition"
            >
              Switch User
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Quick Actions Bar */}
        <div className="mb-6 flex gap-3 flex-wrap">
          <button
            onClick={() => setShowQuickEntry(!showQuickEntry)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition"
          >
            + New Entry
          </button>

          <div className="flex gap-2 items-center bg-gray-800/50 rounded-lg px-2">
            <span className="text-xs text-gray-400 px-2">Quick log:</span>
            {[1, 2, 3, 4, 5].map(level => (
              <button
                key={level}
                onClick={() => quickLog(level)}
                className={`px-3 py-2 text-sm rounded transition ${
                  level <= 2 ? 'hover:bg-red-900/30 text-red-400' :
                  level === 3 ? 'hover:bg-yellow-900/30 text-yellow-400' :
                  'hover:bg-green-900/30 text-green-400'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          <div className="flex gap-2 ml-auto">
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
                {v === 'today' ? 'Today' : v === 'week' ? 'Week' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Entry Form */}
        {showQuickEntry && (
          <div className="mb-6 bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-300">New Check-in</h3>

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
              <label className="block text-xs text-gray-400 mb-2">Task Description</label>
              <input
                type="text"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="What are you working on?"
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
              <div className="text-xs text-gray-400 mb-1">High Stress</div>
              <div className="text-2xl font-semibold text-orange-400">{insights.highStress}</div>
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
              <h3 className="text-sm font-semibold text-gray-300">Recent Entries</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Time</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Task</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Category</th>
                    <th className="text-center text-xs font-medium text-gray-400 px-4 py-3">Energy</th>
                    <th className="text-center text-xs font-medium text-gray-400 px-4 py-3">Stress</th>
                    <th className="text-center text-xs font-medium text-gray-400 px-4 py-3">Prod</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Notes</th>
                    <th className="text-right text-xs font-medium text-gray-400 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {[...filteredEntries].reverse().map((entry) => (
                    <tr key={entry.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {entry.date === new Date().toISOString().split('T')[0] ?
                          entry.time :
                          `${entry.date.slice(5)} ${entry.time}`
                        }
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-200">{entry.task}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{entry.taskType}</td>
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
            <li>Log 4-6 times per day to capture patterns without overwhelming yourself</li>
            <li>Use quick logs when you're busy - just tap your energy level</li>
            <li>Notice when stress spikes occur and what tasks trigger them</li>
            <li>Save low-energy tasks (admin, emails) for afternoon dips</li>
            <li>Track rest and play too - recovery is part of productivity</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function LoginScreen({ onCreate }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim());
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

        <form onSubmit={handleSubmit} className="bg-gray-800/50 border border-gray-700 rounded-xl p-8">
          <label className="block text-sm text-gray-300 mb-3">
            What's your name?
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none mb-4"
            autoFocus
          />
          <button
            type="submit"
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-white transition"
          >
            Get Started
          </button>

          <p className="text-xs text-gray-500 mt-4 text-center">
            Your data is stored securely in your browser
          </p>
        </form>

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

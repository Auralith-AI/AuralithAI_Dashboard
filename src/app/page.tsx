'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList, AreaChart, Area
} from 'recharts';
import {
  BadgeDollarSign,
  Clock,
  CalendarCheck,
  Users,
  Sun,
  Moon,
  RotateCcw,
  Calendar as CalendarIcon,
  Phone,
  MessageSquare,
  Instagram,
  Facebook,
  TrendingUp,
  Filter,
  LogOut
} from 'lucide-react';
import { format, subDays, startOfMonth, startOfDay, endOfDay } from 'date-fns';
import { useAuth } from '@/util/AuthContext';
import { useRouter } from 'next/navigation';

// API endpoint for dashboard data
const API_URL = 'https://auraalithai--auraalith-dashboard-dashboard-api.modal.run';

// Types
interface DashboardStats {
  kpis: {
    total_calls: number;
    hours_saved: number;
    appointments_booked: number;
    pipeline_value: number;
    closed_revenue: number;
  };
  funnel: {
    dials: number;
    conversations: number;
    interested: number;
    booked: number;
  };
  outcomes: Record<string, number>;
  lead_sources: {
    calls: number;
    sms: number;
    instagram: number;
    facebook: number;
  };
  hourly_activity: Array<{ hour: string; count: number }>;
  sentiment: {
    positive: number;
    negative: number;
    booked: number;
    neutral: number;
    unresponsive: number;
  };
  hot_leads: Array<{
    name: string;
    lead_type: string;
    budget: number;
    timeline: string;
    preferences: string;
  }>;
  recent_calls: Array<{
    call_id: string;
    phone_number: string;
    contact_name?: string;
    duration_seconds: number;
    outcome: string;
    recording_url: string;
    transcript_summary: string;
    created_at: string;
  }>;
}

// Premium Palette
const COLORS = {
  cyan: '#22d3ee',      // Brighter cyan
  purple: '#c084fc',    // Brighter purple
  green: '#4ade80',     // Brighter green
  yellow: '#facc15',    // Brighter yellow
  red: '#f87171',       // Brighter red
  gray: '#94a3b8',      // Slate 400
  blue: '#60a5fa',      // Blue 400
  orange: '#fb923c'     // Orange 400
};

const SENTIMENT_COLORS = {
  positive: '#4ade80',
  negative: '#f87171',
  booked: '#c084fc',
  neutral: '#94a3b8',
  unresponsive: '#facc15'
};

export default function Dashboard() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [greeting, setGreeting] = useState("Good Morning");

  // Date Filtering State
  const [dateRange, setDateRange] = useState<{ start: Date, end: Date, label: string }>({
    start: subDays(new Date(), 30),
    end: new Date(),
    label: "Last 30 Days"
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    const savedTheme = localStorage.getItem('dashboard-theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [dateRange, profile?.client_id]); // Refetch when date range changes

  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', !isDarkMode);
    localStorage.setItem('dashboard-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Protect Route
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  async function fetchDashboardData() {
    if (!profile?.client_id) return;

    setLoading(true);
    try {
      // Pass ISO strings for filtering
      const startISO = dateRange.start.toISOString();
      const endISO = dateRange.end.toISOString();
      const clientId = profile.client_id;

      const response = await fetch(`${API_URL}/stats?client_id=${clientId}&start_date=${startISO}&end_date=${endISO}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();

      const enhancedData: DashboardStats = {
        ...data,
        lead_sources: data.lead_sources || { calls: 0, sms: 0, instagram: 0, facebook: 0 },
        hourly_activity: data.hourly_activity || [],
        sentiment: data.sentiment || { positive: 0, negative: 0, booked: 0, neutral: 0, unresponsive: 0 },
        hot_leads: data.hot_leads || []
      };

      setStats(enhancedData);
      setError(null);
    } catch (err) {
      setError('Connection lost. Retrying...');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleDatePreset = (preset: string) => {
    const now = new Date();
    let start = now;

    switch (preset) {
      case 'Today':
        start = startOfDay(now);
        break;
      case 'Last 7 Days':
        start = subDays(now, 7);
        break;
      case 'Last 30 Days':
        start = subDays(now, 30);
        break;
      case 'This Month':
        start = startOfMonth(now);
        break;
    }

    setDateRange({ start, end: now, label: preset });
    setShowDatePicker(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getStatusColor = (outcome: string) => {
    switch (outcome.toLowerCase()) {
      case 'booked': return 'bg-purple-400';
      case 'interested': return 'bg-green-400';
      case 'callback': return 'bg-yellow-400';
      case 'voicemail': return 'bg-orange-400';
      default: return 'bg-red-400';
    }
  };

  const getSentimentPercentages = () => {
    if (!stats?.sentiment) return null;
    const total = Object.values(stats.sentiment).reduce((a, b) => a + b, 0);
    if (total === 0) return null;
    return {
      positive: Math.round((stats.sentiment.positive / total) * 100),
      negative: Math.round((stats.sentiment.negative / total) * 100),
      booked: Math.round((stats.sentiment.booked / total) * 100),
      neutral: Math.round((stats.sentiment.neutral / total) * 100),
      unresponsive: Math.round((stats.sentiment.unresponsive / total) * 100)
    };
  };

  const funnelData = stats ? [
    { name: 'Dials', value: stats.funnel?.dials || 0, fill: COLORS.gray },
    { name: 'Conversations', value: stats.funnel?.conversations || 0, fill: COLORS.cyan },
    { name: 'Interested', value: stats.funnel?.interested || 0, fill: COLORS.green },
    { name: 'Booked', value: stats.funnel?.booked || 0, fill: COLORS.purple }
  ] : [];

  const sentimentPercentages = getSentimentPercentages();

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted text-sm animate-pulse">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!user) return null; // Prevent flash before redirect

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background text-foreground transition-colors duration-300">

      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting}, <span className="gradient-text">{profile?.full_name || 'Admin'}</span>
          </h1>
          <p className="text-muted text-sm mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            System Operational • {dateRange.label}
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto relative">

          {/* Date Picker Button */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-purple-500/50 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            >
              <CalendarIcon size={16} className="text-purple-400" />
              {dateRange.label}
            </button>

            {showDatePicker && (
              <div className="absolute top-12 right-0 bg-card border border-white/10 rounded-lg shadow-xl z-50 w-48 overflow-hidden backdrop-blur-xl">
                {['Today', 'Last 7 Days', 'Last 30 Days', 'This Month'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleDatePreset(preset)}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors flex items-center justify-between group"
                  >
                    {preset}
                    {dateRange.label === preset && <TrendingUp size={14} className="text-purple-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <button
            onClick={fetchDashboardData}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-colors"
          >
            <RotateCcw size={18} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all text-sm font-medium"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

        <div className="glass-card p-6 border-l-4 border-green-500 relative overflow-hidden group">
          <div className="absolute top-4 right-4 p-2 bg-green-500/10 rounded-full group-hover:scale-110 transition-transform">
            <BadgeDollarSign size={24} className="text-green-500" />
          </div>
          <p className="kpi-label mb-1">Potential Revenue</p>
          <p className="kpi-value text-green-400 mb-1">
            {formatCurrency(stats?.kpis?.pipeline_value || 0)}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded font-medium">Based on 5% Comm.</span>
          </div>
        </div>

        <div className="glass-card p-6 border-l-4 border-cyan-500 relative overflow-hidden group">
          <div className="absolute top-4 right-4 p-2 bg-cyan-500/10 rounded-full group-hover:scale-110 transition-transform">
            <Clock size={24} className="text-cyan-500" />
          </div>
          <p className="kpi-label mb-1">Hours Saved</p>
          <p className="kpi-value text-cyan-400 mb-1">
            {stats?.kpis?.hours_saved || 0}
          </p>
          <p className="text-xs text-muted">Automated Work</p>
        </div>

        <div className="glass-card p-6 border-l-4 border-purple-500 relative overflow-hidden group">
          <div className="absolute top-4 right-4 p-2 bg-purple-500/10 rounded-full group-hover:scale-110 transition-transform">
            <CalendarCheck size={24} className="text-purple-500" />
          </div>
          <p className="kpi-label mb-1">Appointments</p>
          <p className="kpi-value text-purple-400 mb-1">
            {stats?.kpis?.appointments_booked || 0}
          </p>
          <p className="text-xs text-muted">Booked by AI</p>
        </div>

        <div className="glass-card p-6 border-l-4 border-gray-500 relative overflow-hidden group">
          <div className="absolute top-4 right-4 p-2 bg-white/10 rounded-full group-hover:scale-110 transition-transform">
            <Users size={24} className="text-foreground" />
          </div>
          <p className="kpi-label mb-1">Total Leads</p>
          <p className="kpi-value text-foreground mb-1">
            {stats?.kpis?.total_calls || 0}
          </p>
          <p className="text-xs text-muted">Active Conversations</p>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Left Col - Charts */}
        <div className="lg:col-span-2 space-y-6">

          {/* Hourly Activity - 24H Interactive */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Clock className="text-cyan-400" size={20} /> Hourly Activity (24H)
              </h2>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.hourly_activity || []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="hour"
                    stroke="var(--text-muted)"
                    tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval={2} // Show every 2nd label to reduce clutter
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '8px',
                      color: 'var(--text-foreground)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill={COLORS.cyan}
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                    animationDuration={1500}
                  >
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Filter className="text-blue-400" size={20} /> Lead Sources
              </h2>
              <div className="space-y-4">
                {[
                  { label: 'Calls', icon: Phone, count: stats?.lead_sources?.calls, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
                  { label: 'SMS', icon: MessageSquare, count: stats?.lead_sources?.sms, color: 'text-green-500', bg: 'bg-green-500/10' },
                  { label: 'Instagram', icon: Instagram, count: stats?.lead_sources?.instagram, color: 'text-pink-500', bg: 'bg-pink-500/10' },
                  { label: 'Facebook', icon: Facebook, count: stats?.lead_sources?.facebook, color: 'text-blue-600', bg: 'bg-blue-600/10' },
                ].map((source, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${source.bg}`}>
                        <source.icon size={16} className={source.color} />
                      </div>
                      <span className="text-sm font-medium">{source.label}</span>
                    </div>
                    <span className="text-lg font-bold">{source.count || 0}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6 flex flex-col">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="text-purple-400" size={20} /> Sentiment AI
              </h2>
              {sentimentPercentages ? (
                <div className="grid grid-cols-2 gap-2 flex-1">
                  {Object.entries(sentimentPercentages).map(([key, value]) => (
                    <div key={key} className="bg-background/50 rounded-lg p-3 text-center border border-white/5 hover:border-white/10 transition-colors">
                      <div className="text-xs uppercase text-muted mb-1 font-bold tracking-wider">{key}</div>
                      <div className="text-xl font-bold" style={{ color: SENTIMENT_COLORS[key as keyof typeof SENTIMENT_COLORS] }}>
                        {value}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted">No data</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col */}
        <div className="space-y-6">

          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-4">Conversion Funnel</h2>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ left: 0, right: 30 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24} animationDuration={1500}>
                    <LabelList dataKey="value" position="right" fill="var(--foreground)" style={{ fill: 'var(--foreground)' }} fontSize={12} formatter={(val: any) => val > 0 ? val : ''} />
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-6 flex flex-col h-[400px]">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="text-orange-500" size={20} /> Hot Leads
            </h2>
            <div className="overflow-y-auto pr-2 space-y-3 custom-scrollbar flex-1">
              {stats?.hot_leads && stats.hot_leads.length > 0 ? (
                stats.hot_leads.map((lead, i) => (
                  <div key={i} className="p-3 bg-background/50 rounded-lg border border-white/5 hover:border-purple-500/50 transition-colors group cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-sm truncate group-hover:text-purple-400 transition-colors">{lead.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${lead.lead_type === 'Seller' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                        {lead.lead_type}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-muted">
                      <div className="flex justify-between">
                        <span>{lead.lead_type === 'Seller' ? 'Exp. Value' : 'Budget'}:</span>
                        <span className="text-foreground font-mono">{formatCurrency(lead.budget)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Timeline:</span>
                        <span className="text-foreground">{lead.timeline}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted text-sm py-10">No hot leads active.</p>
              )}
            </div>
          </div>

        </div>
      </div>

      <section className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Phone size={20} className="text-white" /> Recent AI Interactions
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-muted uppercase tracking-wider font-medium text-xs">
              <tr>
                <th className="p-4">Contact</th>
                <th className="p-4">Status</th>
                <th className="p-4">Summary</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stats?.recent_calls && stats.recent_calls.length > 0 ? (
                stats.recent_calls.map((call) => (
                  <tr key={call.call_id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="font-semibold group-hover:text-purple-400 transition-colors">{call.contact_name || 'Unknown User'}</div>
                      <div className="text-xs text-muted flex items-center gap-1">
                        <Phone size={10} /> {call.phone_number}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${getStatusColor(call.outcome)}`}></span>
                        <span className="capitalize">{call.outcome.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="p-4 max-w-md truncate text-muted">
                      {call.transcript_summary || 'No summary available.'}
                    </td>
                    <td className="p-4 text-right">
                      {call.recording_url ? (
                        <a
                          href={call.recording_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-purple-500 hover:text-white transition-all transform hover:scale-110"
                          title="Play Recording"
                        >
                          ▶
                        </a>
                      ) : (
                        <span className="text-muted opacity-30">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted">
                    No recent interactions found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}

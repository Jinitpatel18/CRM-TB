import { useState } from 'react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
    Building2, Users, Mail, MessageSquare, Calendar, TrendingUp,
} from 'lucide-react';
import {
    useAnalyticsOverview, useAnalyticsTrend, useAnalyticsByType,
    useAnalyticsTopCompanies, useAnalyticsTeamPerformance, useAnalyticsHourly,
} from '../hooks/useAnalytics';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { useTheme } from '../lib/ThemeContext';
import { Select } from '../components/Input';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function StatCard({ icon: Icon, label, value, sub, tone = 'brand' }) {
    const tones = {
        brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
        green: 'bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-300',
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
        purple: 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300',
        red: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300',
    };
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-soft dark:shadow-soft-dark">
            <div className="flex items-start justify-between mb-2">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tones[tone]}`}>
                    <Icon size={16} />
                </div>
            </div>
            <div className="text-2xl font-semibold text-slate-800 dark:text-white">{value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
            {sub && <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</div>}
        </div>
    );
}

export default function Analytics() {
    const [trendDays, setTrendDays] = useState(30);
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const { data: overview } = useAnalyticsOverview();
    const { data: trend = [] } = useAnalyticsTrend(trendDays);
    const { data: byType = [] } = useAnalyticsByType();
    const { data: topCompanies = [] } = useAnalyticsTopCompanies(5);
    const { data: team = [] } = useAnalyticsTeamPerformance();
    const { data: hourly = [] } = useAnalyticsHourly();

    const trendData = trend.map((d) => ({
        date: d.date.slice(5), // MM-DD
        activities: d.count,
    }));

    const hourlyData = hourly.map((h) => ({
        hour: `${h.hour}:00`,
        activities: h.count,
    }));

    // Theme-aware chart tokens
    const gridStroke = isDark ? '#334155' : '#e5e7eb';
    const axisTick = { fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' };
    const tooltipStyle = {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
        borderRadius: 8,
        fontSize: 12,
        color: isDark ? '#f1f5f9' : '#0f172a',
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Analytics</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Insights across your CRM activity
                    </p>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard icon={Building2} label="Companies" value={overview?.total_companies ?? '—'} tone="brand" />
                <StatCard icon={Users} label="Contacts" value={overview?.total_contacts ?? '—'} tone="purple" />
                <StatCard icon={Mail} label="Emails Sent" value={overview?.total_emails_sent ?? '—'} tone="blue" />
                <StatCard icon={MessageSquare} label="Replies" value={overview?.total_replies ?? '—'} tone="green" sub={overview ? `${overview.reply_rate}% reply rate` : ''} />
                <StatCard icon={Calendar} label="Meetings" value={overview?.total_meetings ?? '—'} tone="amber" />
                <StatCard icon={TrendingUp} label="Activities (7d)" value={overview?.activities_7d ?? '—'} tone="purple" />
            </div>

            {/* Trend chart */}
            <Card
                title="Activity Trend"
                action={
                    <Select
                        value={trendDays}
                        onChange={(e) => setTrendDays(Number(e.target.value))}
                        className="!py-1 !text-xs !w-32"
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={14}>Last 14 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={60}>Last 60 days</option>
                        <option value={90}>Last 90 days</option>
                    </Select>
                }
            >
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                            <XAxis dataKey="date" tick={axisTick} />
                            <YAxis tick={axisTick} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Line
                                type="monotone"
                                dataKey="activities"
                                stroke="#6366f1"
                                strokeWidth={2}
                                dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                                activeDot={{ r: 5 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Two-column grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activity by Type */}
                <Card title="Activity by Type">
                    <div className="h-64">
                        {byType.length === 0 ? (
                            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">No data yet</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={byType}
                                        dataKey="count"
                                        nameKey="type"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={90}
                                        paddingAngle={3}
                                        label={(e) => `${e.type}: ${e.count}`}
                                        labelLine={false}
                                    >
                                        {byType.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>

                {/* Top Companies */}
                <Card title="Top Companies">
                    <div className="h-64">
                        {topCompanies.length === 0 ? (
                            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">No data yet</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={topCompanies}
                                    layout="vertical"
                                    margin={{ left: 20, right: 20 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                                    <XAxis type="number" tick={axisTick} />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        tick={axisTick}
                                        width={100}
                                    />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Bar dataKey="activity_count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>
            </div>

            {/* Hourly Activity */}
            <Card title="Activity by Hour (Last 30 Days)">
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={hourlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                            <XAxis dataKey="hour" tick={{ ...axisTick, fontSize: 10 }} interval={1} />
                            <YAxis tick={axisTick} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="activities" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Team Performance */}
            <Card title="Team Performance">
                {team.length === 0 ? (
                    <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">No team data yet</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-slate-500 dark:text-slate-400">
                                    <th className="px-4 py-2 font-medium">Member</th>
                                    <th className="px-4 py-2 font-medium">Role</th>
                                    <th className="px-4 py-2 font-medium text-right">Total</th>
                                    <th className="px-4 py-2 font-medium text-right">Emails</th>
                                    <th className="px-4 py-2 font-medium text-right">Meetings</th>
                                    <th className="px-4 py-2 font-medium text-right">Replies</th>
                                </tr>
                            </thead>
                            <tbody>
                                {team.map((m) => (
                                    <tr key={m.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-800 dark:text-slate-100">
                                                {m.full_name || m.email.split('@')[0]}
                                            </div>
                                            <div className="text-xs text-slate-400 dark:text-slate-500">{m.email}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge>{m.role}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-100">{m.total_sent}</td>
                                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{m.emails}</td>
                                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{m.meetings}</td>
                                        <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                                            {m.replies}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}

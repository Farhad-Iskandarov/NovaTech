import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Eye, 
  Users, 
  Monitor, 
  Smartphone, 
  Globe,
  TrendingUp,
  Calendar
} from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COLORS = ['#5B5BF7', '#00C9A7', '#FFC107', '#FF6B6B', '#9B59B6'];

export function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('novatech-token');
        const res = await axios.get(`${API}/analytics/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAnalytics(res.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-slate-200 rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-slate-200 rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const deviceData = analytics?.device_breakdown 
    ? Object.entries(analytics.device_breakdown).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }))
    : [];

  const countryData = analytics?.country_breakdown 
    ? Object.entries(analytics.country_breakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }))
    : [];

  const topPagesData = analytics?.top_pages?.slice(0, 5) || [];

  const stats = [
    {
      title: 'Total Visits',
      value: analytics?.total_visits || 0,
      icon: Eye,
      color: 'text-[#5B5BF7]',
      bg: 'bg-[#5B5BF7]/10'
    },
    {
      title: 'Today',
      value: analytics?.visits_today || 0,
      icon: Calendar,
      color: 'text-[#00C9A7]',
      bg: 'bg-[#00C9A7]/10'
    },
    {
      title: 'This Week',
      value: analytics?.visits_this_week || 0,
      icon: TrendingUp,
      color: 'text-orange-500',
      bg: 'bg-orange-100'
    },
    {
      title: 'This Month',
      value: analytics?.visits_this_month || 0,
      icon: Users,
      color: 'text-pink-500',
      bg: 'bg-pink-100'
    }
  ];

  return (
    <div data-testid="admin-dashboard" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Dashboard
        </h1>
        <p className="text-slate-600">Welcome back! Here's an overview of your website analytics.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border border-slate-100 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900">{stat.value.toLocaleString()}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Device Distribution */}
        <Card className="border border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-[#5B5BF7]" />
              Device Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Countries */}
        <Card className="border border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#5B5BF7]" />
              Traffic by Country
            </CardTitle>
          </CardHeader>
          <CardContent>
            {countryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={countryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#5B5BF7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Pages */}
      <Card className="border border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#5B5BF7]" />
            Top Pages
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topPagesData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Page</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Views</th>
                  </tr>
                </thead>
                <tbody>
                  {topPagesData.map((page, index) => (
                    <tr key={index} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm text-slate-700">{page.path}</td>
                      <td className="py-3 px-4 text-sm text-slate-900 text-right font-medium">
                        {page.views.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400">
              No page view data available yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import ChartCard from '../components/ChartCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorState from '../components/ErrorState';
import { BarChart3, TrendingUp, Filter, RefreshCw, Calendar } from 'lucide-react';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

const AnalyticsPage = () => {
  const navigate = useNavigate();
  const { currency, dateRange, setDateRange } = useApp();

  const [revenueTrend, setRevenueTrend] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [deliveryData, setDeliveryData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('start_date', dateRange.startDate);
      if (dateRange.endDate) params.append('end_date', dateRange.endDate);

      const [trendRes, catRes, delRes] = await Promise.all([
        api.get(`/analytics/revenue?${params.toString()}`),
        api.get('/analytics/categories'),
        api.get('/analytics/delivery-performance'),
      ]);

      setRevenueTrend(trendRes);
      setCategoryData(catRes);
      setDeliveryData(delRes);
    } catch (err) {
      setError(err.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Advanced Analytics" subtitle="Loading charts..." />
        <LoadingSkeleton height="300px" count={2} />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchAnalytics} />;
  }

  return (
    <div>
      <PageHeader title="Advanced Analytics Engine" subtitle="Deep-dive reports on sales revenue, category growth, and fulfillment timelines">
        <button className="btn btn-primary" onClick={fetchAnalytics}>
          <RefreshCw size={16} /> Refresh Charts
        </button>
      </PageHeader>

      <div className="filter-bar">
        <div className="filter-group">
          <Calendar size={16} style={{ color: '#64748b' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Date Filter:</span>
        </div>
        <input
          type="date"
          className="filter-input"
          value={dateRange.startDate}
          onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
        />
        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>to</span>
        <input
          type="date"
          className="filter-input"
          value={dateRange.endDate}
          onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
        />
      </div>

      <div className="charts-grid">
        {/* Revenue Trend */}
        <ChartCard title={`Revenue Timeline (${currency})`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip formatter={(val) => [`${currency} ${val.toFixed(2)}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#4f46e5" fill="#c7d2fe" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Order Volume Trend */}
        <ChartCard title="Daily Order Volume">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip formatter={(val) => [`${val} orders`, 'Orders']} />
              <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Category Performance */}
        <ChartCard title="Category Revenue Performance">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="category" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip formatter={(val) => [`${currency} ${val.toFixed(2)}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Delivery Performance */}
        <ChartCard title="Fulfillment Status Share">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={deliveryData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="count"
                nameKey="status"
                label={(entry) => `${entry.status}: ${entry.percentage}%`}
              >
                {deliveryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

export default AnalyticsPage;

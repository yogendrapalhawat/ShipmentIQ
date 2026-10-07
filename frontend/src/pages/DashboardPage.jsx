import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorState from '../components/ErrorState';

import {
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
  UploadCloud,
  Filter,
  RefreshCw,
} from 'lucide-react';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];

const DashboardPage = () => {
  const navigate = useNavigate();
  const {
    currency,
    dateRange,
    setDateRange,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    metricToggle,
    setMetricToggle,
    resetFilters,
  } = useApp();

  const [summary, setSummary] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [deliveryPerformance, setDeliveryPerformance] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (currency) params.append('currency', currency);
      if (dateRange.startDate) params.append('start_date', dateRange.startDate);
      if (dateRange.endDate) params.append('end_date', dateRange.endDate);
      if (categoryFilter) params.append('category', categoryFilter);
      if (statusFilter) params.append('status', statusFilter);

      const [sumRes, trendRes, catRes, delRes, ordRes] = await Promise.all([
        api.get(`/dashboard/summary?${params.toString()}`),
        api.get(`/analytics/revenue?${params.toString()}`),
        api.get('/analytics/categories'),
        api.get('/analytics/delivery-performance'),
        api.get('/orders?page=1&page_size=5'),
      ]);

      setSummary(sumRes);
      setRevenueTrend(trendRes);
      setCategoryData(catRes);
      setDeliveryPerformance(delRes);
      setRecentOrders(ordRes.items);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currency, dateRange, categoryFilter, statusFilter]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Overview Dashboard" subtitle="Loading metrics..." />
        <LoadingSkeleton height="120px" count={4} />
        <div style={{ marginTop: '1.5rem' }}>
          <LoadingSkeleton height="320px" count={2} />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  const formatCurrency = (amount) => {
    return `${summary?.currency || 'USD'} ${Number(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const orderColumns = [
    { header: 'Order Code', accessor: 'order_code', cell: (row) => <strong>{row.order_code}</strong> },
    { header: 'Customer', accessor: 'customer_name' },
    { header: 'Date', accessor: 'order_date', cell: (row) => new Date(row.order_date).toLocaleDateString() },
    { header: 'Items', accessor: 'item_count', align: 'center' },
    { header: 'Total', accessor: 'total_amount', cell: (row) => formatCurrency(row.total_amount) },
    { header: 'Status', accessor: 'shipment_status', cell: (row) => <StatusBadge status={row.shipment_status} isDelayed={row.is_delayed} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Overview Dashboard"
        subtitle={`Real-time shipment and order logistics performance • Last updated: ${
          summary?.dataset_last_updated ? new Date(summary.dataset_last_updated).toLocaleString() : 'Just now'
        }`}
      >
        <button className="btn btn-secondary" onClick={() => navigate('/imports')}>
          <UploadCloud size={16} /> Import Data
        </button>
        <button className="btn btn-primary" onClick={fetchData}>
          <RefreshCw size={16} /> Refresh
        </button>
      </PageHeader>

      {/* Filter Toolbar */}
      <div className="filter-bar">
        <div className="filter-group">
          <Filter size={16} style={{ color: '#64748b' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Filters:</span>
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

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Shipment Statuses</option>
          <option value="Delivered">Delivered</option>
          <option value="Delayed">Delayed</option>
          <option value="In Transit">In Transit</option>
          <option value="Pending">Pending</option>
        </select>

        {(dateRange.startDate || dateRange.endDate || categoryFilter || statusFilter) && (
          <button className="btn btn-secondary" onClick={resetFilters} style={{ padding: '0.4rem 0.75rem' }}>
            Reset Filters
          </button>
        )}

        {/* View Toggle Button */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.35rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '8px' }}>
          <button
            className={`btn ${metricToggle === 'revenue' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => setMetricToggle('revenue')}
          >
            Revenue View
          </button>
          <button
            className={`btn ${metricToggle === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => setMetricToggle('orders')}
          >
            Orders View
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="stats-grid">
        <StatCard
          title="Total Orders"
          value={summary?.total_orders || 0}
          subtitle="Total ingested orders"
          icon={ShoppingBag}
          color="indigo"
          onClick={() => navigate('/orders')}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(summary?.converted_revenue || summary?.total_revenue)}
          subtitle={summary?.currency !== 'USD' ? `Converted from USD @ 1:${summary?.exchange_rate}` : 'Original source currency'}
          icon={DollarSign}
          color="green"
          onClick={() => navigate('/analytics')}
        />
        <StatCard
          title="Delayed Orders"
          value={summary?.delayed_orders || 0}
          subtitle={`Over threshold (${5} days) or marked late`}
          icon={AlertTriangle}
          color="amber"
          onClick={() => navigate('/shipments?status=Delayed')}
        />
        <StatCard
          title="Delivered Orders"
          value={summary?.delivered_orders || 0}
          subtitle="Successfully fulfilled"
          icon={CheckCircle2}
          color="blue"
          onClick={() => navigate('/shipments?status=Delivered')}
        />
        <StatCard
          title="Avg Order Value"
          value={formatCurrency(summary?.avg_order_value)}
          subtitle={`Avg delivery duration: ${summary?.avg_delivery_days || 0} days`}
          icon={TrendingUp}
          color="purple"
          onClick={() => navigate('/orders')}
        />
      </div>

      {/* Interactive Charts Section */}
      <div className="charts-grid">
        {/* Metric Trend Chart */}
        <ChartCard
          title={metricToggle === 'revenue' ? 'Revenue Trend' : 'Order Volume Trend'}
          action={<span style={{ fontSize: '0.8rem', color: '#64748b' }}>Daily Aggregation</span>}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                formatter={(val) => [metricToggle === 'revenue' ? formatCurrency(val) : val, metricToggle === 'revenue' ? 'Revenue' : 'Orders']}
              />
              <Area
                type="monotone"
                dataKey={metricToggle === 'revenue' ? 'revenue' : 'orders'}
                stroke="#4f46e5"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorMetric)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Category Revenue Chart */}
        <ChartCard title="Category Revenue Share">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" stroke="#64748b" fontSize={12} />
              <YAxis dataKey="category" type="category" stroke="#64748b" fontSize={12} width={110} />
              <Tooltip formatter={(val) => [formatCurrency(val), 'Revenue']} />
              <Bar dataKey="revenue" fill="#4f46e5" radius={[0, 4, 4, 0]}>
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Delivery Performance & Recent Orders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        <ChartCard title="Delivery Status Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={deliveryPerformance}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="count"
                nameKey="status"
              >
                {deliveryPerformance.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val, name, props) => [`${val} orders (${props.payload.percentage}%)`, props.payload.status]} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Recent Activity Table */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>Recent Orders</h3>
            <button className="btn btn-secondary" onClick={() => navigate('/orders')} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              View All Orders
            </button>
          </div>
          <DataTable
            columns={orderColumns}
            data={recentOrders}
            onRowClick={(row) => navigate(`/orders/${row.id}`)}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

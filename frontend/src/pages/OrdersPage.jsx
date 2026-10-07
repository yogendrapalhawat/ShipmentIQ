import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { Search, Download, Filter, RefreshCw } from 'lucide-react';

const OrdersPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currency, dateRange, setDateRange, statusFilter, setStatusFilter } = useApp();

  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('order_date');
  const [sortOrder, setSortOrder] = useState('desc');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('page_size', 10);
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (dateRange.startDate) params.append('start_date', dateRange.startDate);
      if (dateRange.endDate) params.append('end_date', dateRange.endDate);
      params.append('sort_by', sortCol);
      params.append('order', sortOrder);

      const res = await api.get(`/orders?${params.toString()}`);
      setOrders(res.items);
      setTotal(res.total);
      setPages(res.pages);
    } catch (err) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, search, statusFilter, dateRange, sortCol, sortOrder]);

  const handleExportCSV = () => {
    window.open('/api/v1/analytics/export', '_blank');
  };

  const columns = [
    { header: 'Order Code', accessor: 'order_code', cell: (row) => <strong>{row.order_code}</strong> },
    { header: 'Customer', accessor: 'customer_name' },
    { header: 'Order Date', accessor: 'order_date', cell: (row) => new Date(row.order_date).toLocaleDateString() },
    { header: 'Items', accessor: 'item_count', align: 'center' },
    {
      header: 'Total Amount',
      accessor: 'total_amount',
      cell: (row) => `${currency} ${Number(row.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      header: 'Shipment Status',
      accessor: 'shipment_status',
      cell: (row) => <StatusBadge status={row.shipment_status} isDelayed={row.is_delayed} />,
    },
    {
      header: 'Delivery Days',
      accessor: 'delivery_days',
      align: 'center',
      cell: (row) => (row.delivery_days !== null ? `${row.delivery_days} days` : 'N/A'),
    },
  ];

  return (
    <div>
      <PageHeader title="Order Management" subtitle="View, filter, and inspect detailed order records">
        <button className="btn btn-secondary" onClick={handleExportCSV}>
          <Download size={16} /> Export CSV
        </button>
        <button className="btn btn-primary" onClick={fetchOrders}>
          <RefreshCw size={16} /> Refresh
        </button>
      </PageHeader>

      <div className="filter-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
          <Search size={16} style={{ color: '#64748b' }} />
          <input
            type="text"
            className="filter-input"
            placeholder="Search by order code, customer name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ width: '100%' }}
          />
        </div>

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          <option value="Delivered">Delivered</option>
          <option value="Delayed">Delayed</option>
          <option value="In Transit">In Transit</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {loading ? (
        <LoadingSkeleton height="60px" count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchOrders} />
      ) : orders.length === 0 ? (
        <EmptyState title="No orders found" description="Try clearing search or changing filters." />
      ) : (
        <div>
          <DataTable
            columns={columns}
            data={orders}
            onRowClick={(row) => navigate(`/orders/${row.id}`)}
          />
          <Pagination
            page={page}
            pages={pages}
            total={total}
            pageSize={10}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}
    </div>
  );
};

export default OrdersPage;

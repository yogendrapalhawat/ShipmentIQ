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
import { Search, RefreshCw } from 'lucide-react';

const ShipmentsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [shipments, setShipments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchShipments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('page_size', 10);
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/shipments?${params.toString()}`);
      setShipments(res.items);
      setTotal(res.total);
      setPages(res.pages);
    } catch (err) {
      setError(err.message || 'Failed to fetch shipments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [page, search, statusFilter]);

  const columns = [
    { header: 'Shipment Code', accessor: 'shipment_code', cell: (row) => <strong>{row.shipment_code}</strong> },
    { header: 'Order Code', accessor: 'order_code' },
    { header: 'Customer', accessor: 'customer_name' },
    { header: 'Status', accessor: 'status', cell: (row) => <StatusBadge status={row.status} isDelayed={row.is_delayed} /> },
    { header: 'Delivery Days', accessor: 'delivery_days', align: 'center', cell: (row) => `${row.delivery_days} days` },
  ];

  return (
    <div>
      <PageHeader title="Shipments Tracker" subtitle="Monitor fulfillment and logistics status across all carriers">
        <button className="btn btn-primary" onClick={fetchShipments}>
          <RefreshCw size={16} /> Refresh
        </button>
      </PageHeader>

      <div className="filter-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
          <Search size={16} style={{ color: '#64748b' }} />
          <input
            type="text"
            className="filter-input"
            placeholder="Search shipment code, order, customer..."
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
        <ErrorState message={error} onRetry={fetchShipments} />
      ) : shipments.length === 0 ? (
        <EmptyState title="No shipments found" description="Try clearing your search or status filter." />
      ) : (
        <div>
          <DataTable
            columns={columns}
            data={shipments}
            onRowClick={(row) => row.order_id && navigate(`/orders/${row.order_id}`)}
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

export default ShipmentsPage;

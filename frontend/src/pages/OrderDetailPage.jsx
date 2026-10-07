import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorState from '../components/ErrorState';
import { ArrowLeft, User, Package, Calendar, Truck, DollarSign, AlertCircle } from 'lucide-react';

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { currency } = useApp();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/orders/${orderId}`)
      .then((data) => setOrder(data))
      .catch((err) => setError(err.message || 'Failed to load order details'))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Order Detail" subtitle="Loading..." />
        <LoadingSkeleton height="250px" count={2} />
      </div>
    );
  }

  if (error || !order) {
    return <ErrorState message={error || 'Order not found'} onRetry={() => navigate('/orders')} />;
  }

  return (
    <div>
      <PageHeader title={`Order ${order.order_code}`} subtitle={`Placed on ${new Date(order.order_date).toLocaleDateString()}`}>
        <button className="btn btn-secondary" onClick={() => navigate('/orders')}>
          <ArrowLeft size={16} /> Back to Orders
        </button>
      </PageHeader>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Customer Information */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#4f46e5' }}>
            <User size={20} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0f172a' }}>Customer Summary</h3>
          </div>
          <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}><strong>Name:</strong> {order.customer_name}</p>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}><strong>Customer ID:</strong> {order.customer_id || 'N/A'}</p>
        </div>

        {/* Shipment Status */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#4f46e5' }}>
            <Truck size={20} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0f172a' }}>Shipment Overview</h3>
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <StatusBadge status={order.shipment_status} isDelayed={order.is_delayed} />
          </div>
          <p style={{ fontSize: '0.9rem', color: '#475569' }}>
            <strong>Delivery Days:</strong> {order.delivery_days !== null ? `${order.delivery_days} days` : 'In Progress'}
          </p>
        </div>

        {/* Total Summary */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#4f46e5' }}>
            <DollarSign size={20} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0f172a' }}>Order Financials</h3>
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            {currency} {Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>Total Item Count: {order.item_count}</p>
        </div>
      </div>

      {/* Itemized Line Items Table */}
      <div className="table-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem' }}>
          Itemized Products
        </h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Product Code</th>
              <th>Product Name</th>
              <th style={{ textAlign: 'center' }}>Quantity</th>
              <th style={{ textAlign: 'right' }}>Unit Price</th>
              <th style={{ textAlign: 'right' }}>Line Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.product_code}</strong></td>
                <td>{item.product_name}</td>
                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>{currency} {Number(item.unit_price).toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}><strong>{currency} {Number(item.total_price).toFixed(2)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderDetailPage;

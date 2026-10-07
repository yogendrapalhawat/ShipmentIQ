import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { Search, RefreshCw } from 'lucide-react';

const ProductsPage = () => {
  const { currency, categoryFilter, setCategoryFilter } = useApp();

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('page_size', 10);
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);

      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.items);
      setTotal(res.total);
      setPages(res.pages);
    } catch (err) {
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search, categoryFilter]);

  const columns = [
    { header: 'Product Code', accessor: 'product_code', cell: (row) => <strong>{row.product_code}</strong> },
    { header: 'Product Name', accessor: 'name' },
    {
      header: 'Category',
      accessor: 'category',
      cell: (row) => (
        <span
          style={{
            padding: '0.2rem 0.5rem',
            backgroundColor: '#e0e7ff',
            color: '#3730a3',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          {row.category}
        </span>
      ),
    },
    {
      header: 'Unit Price',
      accessor: 'price',
      align: 'right',
      cell: (row) => `${currency} ${Number(row.price).toFixed(2)}`,
    },
    { header: 'Order Count', accessor: 'order_count', align: 'center' },
    {
      header: 'Total Revenue',
      accessor: 'total_revenue',
      align: 'right',
      cell: (row) => `${currency} ${Number(row.total_revenue).toFixed(2)}`,
    },
  ];

  return (
    <div>
      <PageHeader title="Products Catalog" subtitle="Track product sales, categories, and inventory catalog performance">
        <button className="btn btn-primary" onClick={fetchProducts}>
          <RefreshCw size={16} /> Refresh
        </button>
      </PageHeader>

      <div className="filter-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
          <Search size={16} style={{ color: '#64748b' }} />
          <input
            type="text"
            className="filter-input"
            placeholder="Search product code or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton height="60px" count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchProducts} />
      ) : products.length === 0 ? (
        <EmptyState title="No products found" description="Try adjusting your search criteria." />
      ) : (
        <div>
          <DataTable columns={columns} data={products} />
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

export default ProductsPage;

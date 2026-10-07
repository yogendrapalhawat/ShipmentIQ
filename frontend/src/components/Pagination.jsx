import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ page, pages, onPageChange, total, pageSize }) => {
  if (pages <= 1) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        padding: '1rem 0',
        marginTop: '1rem',
      }}
    >
      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
        Showing page {page} of {pages} ({total} total records)
      </span>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          className="btn btn-secondary"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          style={{ padding: '0.4rem 0.75rem', opacity: page <= 1 ? 0.5 : 1 }}
        >
          <ChevronLeft size={16} /> Previous
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          style={{ padding: '0.4rem 0.75rem', opacity: page >= pages ? 0.5 : 1 }}
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;

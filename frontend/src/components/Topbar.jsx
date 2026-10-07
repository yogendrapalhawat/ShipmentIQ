import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Search, Globe } from 'lucide-react';

const Topbar = () => {
  const { currency, setCurrency, currencies } = useApp();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
          <Search size={18} />
          <span style={{ fontSize: '0.875rem' }}>Search orders, shipments, customers...</span>
        </div>
      </div>

      <div className="topbar-right">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Globe size={16} style={{ color: '#64748b' }} />
          <select
            className="currency-select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} ({c.symbol || c.code})
              </option>
            ))}
          </select>
        </div>

        <button style={{ position: 'relative', color: '#64748b', padding: '0.4rem' }}>
          <Bell size={20} />
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '8px',
              height: '8px',
              backgroundColor: '#ef4444',
              borderRadius: '50%',
            }}
          />
        </button>
      </div>
    </header>
  );
};

export default Topbar;

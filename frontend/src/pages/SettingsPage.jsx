import React from 'react';
import { useApp } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import { Settings, Save, ShieldAlert } from 'lucide-react';

const SettingsPage = () => {
  const { currency, setCurrency, currencies, settings, setSettings, addToast } = useApp();

  const handleSave = (e) => {
    e.preventDefault();
    addToast('Settings saved successfully!', 'success');
  };

  return (
    <div>
      <PageHeader title="Application Settings" subtitle="Configure system parameters, thresholds, and currency preferences" />

      <form onSubmit={handleSave} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.75rem', maxWidth: '640px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={20} style={{ color: '#4f46e5' }} /> General Preferences
        </h3>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
            Default Platform Currency
          </label>
          <select
            className="filter-select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            style={{ width: '100%' }}
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} - {c.name} ({c.symbol})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
            Expected Delivery Threshold (Days)
          </label>
          <input
            type="number"
            className="filter-input"
            value={settings.expectedDeliveryThreshold}
            onChange={(e) => setSettings({ ...settings, expectedDeliveryThreshold: parseInt(e.target.value) || 5 })}
            style={{ width: '100%' }}
            min="1"
            max="30"
          />
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            Shipments with delivery days exceeding this threshold will automatically be flagged as <strong>Delayed</strong>.
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
            Default Table Page Size
          </label>
          <select
            className="filter-select"
            value={settings.pageSize}
            onChange={(e) => setSettings({ ...settings, pageSize: parseInt(e.target.value) })}
            style={{ width: '100%' }}
          >
            <option value={5}>5 records per page</option>
            <option value={10}>10 records per page</option>
            <option value={25}>25 records per page</option>
            <option value={50}>50 records per page</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary">
          <Save size={16} /> Save Preferences
        </button>
      </form>
    </div>
  );
};

export default SettingsPage;

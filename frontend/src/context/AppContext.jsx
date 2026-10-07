import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currency, setCurrency] = useState('USD');
  const [currencies, setCurrencies] = useState([]);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [metricToggle, setMetricToggle] = useState('revenue'); // 'revenue' | 'orders'
  const [toasts, setToasts] = useState([]);

  // Application Settings
  const [settings, setSettings] = useState({
    defaultCurrency: 'USD',
    expectedDeliveryThreshold: 5,
    pageSize: 10,
  });

  useEffect(() => {
    // Fetch available currencies
    api.get('/currencies')
      .then((data) => setCurrencies(data))
      .catch(() => {
        setCurrencies([
          { code: 'USD', name: 'US Dollar', symbol: '$', rate_to_usd: 1.0 },
          { code: 'EUR', name: 'Euro', symbol: '€', rate_to_usd: 0.92 },
          { code: 'GBP', name: 'British Pound', symbol: '£', rate_to_usd: 0.79 },
          { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate_to_usd: 83.15 },
        ]);
      });
  }, []);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const resetFilters = () => {
    setDateRange({ startDate: '', endDate: '' });
    setCategoryFilter('');
    setStatusFilter('');
  };

  return (
    <AppContext.Provider
      value={{
        currency,
        setCurrency,
        currencies,
        dateRange,
        setDateRange,
        categoryFilter,
        setCategoryFilter,
        statusFilter,
        setStatusFilter,
        metricToggle,
        setMetricToggle,
        toasts,
        addToast,
        removeToast,
        resetFilters,
        settings,
        setSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Truck, Package, BarChart3, UploadCloud, Settings, Box } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Orders', icon: ShoppingBag, path: '/orders' },
    { label: 'Shipments', icon: Truck, path: '/shipments' },
    { label: 'Products', icon: Package, path: '/products' },
    { label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { label: 'Data Import', icon: UploadCloud, path: '/imports' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-logo">
          <Box size={22} />
        </div>
        <span className="brand-title">ShipmentIQ</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <p>ShipmentIQ v1.0.0</p>
        <p>Order & Delivery Platform</p>
      </div>
    </aside>
  );
};

export default Sidebar;

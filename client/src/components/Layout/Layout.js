import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiHome, FiClipboard, FiUsers, FiSettings, FiAward, FiBarChart2, FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi';

const Layout = () => {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Функция для определения активного пункта меню
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Функция для переключения боковой панели
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Функция для закрытия боковой панели на мобильных устройствах
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="app-container">
      {/* Боковая панель */}
      <div className={`sidebar ${sidebarOpen ? 'active' : ''}`}>
        <div className="sidebar-brand">
          <h2>VIPАвто</h2>
          <button className="sidebar-close" onClick={closeSidebar}>
            <FiX />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <Link 
            to="/dashboard" 
            className={`sidebar-nav-item ${isActive('/dashboard') ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <FiHome />
            <span>Дашборд</span>
          </Link>
          
          <Link 
            to="/orders" 
            className={`sidebar-nav-item ${isActive('/orders') ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <FiClipboard />
            <span>Заказы</span>
          </Link>
          
          {(hasRole('director') || hasRole('admin')) && (
            <Link 
              to="/masters" 
              className={`sidebar-nav-item ${isActive('/masters') ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <FiUsers />
              <span>Мастера</span>
            </Link>
          )}
          
          {(hasRole('director') || hasRole('admin')) && (
            <Link 
              to="/settings" 
              className={`sidebar-nav-item ${isActive('/settings') ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <FiSettings />
              <span>Настройки</span>
            </Link>
          )}
          
          <Link 
            to={hasRole('master') ? "/bonuses/my" : "/bonuses"} 
            className={`sidebar-nav-item ${isActive('/bonuses') ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <FiAward />
            <span>{hasRole('master') ? 'Мои бонусы' : 'Бонусы'}</span>
          </Link>
          
          {(hasRole('director') || hasRole('admin')) && (
            <Link 
              to="/stats" 
              className={`sidebar-nav-item ${isActive('/stats') ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <FiBarChart2 />
              <span>Статистика</span>
            </Link>
          )}
          
          <Link 
            to="/profile" 
            className={`sidebar-nav-item ${isActive('/profile') ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <FiUser />
            <span>Профиль</span>
          </Link>
        </nav>
      </div>
      
      {/* Основной контент */}
      <div className="main-content">
        {/* Верхняя панель */}
        <div className="topbar">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <FiMenu />
          </button>
          
          <div className="topbar-user">
            <span className="user-name">{user?.full_name}</span>
            <span className="user-role">({user?.role === 'director' ? 'Директор' : user?.role === 'admin' ? 'Администратор' : 'Мастер'})</span>
            <button className="logout-btn" onClick={logout} title="Выйти">
              <FiLogOut />
            </button>
          </div>
        </div>
        
        {/* Контент страницы */}
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
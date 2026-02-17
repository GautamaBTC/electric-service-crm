import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';


// Компоненты
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import Orders from './components/Orders/Orders';
import OrderForm from './components/Orders/OrderForm';
import OrderDetail from './components/Orders/OrderDetail';
import Masters from './components/Masters/Masters';
import MasterForm from './components/Masters/MasterForm';
import MasterDetail from './components/Masters/MasterDetail';
import Settings from './components/Settings/Settings';
import Bonuses from './components/Bonuses/Bonuses';
import BonusDetail from './components/Bonuses/BonusDetail';
import Stats from './components/Stats/Stats';
import Profile from './components/Profile/Profile';
import NotFound from './components/Common/NotFound';

// Сервисы
import { authService } from './services/authService';
import { AuthProvider } from './contexts/AuthContext';

// Проверка аутентификации
const AuthenticatedRoute = ({ children }) => {
  const { data: user, isLoading, error } = useQuery(['user'], () => authService.getCurrentUser(), {
    retry: false,
    onSuccess: (data) => {
      console.log('✅ AuthenticatedRoute: Пользователь успешно аутентифицирован', data);
    },
    onError: (error) => {
      console.error('❌ AuthenticatedRoute: Ошибка при проверке аутентификации', error);
    }
  });

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  console.log('🔍 AuthenticatedRoute: Данные пользователя', user, 'Ошибка:', error);
  return user ? children : <Navigate to="/login" />;
};

// Проверка роли
const RoleRoute = ({ children, roles }) => {
  const { data: user, isLoading } = useQuery(['user'], () => authService.getCurrentUser(), {
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        
        <Routes>
          {/* Публичные маршруты */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Защищенные маршруты */}
          <Route path="/" element={
            <AuthenticatedRoute>
              <Layout />
            </AuthenticatedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* Дашборд */}
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Заказы */}
            <Route path="orders" element={<Orders />} />
            <Route path="orders/new" element={<OrderForm />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="orders/:id/edit" element={<OrderForm />} />
            
            {/* Мастера (только для директора и администратора) */}
            <Route path="masters" element={
              <RoleRoute roles={['director', 'admin']}>
                <Masters />
              </RoleRoute>
            } />
            <Route path="masters/new" element={
              <RoleRoute roles={['director', 'admin']}>
                <MasterForm />
              </RoleRoute>
            } />
            <Route path="masters/:id" element={<MasterDetail />} />
            <Route path="masters/:id/edit" element={
              <RoleRoute roles={['director', 'admin']}>
                <MasterForm />
              </RoleRoute>
            } />
            
            {/* Настройки (только для директора и администратора) */}
            <Route path="settings" element={
              <RoleRoute roles={['director', 'admin']}>
                <Settings />
              </RoleRoute>
            } />
            
            {/* Бонусы */}
            <Route path="bonuses" element={
              <RoleRoute roles={['director', 'admin']}>
                <Bonuses />
              </RoleRoute>
            } />
            <Route path="bonuses/my" element={
              <RoleRoute roles={['master']}>
                <Bonuses />
              </RoleRoute>
            } />
            <Route path="bonuses/:id" element={<BonusDetail />} />
            
            {/* Статистика (только для директора и администратора) */}
            <Route path="stats" element={
              <RoleRoute roles={['director', 'admin']}>
                <Stats />
              </RoleRoute>
            } />
            
            {/* Профиль */}
            <Route path="profile" element={<Profile />} />
          </Route>
          
          {/* Страница не найдена */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
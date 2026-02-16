import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';

// Создаем контекст
const AuthContext = createContext();

// Хук для использования контекста
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Компонент-поставщик контекста
export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [user, setUser] = useState(authService.getUserFromStorage());
  const [isLoading, setIsLoading] = useState(true);

  // Запрос для получения данных текущего пользователя
  const { data, error, isLoading: isQueryLoading } = useQuery(
    'user',
    authService.getCurrentUser,
    {
      enabled: isAuthenticated,
      retry: false,
      onSuccess: (response) => {
        if (response.success) {
          setUser(response.data.user);
        } else {
          // Если ответ не успешный, разлогиниваем пользователя
          handleLogout();
        }
      },
      onError: (error) => {
        // Если ошибка 401, разлогиниваем пользователя
        if (error.response?.status === 401) {
          handleLogout();
        }
      },
    }
  );

  // Функция для входа в систему
  const login = async (phone, password) => {
    setIsLoading(true);
    
    try {
      const response = await authService.login(phone, password);
      
      if (response.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        toast.success('Вход выполнен успешно');
        return { success: true };
      } else {
        toast.error(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Ошибка при входе в систему';
      toast.error(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для регистрации
  const register = async (userData) => {
    setIsLoading(true);
    
    try {
      const response = await authService.register(userData);
      
      if (response.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        toast.success('Регистрация выполнена успешно');
        return { success: true };
      } else {
        toast.error(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Ошибка при регистрации';
      toast.error(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для выхода из системы
  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Ошибка при выходе из системы:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      queryClient.clear();
      toast.success('Выход выполнен успешно');
    }
  };

  // Функция для обновления профиля
  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      
      if (response.success) {
        setUser(response.data.user);
        toast.success('Профиль успешно обновлен');
        return { success: true };
      } else {
        toast.error(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Ошибка при обновлении профиля';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Функция для проверки, имеет ли пользователь определенную роль
  const hasRole = (role) => {
    return user ? user.role === role : false;
  };

  // Функция для проверки, имеет ли пользователь одну из указанных ролей
  const hasAnyRole = (roles) => {
    return user ? roles.includes(user.role) : false;
  };

  // Эффект для обновления состояния аутентификации при изменении данных пользователя
  useEffect(() => {
    if (data && data.success) {
      setUser(data.data.user);
      setIsAuthenticated(true);
    }
  }, [data]);

  // Эффект для обновления состояния загрузки
  useEffect(() => {
    setIsLoading(isQueryLoading);
  }, [isQueryLoading]);

  // Значения, которые будут доступны в контексте
  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout: handleLogout,
    updateProfile,
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
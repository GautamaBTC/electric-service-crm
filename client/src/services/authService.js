import axios from 'axios';

// Базовый URL API
const API_URL = process.env.REACT_APP_API_URL || '/api';

// Создаем экземпляр axios с настройками
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Перехватчик запросов для добавления токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Перехватчик ответов для обработки ошибок
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Если токен истек или недействителен, разлогиниваем пользователя
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Функция для входа в систему
export const login = async (phone, password) => {
  try {
    console.log('🔐 authService.login: Отправка запроса на вход', { phone, password: '***' });
    const response = await api.post('/auth/login', { phone, password });
    
    console.log('📋 authService.login: Ответ сервера', response.data);
    
    if (response.data.success) {
      const { token, master } = response.data.data;
      
      console.log('✅ authService.login: Вход успешен, сохранение токена и пользователя');
      
      // Сохраняем токен и данные пользователя
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(master));
      
      console.log('✅ authService.login: Токен и пользователь сохранены в localStorage');
      
      return { success: true, data: { token, user: master } };
    }
    
    console.log('❌ authService.login: Вход неуспешен', response.data.message);
    return { success: false, message: response.data.message };
  } catch (error) {
    console.error('❌ authService.login: Ошибка при входе', error);
    const message = error.response?.data?.message || 'Ошибка при входе в систему';
    return { success: false, message };
  }
};

// Функция для регистрации
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    
    if (response.data.success) {
      const { token, master } = response.data.data;
      
      // Сохраняем токен и данные пользователя
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(master));
      
      return { success: true, data: { token, user: master } };
    }
    
    return { success: false, message: response.data.message };
  } catch (error) {
    const message = error.response?.data?.message || 'Ошибка при регистрации';
    return { success: false, message };
  }
};

// Функция для выхода из системы
export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Ошибка при выходе из системы:', error);
  } finally {
    // Удаляем токен и данные пользователя
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Функция для получения данных текущего пользователя
export const getCurrentUser = async () => {
  try {
    console.log('🔐 authService.getCurrentUser: Запрос данных текущего пользователя');
    const token = localStorage.getItem('token');
    console.log('🔍 authService.getCurrentUser: Токен в localStorage', !!token);
    
    const response = await api.get('/auth/me');
    
    console.log('📋 authService.getCurrentUser: Ответ сервера', response.data);
    
    if (response.data.success) {
      const { master } = response.data.data;
      
      // Обновляем данные пользователя в localStorage
      localStorage.setItem('user', JSON.stringify(master));
      
      console.log('✅ authService.getCurrentUser: Данные пользователя обновлены');
      
      return { success: true, data: { user: master } };
    }
    
    console.log('❌ authService.getCurrentUser: Ответ не успешен', response.data.message);
    return { success: false, message: response.data.message };
  } catch (error) {
    console.error('❌ authService.getCurrentUser: Ошибка при получении данных пользователя', error);
    
    // Если ошибка 401, удаляем токен и данные пользователя
    if (error.response?.status === 401) {
      console.log('🔐 authService.getCurrentUser: Удаление токена и данных пользователя из-за ошибки 401');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    
    throw error;
  }
};

// Функция для обновления профиля
export const updateProfile = async (profileData) => {
  try {
    const response = await api.put('/auth/update-profile', profileData);
    
    if (response.data.success) {
      const { master } = response.data.data;
      
      // Обновляем данные пользователя в localStorage
      localStorage.setItem('user', JSON.stringify(master));
      
      return { success: true, data: { user: master } };
    }
    
    return { success: false, message: response.data.message };
  } catch (error) {
    const message = error.response?.data?.message || 'Ошибка при обновлении профиля';
    return { success: false, message };
  }
};

// Функция для проверки, аутентифицирован ли пользователь
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  return !!token && !!user;
};

// Функция для получения данных пользователя из localStorage
export const getUserFromStorage = () => {
  const user = localStorage.getItem('user');
  
  if (user) {
    try {
      return JSON.parse(user);
    } catch (error) {
      console.error('Ошибка при парсинге данных пользователя:', error);
      return null;
    }
  }
  
  return null;
};

// Функция для получения токена из localStorage
export const getToken = () => {
  return localStorage.getItem('token');
};

// Функция для получения роли пользователя
export const getUserRole = () => {
  const user = getUserFromStorage();
  return user ? user.role : null;
};

// Функция для проверки, имеет ли пользователь определенную роль
export const hasRole = (role) => {
  const userRole = getUserRole();
  return userRole === role;
};

// Функция для проверки, имеет ли пользователь одну из указанных ролей
export const hasAnyRole = (roles) => {
  const userRole = getUserRole();
  return roles.includes(userRole);
};

// Экспорт объекта api для использования в других компонентах
export { api };

// Экспорт объекта authService, содержащего все функции
export const authService = {
  login,
  register,
  logout,
  getCurrentUser,
  updateProfile,
  isAuthenticated,
  getUserFromStorage,
  getToken,
  getUserRole,
  hasRole,
  hasAnyRole,
};

export default api;
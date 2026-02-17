import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiUser, FiLock, FiEye, FiEyeOff, FiSave, FiPhone, FiShield } from 'react-icons/fi';
import { toast } from 'react-toastify';

// Сервисы
import { authService } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const queryClient = useQueryClient();
  
  // Состояние для показа пароля
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Форма
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });
  
  const newPassword = watch('newPassword');
  
  // Мутация для обновления профиля
  const updateProfileMutation = useMutation(
    authService.updateProfile,
    {
      onSuccess: (data) => {
        toast.success(data.message);
        queryClient.invalidateQueries('user');
        reset({
          full_name: data.data.user.full_name,
          phone: data.data.user.phone,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Ошибка при обновлении профиля');
      },
    }
  );
  
  // Обработка отправки формы
  const onSubmit = (data) => {
    // Форматируем данные для отправки
    const formattedData = {
      full_name: data.full_name,
      phone: data.phone,
    };
    
    // Добавляем пароль только если он указан
    if (data.currentPassword && data.newPassword) {
      formattedData.currentPassword = data.currentPassword;
      formattedData.newPassword = data.newPassword;
    }
    
    updateProfileMutation.mutate(formattedData);
  };
  
  // Обновляем форму при изменении пользователя
  React.useEffect(() => {
    if (user) {
      reset({
        full_name: user.full_name,
        phone: user.phone,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [user, reset]);
  
  // Функция для получения текста роли
  const getRoleText = (role) => {
    switch (role) {
      case 'director':
        return 'Директор';
      case 'admin':
        return 'Администратор';
      case 'master':
        return 'Мастер';
      default:
        return role;
    }
  };
  
  return (
    <div className="profile-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title">Мой профиль</h1>
      </div>
      
      <div className="row">
        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-body text-center">
              <div className="avatar-circle-xl mx-auto mb-3">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <h4>{user?.full_name}</h4>
              <p className="text-muted">{user?.phone}</p>
              <span className={`badge ${
                user?.role === 'director' ? 'bg-danger' : 
                user?.role === 'admin' ? 'bg-warning' : 'bg-primary'
              }`}>
                {getRoleText(user?.role)}
              </span>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Информация</h3>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <p className="text-muted mb-1">Роль</p>
                <p>{getRoleText(user?.role)}</p>
              </div>
              
              <div className="mb-3">
                <p className="text-muted mb-1">Статус</p>
                <p>
                  {user?.is_active ? (
                    <span className="badge badge-success">Активен</span>
                  ) : (
                    <span className="badge badge-danger">Неактивен</span>
                  )}
                </p>
              </div>
              
              <div>
                <p className="text-muted mb-1">Дата регистрации</p>
                <p>{user?.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : 'Неизвестно'}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Редактирование профиля</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="full_name" className="form-label">ФИО *</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FiUser />
                        </span>
                        <input
                          type="text"
                          className={`form-control ${errors.full_name ? 'is-invalid' : ''}`}
                          id="full_name"
                          placeholder="Введите ФИО"
                          {...register('full_name', {
                            required: 'Пожалуйста, введите ФИО',
                            minLength: {
                              value: 3,
                              message: 'ФИО должно содержать не менее 3 символов',
                            },
                          })}
                        />
                      </div>
                      {errors.full_name && (
                        <div className="invalid-feedback">{errors.full_name.message}</div>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="phone" className="form-label">Телефон *</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FiPhone />
                        </span>
                        <input
                          type="tel"
                          className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                          id="phone"
                          placeholder="+7 (999) 999-99-99"
                          {...register('phone', {
                            required: 'Пожалуйста, введите номер телефона',
                            pattern: {
                              value: /^(\+7|8)\d{10}$/,
                              message: 'Неверный формат номера телефона',
                            },
                          })}
                        />
                      </div>
                      {errors.phone && (
                        <div className="invalid-feedback">{errors.phone.message}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="currentPassword" className="form-label">Текущий пароль</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FiLock />
                        </span>
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          className={`form-control ${errors.currentPassword ? 'is-invalid' : ''}`}
                          id="currentPassword"
                          placeholder="Введите текущий пароль"
                          {...register('currentPassword', {
                            validate: (value) => {
                              if (!value && !newPassword) return true;
                              return !!value || 'Пожалуйста, введите текущий пароль';
                            },
                          })}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                      {errors.currentPassword && (
                        <div className="invalid-feedback">{errors.currentPassword.message}</div>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="newPassword" className="form-label">Новый пароль</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FiLock />
                        </span>
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
                          id="newPassword"
                          placeholder="Введите новый пароль"
                          {...register('newPassword', {
                            validate: (value) => {
                              if (!value && !watch('currentPassword')) return true;
                              return !!value || 'Пожалуйста, введите новый пароль';
                            },
                            minLength: {
                              value: 6,
                              message: 'Пароль должен содержать не менее 6 символов',
                            },
                          })}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                      {errors.newPassword && (
                        <div className="invalid-feedback">{errors.newPassword.message}</div>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="confirmPassword" className="form-label">Подтверждение пароля</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FiLock />
                        </span>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                          id="confirmPassword"
                          placeholder="Подтвердите новый пароль"
                          {...register('confirmPassword', {
                            validate: (value) => {
                              if (!value && !newPassword) return true;
                              return value === newPassword || 'Пароли не совпадают';
                            },
                          })}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <div className="invalid-feedback">{errors.confirmPassword.message}</div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="d-flex justify-content-end mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={updateProfileMutation.isLoading}
                  >
                    <FiSave /> Сохранить изменения
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          <div className="card mt-4">
            <div className="card-header">
              <h3 className="card-title">Безопасность</h3>
            </div>
            <div className="card-body">
              <div className="alert alert-info">
                <h5>Советы по безопасности</h5>
                <ul>
                  <li>Используйте сложный пароль, содержащий буквы, цифры и специальные символы.</li>
                  <li>Не используйте один и тот же пароль на разных сайтах.</li>
                  <li>Регулярно меняйте пароль.</li>
                  <li>Не сообщайте свой пароль никому.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
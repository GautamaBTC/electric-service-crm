import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { FiSave, FiX, FiUser, FiLock, FiPhone, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Сервисы
import { api } from '../../services/authService';

// Функция для получения мастера
const fetchMaster = async (id) => {
  const response = await api.get(`/masters/${id}`);
  return response.data.data;
};

// Функция для создания мастера
const createMaster = async (masterData) => {
  const response = await api.post('/masters', masterData);
  return response.data;
};

// Функция для обновления мастера
const updateMaster = async ({ id, ...masterData }) => {
  const response = await api.put(`/masters/${id}`, masterData);
  return response.data;
};

const MasterForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);
  
  // Состояние для показа пароля
  const [showPassword, setShowPassword] = useState(false);
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
      full_name: '',
      phone: '',
      password: '',
      confirm_password: '',
      role: 'master',
      is_active: true,
    },
  });
  
  const password = watch('password');
  
  // Запрос мастера при редактировании
  const { data: masterData, isLoading: isLoadingMaster } = useQuery(
    ['master', id],
    () => fetchMaster(id),
    {
      enabled: isEdit,
      onSuccess: (data) => {
        const master = data.master;
        
        // Заполняем форму данными мастера
        reset({
          full_name: master.full_name,
          phone: master.phone,
          password: '',
          confirm_password: '',
          role: master.role,
          is_active: master.is_active,
        });
      },
    }
  );
  
  // Мутация для создания мастера
  const createMasterMutation = useMutation(createMaster, {
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries('masters');
      navigate('/masters');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка при создании мастера');
    },
  });
  
  // Мутация для обновления мастера
  const updateMasterMutation = useMutation(updateMaster, {
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries('masters');
      queryClient.invalidateQueries(['master', id]);
      navigate(`/masters/${id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка при обновлении мастера');
    },
  });
  
  // Обработка отправки формы
  const onSubmit = (data) => {
    // Форматируем данные для отправки
    const formattedData = {
      full_name: data.full_name,
      phone: data.phone,
      role: data.role,
      is_active: data.is_active,
    };
    
    // Добавляем пароль только если он указан
    if (data.password) {
      formattedData.password = data.password;
    }
    
    if (isEdit) {
      updateMasterMutation.mutate({ id, ...formattedData });
    } else {
      createMasterMutation.mutate(formattedData);
    }
  };
  
  // Обработка состояния загрузки
  if (isEdit && isLoadingMaster) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }
  
  return (
    <div className="master-form-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title">{isEdit ? 'Редактирование мастера' : 'Создание мастера'}</h1>
        <button 
          type="button" 
          className="btn btn-outline-secondary" 
          onClick={() => navigate('/masters')}
        >
          <FiX /> Отмена
        </button>
      </div>
      
      <div className="card">
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
                
                <div className="form-group">
                  <label htmlFor="role" className="form-label">Роль *</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FiShield />
                    </span>
                    <select
                      className={`form-control ${errors.role ? 'is-invalid' : ''}`}
                      id="role"
                      {...register('role', {
                        required: 'Пожалуйста, выберите роль',
                      })}
                    >
                      <option value="master">Мастер</option>
                      <option value="director">Директор</option>
                      <option value="admin">Администратор</option>
                    </select>
                  </div>
                  {errors.role && (
                    <div className="invalid-feedback">{errors.role.message}</div>
                  )}
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    Пароль {!isEdit && '*'}
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FiLock />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                      id="password"
                      placeholder={isEdit ? 'Оставьте пустым, чтобы не менять' : 'Введите пароль'}
                      {...register('password', {
                        required: !isEdit ? 'Пожалуйста, введите пароль' : false,
                        minLength: {
                          value: 6,
                          message: 'Пароль должен содержать не менее 6 символов',
                        },
                      })}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FiX /> : <FiUser />}
                    </button>
                  </div>
                  {errors.password && (
                    <div className="invalid-feedback">{errors.password.message}</div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirm_password" className="form-label">
                    Подтверждение пароля {!isEdit && '*'}
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FiLock />
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className={`form-control ${errors.confirm_password ? 'is-invalid' : ''}`}
                      id="confirm_password"
                      placeholder={isEdit ? 'Оставьте пустым, чтобы не менять' : 'Подтвердите пароль'}
                      {...register('confirm_password', {
                        required: !isEdit ? 'Пожалуйста, подтвердите пароль' : false,
                        validate: (value) =>
                          !value || value === password || 'Пароли не совпадают',
                      })}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FiX /> : <FiUser />}
                    </button>
                  </div>
                  {errors.confirm_password && (
                    <div className="invalid-feedback">{errors.confirm_password.message}</div>
                  )}
                </div>
                
                <div className="form-group">
                  <div className="custom-control custom-checkbox">
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      id="is_active"
                      defaultChecked
                      {...register('is_active')}
                    />
                    <label className="custom-control-label" htmlFor="is_active">
                      Активен
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="d-flex justify-content-end mt-4">
              <button
                type="button"
                className="btn btn-outline-secondary mr-2"
                onClick={() => navigate('/masters')}
              >
                <FiX /> Отмена
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createMasterMutation.isLoading || updateMasterMutation.isLoading}
              >
                <FiSave /> {isEdit ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {isEdit && (
        <div className="card mt-4">
          <div className="card-header">
            <h3 className="card-title">Информация о безопасности</h3>
          </div>
          <div className="card-body">
            <div className="alert alert-info">
              <h5>Изменение пароля</h5>
              <p>
                Если вы хотите изменить пароль мастера, введите новый пароль в поле "Пароль" и 
                подтвердите его в поле "Подтверждение пароля". Если вы не хотите менять пароль, 
                оставьте эти поля пустыми.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterForm;
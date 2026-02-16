import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { FiSettings, FiSave, FiDollarSign, FiHome, FiPhone, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Сервисы
import { api } from '../../services/authService';

// Функция для получения настроек
const fetchSettings = async () => {
  const response = await api.get('/settings');
  return response.data.data;
};

// Функция для обновления настроек
const updateSettings = async (settingsData) => {
  const response = await api.put('/settings', settingsData);
  return response.data;
};

// Функция для получения информации о компании
const fetchCompanyInfo = async () => {
  const response = await api.get('/settings/company');
  return response.data.data;
};

const Settings = () => {
  const queryClient = useQueryClient();
  
  // Запрос настроек
  const { data: settingsData, isLoading: isLoadingSettings } = useQuery(
    'settings',
    fetchSettings
  );
  
  // Запрос информации о компании
  const { data: companyData } = useQuery(
    'companyInfo',
    fetchCompanyInfo
  );
  
  // Форма
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      director_percentage: 50,
      company_name: 'VIPАвто',
      company_address: '',
      company_phone: '',
      currency: 'RUB',
      work_time_start: '09:00',
      work_time_end: '18:00',
      working_days: [1, 2, 3, 4, 5], // Пн-Пт
    },
  });
  
  // Мутация для обновления настроек
  const updateSettingsMutation = useMutation(updateSettings, {
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries('settings');
      queryClient.invalidateQueries('companyInfo');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка при обновлении настроек');
    },
  });
  
  // Состояние для выбранных рабочих дней
  const [workingDays, setWorkingDays] = useState([1, 2, 3, 4, 5]); // Пн-Пт по умолчанию
  
  // Обработка изменения рабочего дня
  const handleWorkingDayChange = (day) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter(d => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };
  
  // Обработка отправки формы
  const onSubmit = (data) => {
    // Форматируем данные для отправки
    const formattedData = {
      ...data,
      working_days: workingDays,
    };
    
    updateSettingsMutation.mutate(formattedData);
  };
  
  // Обновляем форму при получении данных
  React.useEffect(() => {
    if (settingsData?.settings) {
      const settings = settingsData.settings;
      reset({
        director_percentage: settings.director_percentage,
        company_name: settings.company_name,
        company_address: settings.company_address,
        company_phone: settings.company_phone,
        currency: settings.currency,
        work_time_start: settings.work_time_start,
        work_time_end: settings.work_time_end,
      });
      setWorkingDays(settings.working_days || [1, 2, 3, 4, 5]);
    }
  }, [settingsData, reset]);
  
  // Обработка состояния загрузки
  if (isLoadingSettings) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }
  
  // Дни недели
  const weekDays = [
    { id: 1, name: 'Понедельник' },
    { id: 2, name: 'Вторник' },
    { id: 3, name: 'Среда' },
    { id: 4, name: 'Четверг' },
    { id: 5, name: 'Пятница' },
    { id: 6, name: 'Суббота' },
    { id: 0, name: 'Воскресенье' },
  ];
  
  return (
    <div className="settings-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title">Настройки</h1>
      </div>
      
      <div className="row">
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="card-title">
                <FiDollarSign className="mr-1" /> Финансовые настройки
              </h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="form-group">
                  <label htmlFor="director_percentage" className="form-label">
                    Процент директора *
                  </label>
                  <div className="input-group">
                    <input
                      type="number"
                      className={`form-control ${errors.director_percentage ? 'is-invalid' : ''}`}
                      id="director_percentage"
                      min="0"
                      max="100"
                      step="1"
                      {...register('director_percentage', {
                        required: 'Пожалуйста, укажите процент директора',
                        min: {
                          value: 0,
                          message: 'Процент не может быть отрицательным',
                        },
                        max: {
                          value: 100,
                          message: 'Процент не может быть больше 100',
                        },
                      })}
                    />
                    <div className="input-group-append">
                      <span className="input-group-text">%</span>
                    </div>
                  </div>
                  {errors.director_percentage && (
                    <div className="invalid-feedback">{errors.director_percentage.message}</div>
                  )}
                  <small className="form-text text-muted">
                    Укажите процент от общей суммы заказа, который получает директор. 
                    Оставшийся процент распределяется между мастерами.
                  </small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="currency" className="form-label">Валюта</label>
                  <select
                    className="form-control"
                    id="currency"
                    {...register('currency')}
                  >
                    <option value="RUB">Российский рубль (₽)</option>
                    <option value="USD">Доллар США ($)</option>
                    <option value="EUR">Евро (€)</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={updateSettingsMutation.isLoading}
                  >
                    <FiSave /> Сохранить
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="card-title">
                <FiHome className="mr-1" /> Информация о компании
              </h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="form-group">
                  <label htmlFor="company_name" className="form-label">
                    Название компании *
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.company_name ? 'is-invalid' : ''}`}
                    id="company_name"
                    {...register('company_name', {
                      required: 'Пожалуйста, укажите название компании',
                    })}
                  />
                  {errors.company_name && (
                    <div className="invalid-feedback">{errors.company_name.message}</div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="company_address" className="form-label">Адрес</label>
                  <input
                    type="text"
                    className="form-control"
                    id="company_address"
                    {...register('company_address')}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="company_phone" className="form-label">Телефон</label>
                  <input
                    type="tel"
                    className="form-control"
                    id="company_phone"
                    {...register('company_phone')}
                  />
                </div>
                
                <div className="form-group">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={updateSettingsMutation.isLoading}
                  >
                    <FiSave /> Сохранить
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <FiClock className="mr-1" /> Рабочее время
          </h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="row">
              <div className="col-md-4">
                <div className="form-group">
                  <label htmlFor="work_time_start" className="form-label">Время начала</label>
                  <input
                    type="time"
                    className="form-control"
                    id="work_time_start"
                    {...register('work_time_start')}
                  />
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="form-group">
                  <label htmlFor="work_time_end" className="form-label">Время окончания</label>
                  <input
                    type="time"
                    className="form-control"
                    id="work_time_end"
                    {...register('work_time_end')}
                  />
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="form-group">
                  <label className="form-label">Рабочие дни</label>
                  <div className="working-days">
                    {weekDays.map(day => (
                      <div key={day.id} className="custom-control custom-checkbox mb-1">
                        <input
                          type="checkbox"
                          className="custom-control-input"
                          id={`day-${day.id}`}
                          checked={workingDays.includes(day.id)}
                          onChange={() => handleWorkingDayChange(day.id)}
                        />
                        <label className="custom-control-label" htmlFor={`day-${day.id}`}>
                          {day.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="form-group mt-3">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={updateSettingsMutation.isLoading}
              >
                <FiSave /> Сохранить
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Информация о компании */}
      {companyData?.company && (
        <div className="card mt-4">
          <div className="card-header">
            <h3 className="card-title">Публичная информация</h3>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <p className="text-muted">Название компании</p>
                <p className="h5">{companyData.company.company_name}</p>
              </div>
              <div className="col-md-6">
                <p className="text-muted">Адрес</p>
                <p>{companyData.company.company_address || 'Не указан'}</p>
              </div>
              <div className="col-md-6">
                <p className="text-muted">Телефон</p>
                <p>{companyData.company.company_phone || 'Не указан'}</p>
              </div>
              <div className="col-md-6">
                <p className="text-muted">Валюта</p>
                <p>{companyData.company.currency}</p>
              </div>
              <div className="col-md-6">
                <p className="text-muted">Время работы</p>
                <p>
                  {companyData.company.work_time_start} - {companyData.company.work_time_end}
                </p>
              </div>
              <div className="col-md-6">
                <p className="text-muted">Рабочие дни</p>
                <p>
                  {weekDays
                    .filter(day => companyData.company.working_days.includes(day.id))
                    .map(day => day.name)
                    .join(', ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiArrowLeft, FiDollarSign, FiCalendar, FiUser, FiClipboard } from 'react-icons/fi';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// Сервисы
import { api } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

// Функция для получения бонуса
const fetchBonus = async (id) => {
  const response = await api.get(`/bonuses/${id}`);
  return response.data.data;
};

const BonusDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole, user } = useAuth();
  
  // Запрос бонуса
  const { data, isLoading, error } = useQuery(
    ['bonus', id],
    () => fetchBonus(id),
    {
      enabled: !!id,
    }
  );
  
  // Обработка состояния загрузки
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }
  
  // Обработка ошибки
  if (error) {
    return (
      <div className="alert alert-danger">
        Ошибка при загрузке бонуса: {error.message}
      </div>
    );
  }
  
  const bonus = data?.bonus;
  
  if (!bonus) {
    return (
      <div className="alert alert-warning">
        Бонус не найден
      </div>
    );
  }
  
  return (
    <div className="bonus-detail-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button 
            className="btn btn-outline-secondary mr-2" 
            onClick={() => navigate(hasRole('master') ? '/bonuses/my' : '/bonuses')}
          >
            <FiArrowLeft /> Назад
          </button>
          <h1 className="page-title d-inline-block">Бонус #{bonus.id}</h1>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="card-title">Информация о бонусе</h3>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-sm-6">
                  <p className="text-muted">Сумма</p>
                  <p className="h4">
                    <FiDollarSign className="mr-1" />
                    {new Intl.NumberFormat('ru-RU', {
                      style: 'currency',
                      currency: 'RUB',
                      maximumFractionDigits: 0,
                    }).format(bonus.amount)}
                  </p>
                </div>
                <div className="col-sm-6">
                  <p className="text-muted">Процент</p>
                  <p className="h4">{bonus.percentage}%</p>
                </div>
                <div className="col-sm-6">
                  <p className="text-muted">Дата начисления</p>
                  <p>
                    <FiCalendar className="mr-1" />
                    {format(new Date(bonus.date), 'dd.MM.yyyy', { locale: ru })}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Мастер</h3>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar-circle-lg mr-3">
                  {bonus.master.full_name.charAt(0)}
                </div>
                <div>
                  <h4 className="mb-1">{bonus.master.full_name}</h4>
                  <span className={`badge ${
                    bonus.master.role === 'director' ? 'bg-danger' : 
                    bonus.master.role === 'admin' ? 'bg-warning' : 'bg-primary'
                  }`}>
                    {bonus.master.role === 'director' ? 'Директор' : 
                     bonus.master.role === 'admin' ? 'Администратор' : 'Мастер'}
                  </span>
                </div>
              </div>
              
              <div className="mt-3">
                <p className="text-muted">Телефон</p>
                <p>{bonus.master.phone}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Заказ</h3>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>Заказ #{bonus.order.id}</h4>
                <Link to={`/orders/${bonus.order.id}`} className="btn btn-sm btn-outline-primary">
                  <FiClipboard /> Подробнее
                </Link>
              </div>
              
              <div className="row">
                <div className="col-sm-6">
                  <p className="text-muted">Клиент</p>
                  <p>{bonus.order.client_name}</p>
                </div>
                <div className="col-sm-6">
                  <p className="text-muted">Телефон</p>
                  <p>{bonus.order.client_phone}</p>
                </div>
                <div className="col-sm-6">
                  <p className="text-muted">Автомобиль</p>
                  <p>{bonus.order.car_model}</p>
                </div>
                <div className="col-sm-6">
                  <p className="text-muted">Гос. номер</p>
                  <p>{bonus.order.car_number}</p>
                </div>
                <div className="col-sm-6">
                  <p className="text-muted">Статус</p>
                  <p>
                    {bonus.order.status === 'pending' && (
                      <span className="badge badge-warning">В ожидании</span>
                    )}
                    {bonus.order.status === 'in_progress' && (
                      <span className="badge badge-primary">В работе</span>
                    )}
                    {bonus.order.status === 'completed' && (
                      <span className="badge badge-success">Выполнен</span>
                    )}
                    {bonus.order.status === 'cancelled' && (
                      <span className="badge badge-danger">Отменен</span>
                    )}
                  </p>
                </div>
                <div className="col-sm-6">
                  <p className="text-muted">Общая сумма</p>
                  <p>
                    {new Intl.NumberFormat('ru-RU', {
                      style: 'currency',
                      currency: 'RUB',
                      maximumFractionDigits: 0,
                    }).format(bonus.order.total_amount || 0)}
                  </p>
                </div>
              </div>
              
              <div className="mt-3">
                <p className="text-muted">Описание проблемы</p>
                <p>{bonus.order.problem_description || 'Не указано'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Расчет бонуса */}
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">Расчет бонуса</h3>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <p className="text-muted">Общая сумма заказа</p>
              <p className="h4">
                {new Intl.NumberFormat('ru-RU', {
                  style: 'currency',
                  currency: 'RUB',
                  maximumFractionDigits: 0,
                }).format(bonus.order.total_amount || 0)}
              </p>
            </div>
            <div className="col-md-4">
              <p className="text-muted">Процент бонуса</p>
              <p className="h4">{bonus.percentage}%</p>
            </div>
            <div className="col-md-4">
              <p className="text-muted">Сумма бонуса</p>
              <p className="h4">
                <FiDollarSign className="mr-1" />
                {new Intl.NumberFormat('ru-RU', {
                  style: 'currency',
                  currency: 'RUB',
                  maximumFractionDigits: 0,
                }).format(bonus.amount)}
              </p>
            </div>
          </div>
          
          <div className="alert alert-info mt-3">
            <h5>Как рассчитывается бонус</h5>
            <p>
              Бонус рассчитывается как процент от общей суммы заказа. В данном случае мастер получает 
              {bonus.percentage}% от общей суммы заказа, что составляет 
              {new Intl.NumberFormat('ru-RU', {
                style: 'currency',
                currency: 'RUB',
                maximumFractionDigits: 0,
              }).format(bonus.amount)}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BonusDetail;
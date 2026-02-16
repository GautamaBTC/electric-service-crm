import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { FiEdit, FiArrowLeft, FiUser, FiPhone, FiCalendar, FiClipboard, FiDollarSign, FiAward } from 'react-icons/fi';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// Сервисы
import { api } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

// Функция для получения мастера
const fetchMaster = async (id) => {
  const response = await api.get(`/masters/${id}`);
  return response.data.data;
};

// Функция для получения статистики мастера
const fetchMasterStats = async (id) => {
  const response = await api.get(`/masters/${id}/stats`);
  return response.data.data;
};

const MasterDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole, user } = useAuth();
  
  // Запрос мастера
  const { data: masterData, isLoading: isLoadingMaster } = useQuery(
    ['master', id],
    () => fetchMaster(id),
    {
      enabled: !!id,
    }
  );
  
  // Запрос статистики мастера
  const { data: statsData, isLoading: isLoadingStats } = useQuery(
    ['masterStats', id],
    () => fetchMasterStats(id),
    {
      enabled: !!id && (hasRole('director') || hasRole('admin') || user?.id === parseInt(id)),
    }
  );
  
  // Функция для получения текста роли
  const getRoleText = (role) => {
    switch (role) {
      case 'director':
        return { text: 'Директор', className: 'badge-danger' };
      case 'admin':
        return { text: 'Администратор', className: 'badge-warning' };
      case 'master':
        return { text: 'Мастер', className: 'badge-primary' };
      default:
        return { text: role, className: 'badge-secondary' };
    }
  };
  
  // Обработка состояния загрузки
  if (isLoadingMaster) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }
  
  const master = masterData?.master;
  
  if (!master) {
    return (
      <div className="alert alert-warning">
        Мастер не найден
      </div>
    );
  }
  
  const roleInfo = getRoleText(master.role);
  const stats = statsData?.stats;
  
  return (
    <div className="master-detail-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button 
            className="btn btn-outline-secondary mr-2" 
            onClick={() => navigate('/masters')}
          >
            <FiArrowLeft /> Назад
          </button>
          <h1 className="page-title d-inline-block">Мастер #{master.id}</h1>
        </div>
        
        {(hasRole('director') || hasRole('admin')) && master.role !== 'director' && (
          <Link to={`/masters/${master.id}/edit`} className="btn btn-primary">
            <FiEdit /> Редактировать
          </Link>
        )}
      </div>
      
      <div className="row">
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="card-title">Информация о мастере</h3>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <div className="avatar-circle-lg mr-3">
                  {master.full_name.charAt(0)}
                </div>
                <div>
                  <h4 className="mb-1">{master.full_name}</h4>
                  <span className={`badge ${roleInfo.className}`}>
                    {roleInfo.text}
                  </span>
                </div>
              </div>
              
              <div className="row">
                <div className="col-sm-6">
                  <p className="text-muted">Телефон</p>
                  <p>
                    <FiPhone className="mr-1" />
                    {master.phone}
                  </p>
                </div>
                <div className="col-sm-6">
                  <p className="text-muted">Статус</p>
                  <p>
                    {master.is_active ? (
                      <span className="badge badge-success">Активен</span>
                    ) : (
                      <span className="badge badge-danger">Неактивен</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {stats && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Статистика</h3>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-sm-6 mb-3">
                    <p className="text-muted">Всего заказов</p>
                    <p className="h4">
                      <FiClipboard className="mr-1" />
                      {stats.totalOrders}
                    </p>
                  </div>
                  <div className="col-sm-6 mb-3">
                    <p className="text-muted">Выполнено заказов</p>
                    <p className="h4">
                      <FiAward className="mr-1" />
                      {stats.completedOrders}
                    </p>
                  </div>
                  <div className="col-sm-6 mb-3">
                    <p className="text-muted">В работе</p>
                    <p className="h4">
                      <FiClipboard className="mr-1" />
                      {stats.inProgressOrders}
                    </p>
                  </div>
                  <div className="col-sm-6 mb-3">
                    <p className="text-muted">В ожидании</p>
                    <p className="h4">
                      <FiClipboard className="mr-1" />
                      {stats.pendingOrders}
                    </p>
                  </div>
                  <div className="col-sm-6 mb-3">
                    <p className="text-muted">Отменено</p>
                    <p className="h4">
                      <FiClipboard className="mr-1" />
                      {stats.cancelledOrders}
                    </p>
                  </div>
                  <div className="col-sm-6 mb-3">
                    <p className="text-muted">Общая сумма</p>
                    <p className="h4">
                      <FiDollarSign className="mr-1" />
                      {new Intl.NumberFormat('ru-RU', {
                        style: 'currency',
                        currency: 'RUB',
                        maximumFractionDigits: 0,
                      }).format(stats.totalAmount)}
                    </p>
                  </div>
                  <div className="col-sm-6 mb-3">
                    <p className="text-muted">Средний чек</p>
                    <p className="h4">
                      <FiDollarSign className="mr-1" />
                      {new Intl.NumberFormat('ru-RU', {
                        style: 'currency',
                        currency: 'RUB',
                        maximumFractionDigits: 0,
                      }).format(stats.averageAmount)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Заказы</h3>
            </div>
            <div className="card-body">
              {master.orders && master.orders.length > 0 ? (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Клиент</th>
                        <th>Автомобиль</th>
                        <th>Статус</th>
                        <th>Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      {master.orders.map((order) => {
                        let statusClass = '';
                        let statusText = '';
                        
                        switch (order.status) {
                          case 'pending':
                            statusClass = 'badge-warning';
                            statusText = 'В ожидании';
                            break;
                          case 'in_progress':
                            statusClass = 'badge-primary';
                            statusText = 'В работе';
                            break;
                          case 'completed':
                            statusClass = 'badge-success';
                            statusText = 'Выполнен';
                            break;
                          case 'cancelled':
                            statusClass = 'badge-danger';
                            statusText = 'Отменен';
                            break;
                          default:
                            statusClass = 'badge-secondary';
                            statusText = order.status;
                        }
                        
                        return (
                          <tr key={order.id}>
                            <td>#{order.id}</td>
                            <td>{order.client_name}</td>
                            <td>{order.car_model}</td>
                            <td>
                              <span className={`badge ${statusClass}`}>
                                {statusText}
                              </span>
                            </td>
                            <td>
                              {new Intl.NumberFormat('ru-RU', {
                                style: 'currency',
                                currency: 'RUB',
                                maximumFractionDigits: 0,
                              }).format(order.total_amount || 0)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FiClipboard className="mb-3" size={48} />
                  <h4>Нет заказов</h4>
                  <p className="text-muted">У этого мастера еще нет заказов.</p>
                </div>
              )}
            </div>
          </div>
          
          {master.bonuses && master.bonuses.length > 0 && (
            <div className="card mt-4">
              <div className="card-header">
                <h3 className="card-title">Бонусы</h3>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Заказ</th>
                        <th>Сумма</th>
                        <th>Процент</th>
                        <th>Дата</th>
                      </tr>
                    </thead>
                    <tbody>
                      {master.bonuses.map((bonus) => (
                        <tr key={bonus.id}>
                          <td>#{bonus.order_id}</td>
                          <td>
                            {new Intl.NumberFormat('ru-RU', {
                              style: 'currency',
                              currency: 'RUB',
                              maximumFractionDigits: 0,
                            }).format(bonus.amount)}
                          </td>
                          <td>{bonus.percentage}%</td>
                          <td>
                            {format(new Date(bonus.date), 'dd.MM.yyyy', { locale: ru })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MasterDetail;
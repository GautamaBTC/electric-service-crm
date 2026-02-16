import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { FiEdit, FiArrowLeft, FiUser, FiPhone, FiCar, FiCalendar, FiTool, FiPackage, FiDollarSign, FiClock, FiCheck, FiX } from 'react-icons/fi';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import toast from 'react-hot-toast';

// Сервисы
import { api } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

// Функция для получения заказа
const fetchOrder = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data.data;
};

// Функция для изменения статуса заказа
const changeOrderStatus = async ({ id, status }) => {
  const response = await api.patch(`/orders/${id}/status`, { status });
  return response.data;
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Запрос заказа
  const { data, isLoading, error } = useQuery(
    ['order', id],
    () => fetchOrder(id),
    {
      enabled: !!id,
    }
  );
  
  // Мутация для изменения статуса заказа
  const changeStatusMutation = useMutation(changeOrderStatus, {
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries(['order', id]);
      queryClient.invalidateQueries('orders');
      setShowStatusModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка при изменении статуса заказа');
    },
  });
  
  // Обработка изменения статуса
  const handleChangeStatus = (status) => {
    setSelectedStatus(status);
    changeStatusMutation.mutate({ id, status });
  };
  
  // Функция для получения текста статуса
  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return { text: 'В ожидании', className: 'badge-warning' };
      case 'in_progress':
        return { text: 'В работе', className: 'badge-primary' };
      case 'completed':
        return { text: 'Выполнен', className: 'badge-success' };
      case 'cancelled':
        return { text: 'Отменен', className: 'badge-danger' };
      default:
        return { text: status, className: 'badge-secondary' };
    }
  };
  
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
        Ошибка при загрузке заказа: {error.message}
      </div>
    );
  }
  
  const order = data?.order;
  
  if (!order) {
    return (
      <div className="alert alert-warning">
        Заказ не найден
      </div>
    );
  }
  
  const statusInfo = getStatusText(order.status);
  
  // Расчет общей стоимости
  let totalWorks = 0;
  let totalMaterials = 0;
  let totalParts = 0;
  
  order.orderMasters.forEach(orderMaster => {
    orderMaster.works.forEach(work => {
      totalWorks += parseFloat(work.price || 0);
    });
    
    orderMaster.materials.forEach(material => {
      totalMaterials += parseFloat(material.price || 0) * parseFloat(material.quantity || 1);
    });
    
    orderMaster.parts.forEach(part => {
      totalParts += parseFloat(part.price || 0) * parseFloat(part.quantity || 1);
    });
  });
  
  const totalAmount = totalWorks + totalMaterials + totalParts;
  
  return (
    <div className="order-detail-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button 
            className="btn btn-outline-secondary mr-2" 
            onClick={() => navigate('/orders')}
          >
            <FiArrowLeft /> Назад
          </button>
          <h1 className="page-title d-inline-block">Заказ #{order.id}</h1>
        </div>
        
        {(hasRole('director') || hasRole('admin') || 
          (hasRole('master') && order.masters.some(master => master.id === useAuth().user?.id))) && (
          <Link to={`/orders/${order.id}/edit`} className="btn btn-primary">
            <FiEdit /> Редактировать
          </Link>
        )}
      </div>
      
      <div className="row">
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="card-title">Информация о заказе</h3>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-sm-4">
                  <p className="text-muted">Статус</p>
                  <p>
                    <span className={`badge ${statusInfo.className}`}>
                      {statusInfo.text}
                    </span>
                  </p>
                </div>
                <div className="col-sm-4">
                  <p className="text-muted">Дата создания</p>
                  <p>
                    <FiCalendar className="mr-1" />
                    {format(new Date(order.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                  </p>
                </div>
                {order.completed_at && (
                  <div className="col-sm-4">
                    <p className="text-muted">Дата завершения</p>
                    <p>
                      <FiCalendar className="mr-1" />
                      {format(new Date(order.completed_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-3">
                <p className="text-muted">Описание проблемы</p>
                <p>{order.problem_description || 'Не указано'}</p>
              </div>
              
              <div className="mt-3">
                <p className="text-muted">Действия</p>
                <div className="btn-group">
                  {(hasRole('director') || hasRole('admin') || 
                    (hasRole('master') && order.masters.some(master => master.id === useAuth().user?.id))) && (
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setShowStatusModal(true)}
                    >
                      Изменить статус
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Информация о клиенте</h3>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-sm-6">
                  <p className="text-muted">ФИО</p>
                  <p>
                    <FiUser className="mr-1" />
                    {order.client_name}
                  </p>
                </div>
                <div className="col-sm-6">
                  <p className="text-muted">Телефон</p>
                  <p>
                    <FiPhone className="mr-1" />
                    {order.client_phone}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="card-title">Информация об автомобиле</h3>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-sm-6">
                  <p className="text-muted">Модель</p>
                  <p>
                    <FiCar className="mr-1" />
                    {order.car_model}
                  </p>
                </div>
                <div className="col-sm-6">
                  <p className="text-muted">Гос. номер</p>
                  <p>{order.car_number}</p>
                </div>
                {order.car_year && (
                  <div className="col-sm-6">
                    <p className="text-muted">Год выпуска</p>
                    <p>{order.car_year}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Мастера</h3>
            </div>
            <div className="card-body">
              {order.masters && order.masters.length > 0 ? (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Мастер</th>
                        <th>Роль</th>
                        <th>Процент работы</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.masters.map(master => (
                        <tr key={master.id}>
                          <td>{master.full_name}</td>
                          <td>
                            <span className={`badge ${
                              master.role === 'director' ? 'bg-danger' : 
                              master.role === 'admin' ? 'bg-warning' : 'bg-primary'
                            }`}>
                              {master.role === 'director' ? 'Директор' : 
                               master.role === 'admin' ? 'Администратор' : 'Мастер'}
                            </span>
                          </td>
                          <td>
                            {order.orderMasters.find(om => om.master_id === master.id)?.work_percentage || 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">Мастера не назначены</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Работы</h3>
            </div>
            <div className="card-body">
              {order.orderMasters.some(om => om.works.length > 0) ? (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Работа</th>
                        <th>Цена</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.orderMasters.flatMap(orderMaster => 
                        orderMaster.works.map(work => (
                          <tr key={work.id}>
                            <td>
                              <FiTool className="mr-1" />
                              {work.name}
                            </td>
                            <td>
                              {new Intl.NumberFormat('ru-RU', {
                                style: 'currency',
                                currency: 'RUB',
                                maximumFractionDigits: 0,
                              }).format(work.price)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th>Итого:</th>
                        <th>
                          {new Intl.NumberFormat('ru-RU', {
                            style: 'currency',
                            currency: 'RUB',
                            maximumFractionDigits: 0,
                          }).format(totalWorks)}
                        </th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-muted">Работы не добавлены</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Материалы</h3>
            </div>
            <div className="card-body">
              {order.orderMasters.some(om => om.materials.length > 0) ? (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Материал</th>
                        <th>Кол-во</th>
                        <th>Цена</th>
                        <th>Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.orderMasters.flatMap(orderMaster => 
                        orderMaster.materials.map(material => (
                          <tr key={material.id}>
                            <td>
                              <FiPackage className="mr-1" />
                              {material.name}
                            </td>
                            <td>{material.quantity}</td>
                            <td>
                              {new Intl.NumberFormat('ru-RU', {
                                style: 'currency',
                                currency: 'RUB',
                                maximumFractionDigits: 0,
                              }).format(material.price)}
                            </td>
                            <td>
                              {new Intl.NumberFormat('ru-RU', {
                                style: 'currency',
                                currency: 'RUB',
                                maximumFractionDigits: 0,
                              }).format(material.price * material.quantity)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th colSpan="3">Итого:</th>
                        <th>
                          {new Intl.NumberFormat('ru-RU', {
                            style: 'currency',
                            currency: 'RUB',
                            maximumFractionDigits: 0,
                          }).format(totalMaterials)}
                        </th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-muted">Материалы не добавлены</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Запчасти</h3>
            </div>
            <div className="card-body">
              {order.orderMasters.some(om => om.parts.length > 0) ? (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Запчасть</th>
                        <th>Кол-во</th>
                        <th>Цена</th>
                        <th>Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.orderMasters.flatMap(orderMaster => 
                        orderMaster.parts.map(part => (
                          <tr key={part.id}>
                            <td>
                              <FiPackage className="mr-1" />
                              {part.name}
                            </td>
                            <td>{part.quantity}</td>
                            <td>
                              {new Intl.NumberFormat('ru-RU', {
                                style: 'currency',
                                currency: 'RUB',
                                maximumFractionDigits: 0,
                              }).format(part.price)}
                            </td>
                            <td>
                              {new Intl.NumberFormat('ru-RU', {
                                style: 'currency',
                                currency: 'RUB',
                                maximumFractionDigits: 0,
                              }).format(part.price * part.quantity)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th colSpan="3">Итого:</th>
                        <th>
                          {new Intl.NumberFormat('ru-RU', {
                            style: 'currency',
                            currency: 'RUB',
                            maximumFractionDigits: 0,
                          }).format(totalParts)}
                        </th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-muted">Запчасти не добавлены</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">Итоговая стоимость</h3>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <p className="text-muted">Стоимость работ</p>
              <p className="h5">
                {new Intl.NumberFormat('ru-RU', {
                  style: 'currency',
                  currency: 'RUB',
                  maximumFractionDigits: 0,
                }).format(totalWorks)}
              </p>
            </div>
            <div className="col-md-3">
              <p className="text-muted">Стоимость материалов</p>
              <p className="h5">
                {new Intl.NumberFormat('ru-RU', {
                  style: 'currency',
                  currency: 'RUB',
                  maximumFractionDigits: 0,
                }).format(totalMaterials)}
              </p>
            </div>
            <div className="col-md-3">
              <p className="text-muted">Стоимость запчастей</p>
              <p className="h5">
                {new Intl.NumberFormat('ru-RU', {
                  style: 'currency',
                  currency: 'RUB',
                  maximumFractionDigits: 0,
                }).format(totalParts)}
              </p>
            </div>
            <div className="col-md-3">
              <p className="text-muted">Общая стоимость</p>
              <p className="h4">
                <FiDollarSign className="mr-1" />
                {new Intl.NumberFormat('ru-RU', {
                  style: 'currency',
                  currency: 'RUB',
                  maximumFractionDigits: 0,
                }).format(totalAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Модальное окно для изменения статуса */}
      {showStatusModal && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Изменение статуса заказа</h5>
                <button 
                  type="button" 
                  className="close" 
                  onClick={() => setShowStatusModal(false)}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p>Выберите новый статус для заказа #{order.id}</p>
                <div className="list-group">
                  <button
                    className={`list-group-item list-group-item-action ${order.status === 'pending' ? 'active' : ''}`}
                    onClick={() => handleChangeStatus('pending')}
                    disabled={changeStatusMutation.isLoading}
                  >
                    <FiClock className="mr-2" />
                    В ожидании
                  </button>
                  <button
                    className={`list-group-item list-group-item-action ${order.status === 'in_progress' ? 'active' : ''}`}
                    onClick={() => handleChangeStatus('in_progress')}
                    disabled={changeStatusMutation.isLoading}
                  >
                    <FiTool className="mr-2" />
                    В работе
                  </button>
                  <button
                    className={`list-group-item list-group-item-action ${order.status === 'completed' ? 'active' : ''}`}
                    onClick={() => handleChangeStatus('completed')}
                    disabled={changeStatusMutation.isLoading}
                  >
                    <FiCheck className="mr-2" />
                    Выполнен
                  </button>
                  <button
                    className={`list-group-item list-group-item-action ${order.status === 'cancelled' ? 'active' : ''}`}
                    onClick={() => handleChangeStatus('cancelled')}
                    disabled={changeStatusMutation.isLoading}
                  >
                    <FiX className="mr-2" />
                    Отменен
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowStatusModal(false)}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
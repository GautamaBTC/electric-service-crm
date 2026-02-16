import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { FiPlus, FiSearch, FiFilter, FiEdit, FiEye, FiCalendar, FiUser, FiCar } from 'react-icons/fi';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// Сервисы
import { api } from '../../services/authService';

// Функция для получения заказов
const fetchOrders = async (filters) => {
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.status) params.append('status', filters.status);
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  if (filters.search) params.append('search', filters.search);
  
  const response = await api.get(`/orders?${params.toString()}`);
  return response.data.data;
};

const Orders = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    date_from: '',
    date_to: '',
    search: '',
  });
  
  const [showFilters, setShowFilters] = useState(false);
  
  // Запрос заказов
  const { data, isLoading, error, refetch } = useQuery(
    ['orders', filters],
    () => fetchOrders(filters),
    {
      keepPreviousData: true,
    }
  );
  
  // Обработка изменения фильтров
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
      page: 1, // Сбрасываем страницу при изменении фильтров
    });
  };
  
  // Обработка отправки формы фильтров
  const handleSubmitFilter = (e) => {
    e.preventDefault();
    refetch();
  };
  
  // Обработка сброса фильтров
  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      status: '',
      date_from: '',
      date_to: '',
      search: '',
    });
  };
  
  // Обработка изменения страницы
  const handlePageChange = (newPage) => {
    setFilters({
      ...filters,
      page: newPage,
    });
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
        Ошибка при загрузке заказов: {error.message}
      </div>
    );
  }
  
  return (
    <div className="orders-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title">Заказы</h1>
        <Link to="/orders/new" className="btn btn-primary">
          <FiPlus className="mr-1" /> Новый заказ
        </Link>
      </div>
      
      {/* Панель фильтров */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h3 className="card-title">Фильтры</h3>
          <button 
            className="btn btn-sm btn-outline-secondary" 
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter />
          </button>
        </div>
        
        {showFilters && (
          <div className="card-body">
            <form onSubmit={handleSubmitFilter}>
              <div className="row">
                <div className="col-md-3 mb-3">
                  <label htmlFor="search" className="form-label">Поиск</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FiSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      id="search"
                      name="search"
                      placeholder="Клиент, автомобиль..."
                      value={filters.search}
                      onChange={handleFilterChange}
                    />
                  </div>
                </div>
                
                <div className="col-md-3 mb-3">
                  <label htmlFor="status" className="form-label">Статус</label>
                  <select
                    className="form-control"
                    id="status"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                  >
                    <option value="">Все статусы</option>
                    <option value="pending">В ожидании</option>
                    <option value="in_progress">В работе</option>
                    <option value="completed">Выполнен</option>
                    <option value="cancelled">Отменен</option>
                  </select>
                </div>
                
                <div className="col-md-3 mb-3">
                  <label htmlFor="date_from" className="form-label">Дата от</label>
                  <input
                    type="date"
                    className="form-control"
                    id="date_from"
                    name="date_from"
                    value={filters.date_from}
                    onChange={handleFilterChange}
                  />
                </div>
                
                <div className="col-md-3 mb-3">
                  <label htmlFor="date_to" className="form-label">Дата до</label>
                  <input
                    type="date"
                    className="form-control"
                    id="date_to"
                    name="date_to"
                    value={filters.date_to}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>
              
              <div className="d-flex justify-content-end">
                <button type="button" className="btn btn-outline-secondary mr-2" onClick={handleResetFilters}>
                  Сбросить
                </button>
                <button type="submit" className="btn btn-primary">
                  Применить
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      
      {/* Таблица заказов */}
      <div className="card">
        <div className="card-body">
          {data?.orders && data.orders.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Клиент</th>
                    <th>Автомобиль</th>
                    <th>Статус</th>
                    <th>Сумма</th>
                    <th>Дата</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.map((order) => {
                    const statusInfo = getStatusText(order.status);
                    
                    return (
                      <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td>
                          <div>
                            <div className="font-weight-bold">{order.client_name}</div>
                            <div className="text-muted small">{order.client_phone}</div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="font-weight-bold">{order.car_model}</div>
                            <div className="text-muted small">{order.car_number}</div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${statusInfo.className}`}>
                            {statusInfo.text}
                          </span>
                        </td>
                        <td>
                          {new Intl.NumberFormat('ru-RU', {
                            style: 'currency',
                            currency: 'RUB',
                            maximumFractionDigits: 0,
                          }).format(order.total_amount || 0)}
                        </td>
                        <td>
                          {format(new Date(order.created_at), 'dd.MM.yyyy', { locale: ru })}
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <Link to={`/orders/${order.id}`} className="btn btn-sm btn-outline-primary">
                              <FiEye />
                            </Link>
                            <Link to={`/orders/${order.id}/edit`} className="btn btn-sm btn-outline-secondary">
                              <FiEdit />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4">
              <FiCar className="mb-3" size={48} />
              <h4>Нет заказов</h4>
              <p className="text-muted">Заказы не найдены. Попробуйте изменить фильтры.</p>
            </div>
          )}
          
          {/* Пагинация */}
          {data && data.totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <div>
                Показано {(data.currentPage - 1) * data.limit + 1} -{' '}
                {Math.min(data.currentPage * data.limit, data.count)} из {data.count} заказов
              </div>
              
              <nav>
                <ul className="pagination">
                  <li className={`page-item ${data.currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(data.currentPage - 1)}
                      disabled={data.currentPage === 1}
                    >
                      &laquo;
                    </button>
                  </li>
                  
                  {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === data.totalPages ||
                        (page >= data.currentPage - 2 && page <= data.currentPage + 2)
                    )
                    .map((page, index, array) => {
                      if (index > 0 && page - array[index - 1] > 1) {
                        return (
                          <React.Fragment key={`ellipsis-${page}`}>
                            <li className="page-item disabled">
                              <span className="page-link">...</span>
                            </li>
                            <li className={`page-item ${data.currentPage === page ? 'active' : ''}`}>
                              <button
                                className="page-link"
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </button>
                            </li>
                          </React.Fragment>
                        );
                      }
                      
                      return (
                        <li key={page} className={`page-item ${data.currentPage === page ? 'active' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </button>
                        </li>
                      );
                    })}
                  
                  <li className={`page-item ${data.currentPage === data.totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(data.currentPage + 1)}
                      disabled={data.currentPage === data.totalPages}
                    >
                      &raquo;
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;
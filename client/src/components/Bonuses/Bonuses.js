import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiSearch, FiFilter, FiEye, FiDollarSign, FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// Сервисы
import { api } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

// Функция для получения всех бонусов
const fetchAllBonuses = async (filters) => {
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.master_id) params.append('master_id', filters.master_id);
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  
  const response = await api.get(`/bonuses?${params.toString()}`);
  return response.data.data;
};

// Функция для получения бонусов текущего мастера
const fetchMyBonuses = async (filters) => {
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  
  const response = await api.get(`/bonuses/my-bonuses?${params.toString()}`);
  return response.data.data;
};

// Функция для получения мастеров
const fetchMasters = async () => {
  const response = await api.get('/masters');
  return response.data.data;
};

const Bonuses = () => {
  const { hasRole, user } = useAuth();
  const isMyBonuses = hasRole('master');
  
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    master_id: '',
    date_from: '',
    date_to: '',
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [masters, setMasters] = useState([]);
  
  // Запрос бонусов
  const { data, isLoading, error, refetch } = useQuery(
    ['bonuses', filters, isMyBonuses],
    () => isMyBonuses ? fetchMyBonuses(filters) : fetchAllBonuses(filters),
    {
      keepPreviousData: true,
    }
  );
  
  // Запрос мастеров (только для директора и администратора)
  const { data: mastersData } = useQuery(
    'masters',
    fetchMasters,
    {
      enabled: !isMyBonuses,
      onSuccess: (data) => {
        setMasters(data.masters || []);
      },
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
      master_id: '',
      date_from: '',
      date_to: '',
    });
  };
  
  // Обработка изменения страницы
  const handlePageChange = (newPage) => {
    setFilters({
      ...filters,
      page: newPage,
    });
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
        Ошибка при загрузке бонусов: {error.message}
      </div>
    );
  }
  
  return (
    <div className="bonuses-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title">{isMyBonuses ? 'Мои бонусы' : 'Бонусы'}</h1>
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
                {!isMyBonuses && (
                  <div className="col-md-3 mb-3">
                    <label htmlFor="master_id" className="form-label">Мастер</label>
                    <select
                      className="form-control"
                      id="master_id"
                      name="master_id"
                      value={filters.master_id}
                      onChange={handleFilterChange}
                    >
                      <option value="">Все мастера</option>
                      {masters.map(master => (
                        <option key={master.id} value={master.id}>
                          {master.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
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
                
                <div className="col-md-3 mb-3 d-flex align-items-end">
                  <div className="btn-group w-100">
                    <button type="button" className="btn btn-outline-secondary" onClick={handleResetFilters}>
                      Сбросить
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Применить
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
      
      {/* Таблица бонусов */}
      <div className="card">
        <div className="card-body">
          {data?.bonuses && data.bonuses.length > 0 ? (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>ID</th>
                      {!isMyBonuses && <th>Мастер</th>}
                      <th>Заказ</th>
                      <th>Сумма</th>
                      <th>Процент</th>
                      <th>Дата</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bonuses.map((bonus) => (
                      <tr key={bonus.id}>
                        <td>#{bonus.id}</td>
                        {!isMyBonuses && (
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="avatar-circle mr-2">
                                {bonus.master.full_name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-weight-bold">{bonus.master.full_name}</div>
                                <div className="text-muted small">
                                  {bonus.master.role === 'director' ? 'Директор' : 
                                   bonus.master.role === 'admin' ? 'Администратор' : 'Мастер'}
                                </div>
                              </div>
                            </div>
                          </td>
                        )}
                        <td>
                          <Link to={`/orders/${bonus.order_id}`} className="text-primary">
                            #{bonus.order_id}
                          </Link>
                        </td>
                        <td>
                          <FiDollarSign className="mr-1" />
                          {new Intl.NumberFormat('ru-RU', {
                            style: 'currency',
                            currency: 'RUB',
                            maximumFractionDigits: 0,
                          }).format(bonus.amount)}
                        </td>
                        <td>{bonus.percentage}%</td>
                        <td>
                          <FiCalendar className="mr-1" />
                          {format(new Date(bonus.date), 'dd.MM.yyyy', { locale: ru })}
                        </td>
                        <td>
                          <Link to={`/bonuses/${bonus.id}`} className="btn btn-sm btn-outline-primary">
                            <FiEye />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Пагинация */}
              {data && data.totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <div>
                    Показано {(data.currentPage - 1) * data.limit + 1} -{' '}
                    {Math.min(data.currentPage * data.limit, data.count)} из {data.count} бонусов
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
            </>
          ) : (
            <div className="text-center py-4">
              <FiDollarSign className="mb-3" size={48} />
              <h4>Бонусы не найдены</h4>
              <p className="text-muted">Бонусы не найдены. Попробуйте изменить фильтры.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Статистика бонусов */}
      {data?.bonuses && data.bonuses.length > 0 && (
        <div className="card mt-4">
          <div className="card-header">
            <h3 className="card-title">Статистика</h3>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-3 mb-3">
                <p className="text-muted">Всего бонусов</p>
                <p className="h4">
                  <FiDollarSign className="mr-1" />
                  {data.bonuses.length}
                </p>
              </div>
              <div className="col-md-3 mb-3">
                <p className="text-muted">Общая сумма</p>
                <p className="h4">
                  <FiDollarSign className="mr-1" />
                  {new Intl.NumberFormat('ru-RU', {
                    style: 'currency',
                    currency: 'RUB',
                    maximumFractionDigits: 0,
                  }).format(data.bonuses.reduce((sum, bonus) => sum + parseFloat(bonus.amount), 0))}
                </p>
              </div>
              <div className="col-md-3 mb-3">
                <p className="text-muted">Средний размер бонуса</p>
                <p className="h4">
                  <FiDollarSign className="mr-1" />
                  {new Intl.NumberFormat('ru-RU', {
                    style: 'currency',
                    currency: 'RUB',
                    maximumFractionDigits: 0,
                  }).format(
                    data.bonuses.reduce((sum, bonus) => sum + parseFloat(bonus.amount), 0) / data.bonuses.length
                  )}
                </p>
              </div>
              <div className="col-md-3 mb-3">
                <p className="text-muted">Последний бонус</p>
                <p className="h4">
                  <FiCalendar className="mr-1" />
                  {format(new Date(data.bonuses[0].date), 'dd.MM.yyyy', { locale: ru })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bonuses;
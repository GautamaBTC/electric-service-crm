import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { FiPlus, FiSearch, FiFilter, FiEdit, FiEye, FiUser, FiPhone } from 'react-icons/fi';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// Сервисы
import { api } from '../../services/authService';

// Функция для получения мастеров
const fetchMasters = async (filters) => {
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.search) params.append('search', filters.search);
  if (filters.is_active !== '') params.append('is_active', filters.is_active);
  
  const response = await api.get(`/masters?${params.toString()}`);
  return response.data.data;
};

const Masters = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    is_active: '',
  });
  
  const [showFilters, setShowFilters] = useState(false);
  
  // Запрос мастеров
  const { data, isLoading, error, refetch } = useQuery(
    ['masters', filters],
    () => fetchMasters(filters),
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
      search: '',
      is_active: '',
    });
  };
  
  // Обработка изменения страницы
  const handlePageChange = (newPage) => {
    setFilters({
      ...filters,
      page: newPage,
    });
  };
  
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
        Ошибка при загрузке мастеров: {error.message}
      </div>
    );
  }
  
  return (
    <div className="masters-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title">Мастера</h1>
        <Link to="/masters/new" className="btn btn-primary">
          <FiPlus className="mr-1" /> Новый мастер
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
                <div className="col-md-4 mb-3">
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
                      placeholder="ФИО, телефон..."
                      value={filters.search}
                      onChange={handleFilterChange}
                    />
                  </div>
                </div>
                
                <div className="col-md-4 mb-3">
                  <label htmlFor="is_active" className="form-label">Статус</label>
                  <select
                    className="form-control"
                    id="is_active"
                    name="is_active"
                    value={filters.is_active}
                    onChange={handleFilterChange}
                  >
                    <option value="">Все статусы</option>
                    <option value="true">Активные</option>
                    <option value="false">Неактивные</option>
                  </select>
                </div>
                
                <div className="col-md-4 mb-3 d-flex align-items-end">
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
      
      {/* Таблица мастеров */}
      <div className="card">
        <div className="card-body">
          {data?.masters && data.masters.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>ФИО</th>
                    <th>Роль</th>
                    <th>Телефон</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {data.masters.map((master) => {
                    const roleInfo = getRoleText(master.role);
                    
                    return (
                      <tr key={master.id}>
                        <td>#{master.id}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar-circle mr-2">
                              {master.full_name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-weight-bold">{master.full_name}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${roleInfo.className}`}>
                            {roleInfo.text}
                          </span>
                        </td>
                        <td>
                          <FiPhone className="mr-1" />
                          {master.phone}
                        </td>
                        <td>
                          {master.is_active ? (
                            <span className="badge badge-success">Активен</span>
                          ) : (
                            <span className="badge badge-danger">Неактивен</span>
                          )}
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <Link to={`/masters/${master.id}`} className="btn btn-sm btn-outline-primary">
                              <FiEye />
                            </Link>
                            {master.role !== 'director' && (
                              <Link to={`/masters/${master.id}/edit`} className="btn btn-sm btn-outline-secondary">
                                <FiEdit />
                              </Link>
                            )}
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
              <FiUser className="mb-3" size={48} />
              <h4>Мастера не найдены</h4>
              <p className="text-muted">Мастера не найдены. Попробуйте изменить фильтры.</p>
            </div>
          )}
          
          {/* Пагинация */}
          {data && data.totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <div>
                Показано {(data.currentPage - 1) * data.limit + 1} -{' '}
                {Math.min(data.currentPage * data.limit, data.count)} из {data.count} мастеров
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

export default Masters;
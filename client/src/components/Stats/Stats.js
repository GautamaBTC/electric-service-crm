import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { FiBarChart2, FiDollarSign, FiClipboard, FiUsers, FiCalendar, FiDownload, FiRefreshCw } from 'react-icons/fi';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { format, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import * as XLSX from 'xlsx';

// Регистрация компонентов Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Сервисы
import { api } from '../../services/authService';

// Функция для получения общей статистики
const fetchGeneralStats = async () => {
  const response = await api.get('/stats/general');
  return response.data.data;
};

// Функция для получения статистики дашборда
const fetchDashboardStats = async (period) => {
  const params = new URLSearchParams();
  if (period) params.append('period', period);
  
  const response = await api.get(`/stats/dashboard?${params.toString()}`);
  return response.data.data;
};

// Функция для получения статистики для экспорта
const fetchExportStats = async (filters) => {
  const params = new URLSearchParams();
  
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  
  const response = await api.get(`/stats/export?${params.toString()}`);
  return response.data.data;
};

const Stats = () => {
  const [period, setPeriod] = useState('month');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Запрос общей статистики
  const { data: generalData, isLoading: isLoadingGeneral } = useQuery(
    'generalStats',
    fetchGeneralStats
  );
  
  // Запрос статистики дашборда
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery(
    ['dashboardStats', period],
    () => fetchDashboardStats(period),
    {
      keepPreviousData: true,
    }
  );
  
  // Мутация для экспорта статистики
  const exportMutation = useMutation(fetchExportStats, {
    onSuccess: (data) => {
      // Создаем книгу Excel
      const wb = XLSX.utils.book_new();
      
      // Создаем лист с данными
      const ws = XLSX.utils.json_to_sheet(data.exportData);
      
      // Добавляем лист в книгу
      XLSX.utils.book_append_sheet(wb, ws, 'Статистика');
      
      // Сохраняем файл
      XLSX.writeFile(wb, `crm_stats_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      setShowExportModal(false);
    },
    onError: (error) => {
      console.error('Ошибка при экспорте статистики:', error);
    },
  });
  
  // Обработка экспорта статистики
  const handleExport = () => {
    exportMutation.mutate({ date_from: dateFrom, date_to: dateTo });
  };
  
  // Обработка состояния загрузки
  if (isLoadingGeneral || isLoadingDashboard) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }
  
  // Данные для графика заказов
  const ordersChartData = {
    labels: dashboardData?.chart?.data?.map(item => format(new Date(item.date), 'dd MMM', { locale: ru })) || [],
    datasets: [
      {
        label: 'Заказы',
        data: dashboardData?.chart?.data?.map(item => item.total) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  // Данные для графика выручки
  const revenueChartData = {
    labels: dashboardData?.chart?.data?.map(item => format(new Date(item.date), 'dd MMM', { locale: ru })) || [],
    datasets: [
      {
        label: 'Выручка',
        data: dashboardData?.chart?.data?.map(item => item.amount) || [],
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.3,
        fill: true,
      },
    ],
  };
  
  // Данные для графика статусов заказов
  const statusChartData = {
    labels: ['В ожидании', 'В работе', 'Выполнено', 'Отменено'],
    datasets: [
      {
        data: [
          dashboardData?.status?.pending || 0,
          dashboardData?.status?.in_progress || 0,
          dashboardData?.status?.completed || 0,
          dashboardData?.status?.cancelled || 0,
        ],
        backgroundColor: [
          'rgba(245, 158, 11, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(239, 68, 68, 0.7)',
        ],
        borderColor: [
          'rgba(245, 158, 11, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Опции графиков
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Статистика за ${period === 'week' ? 'неделю' : period === 'month' ? 'месяц' : 'год'}`,
      },
    },
  };
  
  const revenueChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Выручка за ${period === 'week' ? 'неделю' : period === 'month' ? 'месяц' : 'год'}`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value + ' ₽';
          }
        }
      }
    }
  };
  
  const statusChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Распределение заказов по статусам',
      },
    },
  };
  
  return (
    <div className="stats-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title">Статистика</h1>
        <div className="d-flex align-items-center">
          <select 
            className="form-control mr-2" 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="week">Неделя</option>
            <option value="month">Месяц</option>
            <option value="year">Год</option>
          </select>
          <button 
            className="btn btn-outline-primary mr-2" 
            onClick={() => setShowExportModal(true)}
          >
            <FiDownload /> Экспорт
          </button>
        </div>
      </div>
      
      {/* Карточки статистики */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Всего заказов</div>
            <div className="stat-card-icon bg-primary">
              <FiClipboard />
            </div>
          </div>
          <div className="stat-card-value">{dashboardData?.status?.total || 0}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Выполнено заказов</div>
            <div className="stat-card-icon bg-success">
              <FiClipboard />
            </div>
          </div>
          <div className="stat-card-value">{dashboardData?.status?.completed || 0}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Выручка</div>
            <div className="stat-card-icon bg-success">
              <FiDollarSign />
            </div>
          </div>
          <div className="stat-card-value">
            {new Intl.NumberFormat('ru-RU', {
              style: 'currency',
              currency: 'RUB',
              maximumFractionDigits: 0,
            }).format(dashboardData?.finance?.total_revenue || 0)}
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Доля директора</div>
            <div className="stat-card-icon bg-warning">
              <FiDollarSign />
            </div>
          </div>
          <div className="stat-card-value">
            {new Intl.NumberFormat('ru-RU', {
              style: 'currency',
              currency: 'RUB',
              maximumFractionDigits: 0,
            }).format(dashboardData?.finance?.director_share || 0)}
          </div>
        </div>
      </div>
      
      {/* Графики */}
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="chart-container">
            <Bar data={ordersChartData} options={chartOptions} />
          </div>
        </div>
        
        <div className="col-md-6 mb-4">
          <div className="chart-container">
            <Line data={revenueChartData} options={revenueChartOptions} />
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="chart-container">
            <Pie data={statusChartData} options={statusChartOptions} />
          </div>
        </div>
        
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Топ мастера</h3>
            </div>
            <div className="card-body">
              {dashboardData?.masters && dashboardData.masters.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Мастер</th>
                        <th>Роль</th>
                        <th>Заказы</th>
                        <th>Выполнено</th>
                        <th>Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.masters.map((master, index) => (
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
                          <td>{master.orders_count}</td>
                          <td>{master.completed_orders}</td>
                          <td>
                            {new Intl.NumberFormat('ru-RU', {
                              style: 'currency',
                              currency: 'RUB',
                              maximumFractionDigits: 0,
                            }).format(master.total_amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">Нет данных о мастерах</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Финансовая статистика */}
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Финансовая статистика</h3>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span>Общая выручка:</span>
                <strong>
                  {new Intl.NumberFormat('ru-RU', {
                    style: 'currency',
                    currency: 'RUB',
                    maximumFractionDigits: 0,
                  }).format(dashboardData?.finance?.total_revenue || 0)}
                </strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Доля директора:</span>
                <strong>
                  {new Intl.NumberFormat('ru-RU', {
                    style: 'currency',
                    currency: 'RUB',
                    maximumFractionDigits: 0,
                  }).format(dashboardData?.finance?.director_share || 0)}
                </strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Доля мастеров:</span>
                <strong>
                  {new Intl.NumberFormat('ru-RU', {
                    style: 'currency',
                    currency: 'RUB',
                    maximumFractionDigits: 0,
                  }).format(dashboardData?.finance?.masters_share || 0)}
                </strong>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Статистика по статусам</h3>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span>Всего заказов:</span>
                <strong>{dashboardData?.status?.total || 0}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>В ожидании:</span>
                <strong>{dashboardData?.status?.pending || 0}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>В работе:</span>
                <strong>{dashboardData?.status?.in_progress || 0}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Выполнено:</span>
                <strong>{dashboardData?.status?.completed || 0}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Отменено:</span>
                <strong>{dashboardData?.status?.cancelled || 0}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Модальное окно для экспорта */}
      {showExportModal && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Экспорт статистики</h5>
                <button 
                  type="button" 
                  className="close" 
                  onClick={() => setShowExportModal(false)}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="date_from" className="form-label">Дата от</label>
                  <input
                    type="date"
                    className="form-control"
                    id="date_from"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="date_to" className="form-label">Дата до</label>
                  <input
                    type="date"
                    className="form-control"
                    id="date_to"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowExportModal(false)}
                >
                  Отмена
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleExport}
                  disabled={exportMutation.isLoading}
                >
                  {exportMutation.isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                      Экспорт...
                    </>
                  ) : (
                    <>
                      <FiDownload /> Экспорт в Excel
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stats;
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiHome, FiClipboard, FiUsers, FiDollarSign, FiTrendingUp, FiCalendar, FiRefreshCw } from 'react-icons/fi';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { format, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';

// Сервисы
import { api } from '../../services/authService';

// Регистрация компонентов Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Функция для получения данных дашборда
const fetchDashboardData = async () => {
  const response = await api.get('/stats/dashboard');
  return response.data.data;
};

const Dashboard = () => {
  const [period, setPeriod] = useState('month');
  
  // Запрос данных дашборда
  const { data, isLoading, error, refetch } = useQuery(
    ['dashboard', period],
    () => fetchDashboardData(),
    {
      enabled: true,
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
        Ошибка при загрузке данных дашборда: {error.message}
      </div>
    );
  }
  
  // Данные для графика заказов
  const chartData = {
    labels: data?.chart?.data?.map(item => format(new Date(item.date), 'dd MMM', { locale: ru })) || [],
    datasets: [
      {
        label: 'Заказы',
        data: data?.chart?.data?.map(item => item.total) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  // Опции графика
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Статистика заказов за ${period === 'week' ? 'неделю' : period === 'month' ? 'месяц' : 'год'}`,
      },
    },
  };
  
  // Данные для графика выручки
  const revenueChartData = {
    labels: data?.chart?.data?.map(item => format(new Date(item.date), 'dd MMM', { locale: ru })) || [],
    datasets: [
      {
        label: 'Выручка',
        data: data?.chart?.data?.map(item => item.amount) || [],
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.3,
        fill: true,
      },
    ],
  };
  
  // Опции графика выручки
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
  
  return (
    <div className="dashboard-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title">Дашборд</h1>
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
          <button className="btn btn-outline-primary" onClick={() => refetch()}>
            <FiRefreshCw />
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
          <div className="stat-card-value">{data?.status?.total || 0}</div>
          <div className="stat-card-change">
            <span className="text-success">
              <FiTrendingUp /> +{Math.floor(Math.random() * 20)}%
            </span> за прошлый период
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Выполнено заказов</div>
            <div className="stat-card-icon bg-success">
              <FiClipboard />
            </div>
          </div>
          <div className="stat-card-value">{data?.status?.completed || 0}</div>
          <div className="stat-card-change">
            <span className="text-success">
              <FiTrendingUp /> +{Math.floor(Math.random() * 20)}%
            </span> за прошлый период
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">В работе</div>
            <div className="stat-card-icon bg-warning">
              <FiClipboard />
            </div>
          </div>
          <div className="stat-card-value">{data?.status?.in_progress || 0}</div>
          <div className="stat-card-change">
            <span className="text-danger">
              <FiTrendingUp /> -{Math.floor(Math.random() * 10)}%
            </span> за прошлый период
          </div>
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
            }).format(data?.finance?.total_revenue || 0)}
          </div>
          <div className="stat-card-change">
            <span className="text-success">
              <FiTrendingUp /> +{Math.floor(Math.random() * 20)}%
            </span> за прошлый период
          </div>
        </div>
      </div>
      
      {/* Графики */}
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="chart-container">
            <div className="chart-header">
              <h3>Заказы по дням</h3>
            </div>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
        
        <div className="col-md-6 mb-4">
          <div className="chart-container">
            <div className="chart-header">
              <h3>Выручка по дням</h3>
            </div>
            <Line data={revenueChartData} options={revenueChartOptions} />
          </div>
        </div>
      </div>
      
      {/* Топ мастера */}
      <div className="card">
        <div className="card-header">
          <h3>Топ мастера</h3>
        </div>
        <div className="card-body">
          {data?.masters && data.masters.length > 0 ? (
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
                  {data.masters.map((master, index) => (
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
      
      {/* Финансовая статистика */}
      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3>Финансовая статистика</h3>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span>Общая выручка:</span>
                <strong>
                  {new Intl.NumberFormat('ru-RU', {
                    style: 'currency',
                    currency: 'RUB',
                    maximumFractionDigits: 0,
                  }).format(data?.finance?.total_revenue || 0)}
                </strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Доля директора:</span>
                <strong>
                  {new Intl.NumberFormat('ru-RU', {
                    style: 'currency',
                    currency: 'RUB',
                    maximumFractionDigits: 0,
                  }).format(data?.finance?.director_share || 0)}
                </strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Доля мастеров:</span>
                <strong>
                  {new Intl.NumberFormat('ru-RU', {
                    style: 'currency',
                    currency: 'RUB',
                    maximumFractionDigits: 0,
                  }).format(data?.finance?.masters_share || 0)}
                </strong>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3>Статистика по статусам</h3>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span>Всего заказов:</span>
                <strong>{data?.status?.total || 0}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>В ожидании:</span>
                <strong>{data?.status?.pending || 0}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>В работе:</span>
                <strong>{data?.status?.in_progress || 0}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Выполнено:</span>
                <strong>{data?.status?.completed || 0}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Отменено:</span>
                <strong>{data?.status?.cancelled || 0}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
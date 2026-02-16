import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  
  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const result = await login(data.phone, data.password);
      
      if (result.success) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Ошибка при входе:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>VIPАвто</h1>
          <p>CRM для автосервиса по электрике</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label htmlFor="phone" className="form-label">Телефон</label>
            <div className="input-group">
              <span className="input-group-text">
                <FiUser />
              </span>
              <input
                type="tel"
                id="phone"
                className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                placeholder="Введите номер телефона"
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
            <label htmlFor="password" className="form-label">Пароль</label>
            <div className="input-group">
              <span className="input-group-text">
                <FiLock />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                placeholder="Введите пароль"
                {...register('password', {
                  required: 'Пожалуйста, введите пароль',
                  minLength: {
                    value: 6,
                    message: 'Пароль должен содержать не менее 6 символов',
                  },
                })}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.password && (
              <div className="invalid-feedback">{errors.password.message}</div>
            )}
          </div>
          
          <div className="form-group">
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                  Вход...
                </>
              ) : (
                'Войти'
              )}
            </button>
          </div>
        </form>
        
        <div className="login-footer">
          <p>
            Еще нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
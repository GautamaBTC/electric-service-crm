import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiUser, FiLock, FiEye, FiEyeOff, FiPhone, FiUserPlus } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  
  const password = watch('password');
  
  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const result = await registerUser({
        full_name: data.full_name,
        phone: data.phone,
        password: data.password,
        role: data.role,
      });
      
      if (result.success) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>VIPАвто</h1>
          <p>Регистрация в CRM для автосервиса по электрике</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label htmlFor="full_name" className="form-label">ФИО</label>
            <div className="input-group">
              <span className="input-group-text">
                <FiUser />
              </span>
              <input
                type="text"
                id="full_name"
                className={`form-control ${errors.full_name ? 'is-invalid' : ''}`}
                placeholder="Введите ваше ФИО"
                {...register('full_name', {
                  required: 'Пожалуйста, введите ФИО',
                  minLength: {
                    value: 3,
                    message: 'ФИО должно содержать не менее 3 символов',
                  },
                })}
              />
            </div>
            {errors.full_name && (
              <div className="invalid-feedback">{errors.full_name.message}</div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="phone" className="form-label">Телефон</label>
            <div className="input-group">
              <span className="input-group-text">
                <FiPhone />
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
            <label htmlFor="role" className="form-label">Роль</label>
            <div className="input-group">
              <span className="input-group-text">
                <FiUserPlus />
              </span>
              <select
                id="role"
                className={`form-control ${errors.role ? 'is-invalid' : ''}`}
                {...register('role', {
                  required: 'Пожалуйста, выберите роль',
                })}
              >
                <option value="">Выберите роль</option>
                <option value="master">Мастер</option>
                <option value="director">Директор</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
            {errors.role && (
              <div className="invalid-feedback">{errors.role.message}</div>
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
            <label htmlFor="confirmPassword" className="form-label">Подтверждение пароля</label>
            <div className="input-group">
              <span className="input-group-text">
                <FiLock />
              </span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                placeholder="Подтвердите пароль"
                {...register('confirmPassword', {
                  required: 'Пожалуйста, подтвердите пароль',
                  validate: (value) =>
                    value === password || 'Пароли не совпадают',
                })}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={toggleConfirmPasswordVisibility}
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.confirmPassword && (
              <div className="invalid-feedback">{errors.confirmPassword.message}</div>
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
                  Регистрация...
                </>
              ) : (
                'Зарегистрироваться'
              )}
            </button>
          </div>
        </form>
        
        <div className="login-footer">
          <p>
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
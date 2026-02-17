import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiSave, FiX, FiPlus, FiTrash2, FiUser, FiTool, FiPackage, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Сервисы
import { api } from '../../services/authService';

// Функция для получения заказа
const fetchOrder = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data.data;
};

// Функция для получения мастеров
const fetchMasters = async () => {
  const response = await api.get('/masters');
  return response.data.data;
};

// Функция для создания заказа
const createOrder = async (orderData) => {
  const response = await api.post('/orders', orderData);
  return response.data;
};

// Функция для обновления заказа
const updateOrder = async ({ id, ...orderData }) => {
  const response = await api.put(`/orders/${id}`, orderData);
  return response.data;
};

const OrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);
  
  const [masters, setMasters] = useState([]);
  const [selectedMasters, setSelectedMasters] = useState([]);
  
  // Форма
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      client_name: '',
      client_phone: '',
      car_model: '',
      car_number: '',
      car_year: '',
      problem_description: '',
      masters: [],
      works: [],
      materials: [],
      parts: [],
    },
  });
  
  // Поля массивов для работ, материалов и запчастей
  const {
    fields: workFields,
    append: appendWork,
    remove: removeWork,
  } = useFieldArray({
    control,
    name: 'works',
  });
  
  const {
    fields: materialFields,
    append: appendMaterial,
    remove: removeMaterial,
  } = useFieldArray({
    control,
    name: 'materials',
  });
  
  const {
    fields: partFields,
    append: appendPart,
    remove: removePart,
  } = useFieldArray({
    control,
    name: 'parts',
  });
  
  // Запрос мастеров
  const { data: mastersData, isLoading: isLoadingMasters } = useQuery(
    'masters',
    fetchMasters,
    {
      onSuccess: (data) => {
        setMasters(data.masters || []);
      },
    }
  );
  
  // Запрос заказа при редактировании
  const { data: orderData, isLoading: isLoadingOrder } = useQuery(
    ['order', id],
    () => fetchOrder(id),
    {
      enabled: isEdit,
      onSuccess: (data) => {
        const order = data.order;
        
        // Заполняем форму данными заказа
        reset({
          client_name: order.client_name,
          client_phone: order.client_phone,
          car_model: order.car_model,
          car_number: order.car_number,
          car_year: order.car_year || '',
          problem_description: order.problem_description || '',
          masters: order.masters.map(master => ({
            id: master.id,
            work_percentage: 100 / order.masters.length,
          })),
          works: order.orderMasters.flatMap(orderMaster => 
            orderMaster.works.map(work => ({
              name: work.name,
              price: work.price,
            }))
          ),
          materials: order.orderMasters.flatMap(orderMaster => 
            orderMaster.materials.map(material => ({
              name: material.name,
              quantity: material.quantity,
              price: material.price,
            }))
          ),
          parts: order.orderMasters.flatMap(orderMaster => 
            orderMaster.parts.map(part => ({
              name: part.name,
              quantity: part.quantity,
              price: part.price,
            }))
          ),
        });
        
        setSelectedMasters(order.masters.map(master => master.id));
      },
    }
  );
  
  // Мутация для создания заказа
  const createOrderMutation = useMutation(createOrder, {
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries('orders');
      navigate('/orders');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка при создании заказа');
    },
  });
  
  // Мутация для обновления заказа
  const updateOrderMutation = useMutation(updateOrder, {
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries('orders');
      queryClient.invalidateQueries(['order', id]);
      navigate(`/orders/${id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка при обновлении заказа');
    },
  });
  
  // Обработка отправки формы
  const onSubmit = (data) => {
    // Форматируем данные для отправки
    const formattedData = {
      ...data,
      masters: data.masters.map(master => ({
        id: master.id,
        work_percentage: master.work_percentage || (100 / data.masters.length),
      })),
      works: data.works.filter(work => work.name),
      materials: data.materials.filter(material => material.name),
      parts: data.parts.filter(part => part.name),
    };
    
    if (isEdit) {
      updateOrderMutation.mutate({ id, ...formattedData });
    } else {
      createOrderMutation.mutate(formattedData);
    }
  };
  
  // Обработка выбора мастера
  const handleMasterChange = (e) => {
    const masterId = parseInt(e.target.value);
    const isChecked = e.target.checked;
    
    if (isChecked) {
      // Добавляем мастера в список выбранных
      setSelectedMasters([...selectedMasters, masterId]);
      
      // Добавляем мастера в форму
      const currentMasters = watch('masters') || [];
      setValue('masters', [...currentMasters, { id: masterId, work_percentage: 100 / (selectedMasters.length + 1) }]);
      
      // Обновляем проценты для всех мастеров
      const updatedMasters = [...currentMasters, { id: masterId, work_percentage: 100 / (selectedMasters.length + 1) }];
      setValue('masters', updatedMasters.map(master => ({
        ...master,
        work_percentage: 100 / updatedMasters.length,
      })));
    } else {
      // Удаляем мастера из списка выбранных
      setSelectedMasters(selectedMasters.filter(id => id !== masterId));
      
      // Удаляем мастера из формы
      const currentMasters = watch('masters') || [];
      setValue('masters', currentMasters.filter(master => master.id !== masterId));
      
      // Обновляем проценты для оставшихся мастеров
      const updatedMasters = currentMasters.filter(master => master.id !== masterId);
      if (updatedMasters.length > 0) {
        setValue('masters', updatedMasters.map(master => ({
          ...master,
          work_percentage: 100 / updatedMasters.length,
        })));
      }
    }
  };
  
  // Обработка изменения процента работы мастера
  const handleWorkPercentageChange = (masterId, percentage) => {
    const currentMasters = watch('masters') || [];
    const updatedMasters = currentMasters.map(master => 
      master.id === masterId ? { ...master, work_percentage: parseFloat(percentage) || 0 } : master
    );
    
    setValue('masters', updatedMasters);
  };
  
  // Добавление работы
  const handleAddWork = () => {
    appendWork({ name: '', price: 0 });
  };
  
  // Добавление материала
  const handleAddMaterial = () => {
    appendMaterial({ name: '', quantity: 1, price: 0 });
  };
  
  // Добавление запчасти
  const handleAddPart = () => {
    appendPart({ name: '', quantity: 1, price: 0 });
  };
  
  // Обработка состояния загрузки
  if (isEdit && isLoadingOrder) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }
  
  return (
    <div className="order-form-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title">{isEdit ? 'Редактирование заказа' : 'Создание заказа'}</h1>
        <button 
          type="button" 
          className="btn btn-outline-secondary" 
          onClick={() => navigate('/orders')}
        >
          <FiX /> Отмена
        </button>
      </div>
      
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="row">
              <div className="col-md-6">
                <h3 className="mb-3">Информация о клиенте</h3>
                
                <div className="form-group">
                  <label htmlFor="client_name" className="form-label">ФИО клиента *</label>
                  <input
                    type="text"
                    className={`form-control ${errors.client_name ? 'is-invalid' : ''}`}
                    id="client_name"
                    {...register('client_name', {
                      required: 'Пожалуйста, введите ФИО клиента',
                    })}
                  />
                  {errors.client_name && (
                    <div className="invalid-feedback">{errors.client_name.message}</div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="client_phone" className="form-label">Телефон клиента *</label>
                  <input
                    type="tel"
                    className={`form-control ${errors.client_phone ? 'is-invalid' : ''}`}
                    id="client_phone"
                    {...register('client_phone', {
                      required: 'Пожалуйста, введите телефон клиента',
                      pattern: {
                        value: /^(\+7|8)\d{10}$/,
                        message: 'Неверный формат номера телефона',
                      },
                    })}
                  />
                  {errors.client_phone && (
                    <div className="invalid-feedback">{errors.client_phone.message}</div>
                  )}
                </div>
                
                <h3 className="mb-3 mt-4">Информация об автомобиле</h3>
                
                <div className="form-group">
                  <label htmlFor="car_model" className="form-label">Модель автомобиля *</label>
                  <input
                    type="text"
                    className={`form-control ${errors.car_model ? 'is-invalid' : ''}`}
                    id="car_model"
                    {...register('car_model', {
                      required: 'Пожалуйста, введите модель автомобиля',
                    })}
                  />
                  {errors.car_model && (
                    <div className="invalid-feedback">{errors.car_model.message}</div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="car_number" className="form-label">Государственный номер *</label>
                  <input
                    type="text"
                    className={`form-control ${errors.car_number ? 'is-invalid' : ''}`}
                    id="car_number"
                    {...register('car_number', {
                      required: 'Пожалуйста, введите гос. номер',
                    })}
                  />
                  {errors.car_number && (
                    <div className="invalid-feedback">{errors.car_number.message}</div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="car_year" className="form-label">Год выпуска</label>
                  <input
                    type="number"
                    className="form-control"
                    id="car_year"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    {...register('car_year')}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="problem_description" className="form-label">Описание проблемы</label>
                  <textarea
                    className="form-control"
                    id="problem_description"
                    rows="3"
                    {...register('problem_description')}
                  ></textarea>
                </div>
              </div>
              
              <div className="col-md-6">
                <h3 className="mb-3">Мастера</h3>
                
                {isLoadingMasters ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                  </div>
                ) : (
                  <div className="form-group">
                    {masters.length > 0 ? (
                      masters.map((master) => (
                        <div key={master.id} className="custom-control custom-checkbox mb-2">
                          <input
                            type="checkbox"
                            className="custom-control-input"
                            id={`master-${master.id}`}
                            value={master.id}
                            checked={selectedMasters.includes(master.id)}
                            onChange={handleMasterChange}
                          />
                          <label className="custom-control-label" htmlFor={`master-${master.id}`}>
                            {master.full_name}
                          </label>
                          
                          {selectedMasters.includes(master.id) && (
                            <div className="ml-4 mt-2">
                              <label className="form-label small">Процент работы:</label>
                              <div className="input-group input-group-sm">
                                <input
                                  type="number"
                                  className="form-control"
                                  min="0"
                                  max="100"
                                  step="1"
                                  value={
                                    watch('masters')?.find(m => m.id === master.id)?.work_percentage || 0
                                  }
                                  onChange={(e) => handleWorkPercentageChange(master.id, e.target.value)}
                                />
                                <div className="input-group-append">
                                  <span className="input-group-text">%</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-muted">Мастера не найдены</p>
                    )}
                    
                    {selectedMasters.length === 0 && (
                      <div className="invalid-feedback d-block">
                        Пожалуйста, выберите хотя бы одного мастера
                      </div>
                    )}
                  </div>
                )}
                
                <h3 className="mb-3 mt-4">Работы</h3>
                
                <div className="form-group">
                  {workFields.map((field, index) => (
                    <div key={field.id} className="d-flex align-items-center mb-2">
                      <div className="input-group">
                        <div className="input-group-prepend">
                          <span className="input-group-text">
                            <FiTool />
                          </span>
                        </div>
                        <input
                          type="text"
                          className={`form-control ${errors.works?.[index]?.name ? 'is-invalid' : ''}`}
                          placeholder="Название работы"
                          {...register(`works.${index}.name`)}
                        />
                        <input
                          type="number"
                          className={`form-control ${errors.works?.[index]?.price ? 'is-invalid' : ''}`}
                          placeholder="Цена"
                          min="0"
                          step="0.01"
                          {...register(`works.${index}.price`, { valueAsNumber: true })}
                        />
                        <div className="input-group-append">
                          <span className="input-group-text">₽</span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => removeWork(index)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={handleAddWork}
                  >
                    <FiPlus /> Добавить работу
                  </button>
                </div>
                
                <h3 className="mb-3 mt-4">Материалы</h3>
                
                <div className="form-group">
                  {materialFields.map((field, index) => (
                    <div key={field.id} className="d-flex align-items-center mb-2">
                      <div className="input-group">
                        <div className="input-group-prepend">
                          <span className="input-group-text">
                            <FiPackage />
                          </span>
                        </div>
                        <input
                          type="text"
                          className={`form-control ${errors.materials?.[index]?.name ? 'is-invalid' : ''}`}
                          placeholder="Название материала"
                          {...register(`materials.${index}.name`)}
                        />
                        <input
                          type="number"
                          className={`form-control ${errors.materials?.[index]?.quantity ? 'is-invalid' : ''}`}
                          placeholder="Кол-во"
                          min="1"
                          step="1"
                          {...register(`materials.${index}.quantity`, { valueAsNumber: true })}
                        />
                        <input
                          type="number"
                          className={`form-control ${errors.materials?.[index]?.price ? 'is-invalid' : ''}`}
                          placeholder="Цена"
                          min="0"
                          step="0.01"
                          {...register(`materials.${index}.price`, { valueAsNumber: true })}
                        />
                        <div className="input-group-append">
                          <span className="input-group-text">₽</span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => removeMaterial(index)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={handleAddMaterial}
                  >
                    <FiPlus /> Добавить материал
                  </button>
                </div>
                
                <h3 className="mb-3 mt-4">Запчасти</h3>
                
                <div className="form-group">
                  {partFields.map((field, index) => (
                    <div key={field.id} className="d-flex align-items-center mb-2">
                      <div className="input-group">
                        <div className="input-group-prepend">
                          <span className="input-group-text">
                            <FiPackage />
                          </span>
                        </div>
                        <input
                          type="text"
                          className={`form-control ${errors.parts?.[index]?.name ? 'is-invalid' : ''}`}
                          placeholder="Название запчасти"
                          {...register(`parts.${index}.name`)}
                        />
                        <input
                          type="number"
                          className={`form-control ${errors.parts?.[index]?.quantity ? 'is-invalid' : ''}`}
                          placeholder="Кол-во"
                          min="1"
                          step="1"
                          {...register(`parts.${index}.quantity`, { valueAsNumber: true })}
                        />
                        <input
                          type="number"
                          className={`form-control ${errors.parts?.[index]?.price ? 'is-invalid' : ''}`}
                          placeholder="Цена"
                          min="0"
                          step="0.01"
                          {...register(`parts.${index}.price`, { valueAsNumber: true })}
                        />
                        <div className="input-group-append">
                          <span className="input-group-text">₽</span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => removePart(index)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={handleAddPart}
                  >
                    <FiPlus /> Добавить запчасть
                  </button>
                </div>
              </div>
            </div>
            
            <div className="d-flex justify-content-end mt-4">
              <button
                type="button"
                className="btn btn-outline-secondary mr-2"
                onClick={() => navigate('/orders')}
              >
                <FiX /> Отмена
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createOrderMutation.isLoading || updateOrderMutation.isLoading}
              >
                <FiSave /> {isEdit ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;
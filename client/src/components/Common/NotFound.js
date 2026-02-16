import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiSearch } from 'react-icons/fi';

const NotFound = () => {
  return (
    <div className="not-found-page">
      <div className="container text-center py-5">
        <div className="mb-4">
          <FiSearch size={64} className="text-muted" />
        </div>
        <h1 className="display-1">404</h1>
        <h2 className="mb-4">Страница не найдена</h2>
        <p className="lead text-muted mb-4">
          К сожалению, страница, которую вы ищете, не существует или была перемещена.
        </p>
        <Link to="/" className="btn btn-primary">
          <FiHome className="mr-2" />
          Перейти на главную
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
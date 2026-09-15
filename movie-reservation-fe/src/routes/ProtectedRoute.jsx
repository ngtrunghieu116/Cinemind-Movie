import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/ui/Loading';
import ROUTES from '../constants/routes';

export const ProtectedRoute = () => {
  const { token, loading } = useAuth();

  if (loading) {
    return <Loading text="Đang xác thực tài khoản..." fullScreen />;
  }

  return token ? <Outlet /> : <Navigate to={ROUTES.LOGIN} replace />;
};

export default ProtectedRoute;

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/ui/Loading';
import ROUTES from '../constants/routes';

export const GuestRoute = () => {
  const { token, loading } = useAuth();

  if (loading) {
    return <Loading text="Đang kiểm tra trạng thái..." fullScreen />;
  }

  return !token ? <Outlet /> : <Navigate to={ROUTES.HOME} replace />;
};

export default GuestRoute;

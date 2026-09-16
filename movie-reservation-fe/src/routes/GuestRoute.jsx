import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/ui/Loading';
import ROUTES from '../constants/routes';

export const GuestRoute = () => {
  const { token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading text="Đang kiểm tra trạng thái..." fullScreen />;
  }

  if (token) {
    const searchParams = new URLSearchParams(location.search);
    const redirectUrl = searchParams.get('redirect') 
      || sessionStorage.getItem('cinemind_pending_payment_url') 
      || location.state?.from 
      || ROUTES.HOME;
    
    // Clear pending session if matched
    if (sessionStorage.getItem('cinemind_pending_payment_url') === redirectUrl) {
      sessionStorage.removeItem('cinemind_pending_payment_url');
    }

    return <Navigate to={redirectUrl} replace />;
  }

  return <Outlet />;
};

export default GuestRoute;

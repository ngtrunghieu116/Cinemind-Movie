import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { Toaster } from 'react-hot-toast';

export const AppProviders = ({ children }) => {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0f172a',
            color: '#ffffff',
            fontSize: '14px',
            borderRadius: '8px',
          },
        }}
      />
      {children}
    </AuthProvider>
  );
};

export default AppProviders;

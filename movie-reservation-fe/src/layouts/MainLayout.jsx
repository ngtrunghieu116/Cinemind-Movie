import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import ErrorBoundary from '../components/common/ErrorBoundary';
import ChatWidget from '../components/ai/ChatWidget';

const MainLayout = () => {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between relative selection:bg-red-500 selection:text-white">
        <div>
          <Header />
          <main className="w-full">
            <Outlet />
          </main>
        </div>
        <Footer />
        <ChatWidget />
      </div>
    </ErrorBoundary>
  );
};

export default MainLayout;

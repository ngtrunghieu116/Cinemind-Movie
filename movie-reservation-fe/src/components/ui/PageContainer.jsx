import React from 'react';
import Loading from './Loading';

export const PageContainer = ({ children, className = '' }) => {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full ${className}`}>
      {children}
    </div>
  );
};

export const PageHeader = ({ title, subtitle, action, className = '' }) => {
  return (
    <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 ${className}`}>
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export const PageSection = ({ title, children, action, className = '' }) => {
  return (
    <section className={`mb-12 ${className}`}>
      {title && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-red-600 rounded-full inline-block"></span>
            {title}
          </h2>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
};

export const PageLoading = ({ text = 'Đang tải trang...' }) => {
  return <Loading text={text} fullScreen={false} />;
};

export default PageContainer;

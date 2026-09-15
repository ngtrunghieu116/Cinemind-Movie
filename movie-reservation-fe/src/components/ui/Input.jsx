import React from 'react';

const Input = ({
  label,
  type = 'text',
  error,
  helperText,
  icon: Icon,
  className = '',
  id,
  required = false,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon size={18} />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          required={required}
          className={`w-full ${Icon ? 'pl-10' : 'pl-3.5'} pr-3.5 py-2 bg-white border ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-red-500 focus:border-red-500'
          } rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-xs text-red-500 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};

export default Input;

// src/shared/Form/FormInput.jsx
import { AlertCircle } from 'lucide-react';

export const FormInput = ({ 
  label, 
  error, 
  required = false, 
  leftSymbol,
  registration,
  ...props 
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-semibold text-zinc-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftSymbol && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">
            {leftSymbol}
          </span>
        )}
        
        <input 
          className={`w-full ${leftSymbol ? 'pl-8' : 'pl-4'} pr-4 py-2.5 bg-zinc-50 border rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
            error 
              ? 'border-red-500 focus:ring-red-500/20' 
              : 'border-zinc-200/80 focus:ring-blue-500/20 focus:border-blue-500'
          }`}
          {...registration} // <--- Esparcimos los eventos (onChange, onBlur, name, ref)
          {...props}
        />
      </div>

      {error && (
        <span className="flex items-center gap-1 text-[11px] text-red-500 font-medium mt-1">
          <AlertCircle size={12}/> {error}
        </span>
      )}
    </div>
  );
};
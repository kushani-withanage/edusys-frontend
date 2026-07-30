import React, { forwardRef } from 'react';
import { cn } from '@/utils/utils';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  rightElement?: React.ReactNode;
  fullWidth?: boolean;
  containerClassName?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      rightElement,
      fullWidth = true,
      id,
      className,
      containerClassName,
      disabled,
      type = 'text',
      required,
      ...props
    },
    ref
  ) => {
    // Generate simple ID if not provided
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    // Render left icon helper
    const renderIcon = () => {
      if (!Icon) return null;
      
      return (
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
          {typeof Icon === 'function' || (typeof Icon === 'object' && 'render' in (Icon as any)) ? (
            // If it's a React component (like a Lucide icon)
            React.createElement(Icon as React.ComponentType<any>, { className: "h-5 w-5" })
          ) : (
            // If it's a pre-rendered React node
            Icon as React.ReactNode
          )}
        </span>
      );
    };

    return (
      <div className={cn('space-y-1.5 text-left', fullWidth ? 'w-full' : 'w-fit', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-xs font-bold tracking-wider uppercase select-none transition-colors duration-200',
              disabled ? 'text-slate-400' : error ? 'text-rose-500' : 'text-slate-700'
            )}
          >
            {label}
            {required && <span className="ml-1 text-rose-500">*</span>}
          </label>
        )}

        <div className="relative">
          {renderIcon()}
          
          <input
            id={inputId}
            ref={ref}
            type={type}
            disabled={disabled}
            className={cn(
              'w-full py-3.5 bg-[#F8FAFC] border rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 font-medium',
              Icon ? 'pl-12' : 'pl-4',
              rightElement ? 'pr-12' : 'pr-4',
              disabled && 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed',
              error
                ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20 focus:bg-white focus:ring-4 focus:ring-rose-500/10'
                : 'border-[#E2E8F0] focus:border-[#4F3FF0] focus:bg-white focus:ring-4 focus:ring-[#4F3FF0]/10',
              className
            )}
            {...props}
          />

          {rightElement && (
            <span className="absolute inset-y-0 right-0 flex items-center pr-3">
              {rightElement}
            </span>
          )}
        </div>

        {error ? (
          <p className="text-xs font-semibold text-rose-500 animate-in fade-in slide-in-from-top-1 duration-200">
            {error}
          </p>
        ) : (
          helperText && (
            <p className="text-xs text-slate-500">
              {helperText}
            </p>
          )
        )}
      </div>
    );
  }
);

TextField.displayName = 'TextField';

export default TextField;

import React from 'react';
import { cn } from '@/utils/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline' | 'ghost';
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | string;
  size?: 'sm' | 'md' | 'lg';
  width?: 'full' | 'fit' | string;
  isLoading?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'solid',
  color = 'primary',
  size = 'md',
  width,
  isLoading = false,
  startIcon,
  endIcon,
  disabled,
  style,
  ...props
}) => {
  // Determine width styling
  let widthClass = '';
  let inlineWidthStyle: React.CSSProperties = {};

  if (width) {
    if (width === 'full') {
      widthClass = 'w-full';
    } else if (width === 'fit') {
      widthClass = 'w-fit';
    } else if (width.startsWith('w-')) {
      widthClass = width;
    } else {
      inlineWidthStyle = { width };
    }
  }

  // Base styles
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

  // Size styles
  const sizeStyles = {
    sm: 'px-4 py-2 text-xs gap-1.5',
    md: 'px-5 py-3 text-sm gap-2',
    lg: 'px-6 py-4 text-base gap-2.5',
  };

  // Color mappings
  const isPresetColor = ['primary', 'secondary', 'success', 'danger', 'warning'].includes(color);

  let variantStyles = '';

  if (variant === 'solid') {
    if (isPresetColor) {
      switch (color) {
        case 'primary':
          variantStyles = 'bg-[#4F3FF0] hover:bg-[#4335D6] text-white shadow-[0_4px_12px_rgba(79,63,240,0.2)] hover:shadow-[0_6px_20px_rgba(79,63,240,0.3)] focus:ring-[#4F3FF0]';
          break;
        case 'secondary':
          variantStyles = 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#1E293B] focus:ring-slate-400';
          break;
        case 'success':
          variantStyles = 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_4px_12px_rgba(16,185,129,0.2)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.3)] focus:ring-emerald-500';
          break;
        case 'danger':
          variantStyles = 'bg-rose-600 hover:bg-rose-700 text-white shadow-[0_4px_12px_rgba(225,29,72,0.2)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.3)] focus:ring-rose-500';
          break;
        case 'warning':
          variantStyles = 'bg-amber-500 hover:bg-amber-600 text-white shadow-[0_4px_12px_rgba(245,158,11,0.2)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.3)] focus:ring-amber-500';
          break;
      }
    } else {
      // Treat custom color parameter as Tailwind background class or hex value representation
      if (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('hsl')) {
        inlineWidthStyle = { ...inlineWidthStyle, backgroundColor: color, color: '#fff' };
        variantStyles = 'hover:brightness-95 focus:ring-indigo-500';
      } else {
        variantStyles = cn(color, 'text-white focus:ring-indigo-500');
      }
    }
  } else if (variant === 'outline') {
    if (isPresetColor) {
      switch (color) {
        case 'primary':
          variantStyles = 'border-2 border-[#4F3FF0] text-[#4F3FF0] hover:bg-[#4F3FF0]/5 focus:ring-[#4F3FF0]';
          break;
        case 'secondary':
          variantStyles = 'border-2 border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-400';
          break;
        case 'success':
          variantStyles = 'border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 focus:ring-emerald-500';
          break;
        case 'danger':
          variantStyles = 'border-2 border-rose-600 text-rose-600 hover:bg-rose-50 focus:ring-rose-500';
          break;
        case 'warning':
          variantStyles = 'border-2 border-amber-500 text-amber-500 hover:bg-amber-50 focus:ring-amber-500';
          break;
      }
    } else {
      if (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('hsl')) {
        inlineWidthStyle = { ...inlineWidthStyle, borderColor: color, color: color };
        variantStyles = 'border-2 hover:bg-slate-50 focus:ring-indigo-500';
      } else {
        variantStyles = cn('border-2', color, 'focus:ring-indigo-500');
      }
    }
  } else if (variant === 'ghost') {
    if (isPresetColor) {
      switch (color) {
        case 'primary':
          variantStyles = 'text-[#4F3FF0] hover:bg-[#4F3FF0]/5 focus:ring-[#4F3FF0]';
          break;
        case 'secondary':
          variantStyles = 'text-slate-700 hover:bg-slate-100 focus:ring-slate-400';
          break;
        case 'success':
          variantStyles = 'text-emerald-600 hover:bg-emerald-50 focus:ring-emerald-500';
          break;
        case 'danger':
          variantStyles = 'text-rose-600 hover:bg-rose-50 focus:ring-rose-500';
          break;
        case 'warning':
          variantStyles = 'text-amber-600 hover:bg-amber-50 focus:ring-amber-500';
          break;
      }
    } else {
      variantStyles = cn('hover:bg-slate-50 focus:ring-indigo-500', color);
    }
  }

  return (
    <button
      className={cn(baseStyles, sizeStyles[size], variantStyles, widthClass, className)}
      disabled={disabled || isLoading}
      style={{ ...inlineWidthStyle, ...style }}
      {...props}
    >
      {isLoading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent shrink-0" />
      ) : (
        startIcon && <span className="flex shrink-0">{startIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && endIcon && <span className="flex shrink-0">{endIcon}</span>}
    </button>
  );
};

export default Button;

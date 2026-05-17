import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, type, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider ml-1">
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              'flex h-11 w-full rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-white transition-all duration-200 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary group-hover:border-border-light disabled:cursor-not-allowed disabled:opacity-50',
              icon && 'pl-10',
              error && 'border-error focus:ring-error/20 focus:border-error',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="text-[11px] text-error font-medium ml-1 animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

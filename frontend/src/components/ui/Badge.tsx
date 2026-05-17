import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'muted' | 'primary';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'muted', 
  className 
}) => {
  const variants = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-success/10 text-success border-success/20',
    error: 'bg-error/10 text-error border-error/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    info: 'bg-primary/10 text-primary border-primary/20',
    muted: 'bg-bg-elevated text-text-secondary border-border',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

export default Badge;

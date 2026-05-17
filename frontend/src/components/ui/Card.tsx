import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ className, children, hover = false, ...props }) => {
  return (
    <div
      className={cn(
        'bg-bg-card border border-border rounded-xl overflow-hidden',
        hover && 'transition-all duration-300 hover:border-primary/50 hover:bg-bg-hover hover:-translate-y-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

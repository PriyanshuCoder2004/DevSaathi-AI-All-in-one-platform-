import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  width, 
  height, 
  circle = false 
}) => {
  return (
    <div
      className={cn(
        'animate-pulse bg-bg-elevated rounded',
        circle && 'rounded-full',
        className
      )}
      style={{ 
        width: typeof width === 'number' ? `${width}px` : width, 
        height: typeof height === 'number' ? `${height}px` : height 
      }}
    />
  );
};

export default Skeleton;

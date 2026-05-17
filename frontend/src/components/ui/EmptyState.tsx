import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
  ctaRoute?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  ctaLabel,
  onCta,
  ctaRoute,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-bg-elevated rounded-2xl p-5 mb-6 shadow-xl shadow-black/20 border border-border/50">
        <Icon className="w-10 h-10 text-primary" />
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-text-secondary text-sm max-w-xs mb-8 leading-relaxed">
        {description}
      </p>
      
      {ctaLabel && (
        <>
          {ctaRoute ? (
            <Link to={ctaRoute}>
              <Button variant="primary" size="md">
                {ctaLabel}
              </Button>
            </Link>
          ) : (
            <Button variant="primary" size="md" onClick={onCta}>
              {ctaLabel}
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default EmptyState;

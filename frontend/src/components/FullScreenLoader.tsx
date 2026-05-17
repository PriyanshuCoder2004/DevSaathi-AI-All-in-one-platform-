import React from 'react';

const FullScreenLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-bg-primary flex flex-col items-center justify-center z-[9999]">
      <div className="relative w-20 h-20 mb-6">
        {/* Outer Spinning Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        
        {/* Center Logo Placeholder */}
        <div className="absolute inset-2 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
          <span className="text-white font-bold text-2xl">D</span>
        </div>
      </div>
      
      <h2 className="text-white font-medium text-lg tracking-wide animate-pulse">
        Loading DevSaathi AI...
      </h2>
      <p className="text-text-muted text-sm mt-2">
        Preparing your AI companion
      </p>
    </div>
  );
};

export default FullScreenLoader;

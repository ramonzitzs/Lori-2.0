
import React from 'react';

interface DuoButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  color?: string;
  className?: string;
  disabled?: boolean;
}

const DuoButton: React.FC<DuoButtonProps> = ({ 
  children, 
  onClick, 
  color = 'bg-[#58cc02]', 
  className = '',
  disabled = false
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${color} 
        ${className}
        duo-button
        relative
        py-3 px-6
        rounded-2xl
        font-extrabold
        text-white
        uppercase
        tracking-wider
        text-sm
        flex items-center justify-center
        border-b-4 border-black/20
        disabled:opacity-50
        active:border-b-0
        active:translate-y-1
      `}
    >
      {children}
    </button>
  );
};

export default DuoButton;

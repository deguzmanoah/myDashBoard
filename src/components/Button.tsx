import React from 'react';
import Image from 'next/image';

export interface ButtonProps {
  label?: string;
  variant?: 'primary' | 'secondary';
  icon?: string;
  iconWidth?: number;
  iconHeight?: number;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  active?: boolean;
  roundedFull?: boolean;
  iconOnly?: boolean;
  form?: string;
}

export default function Button({
  label,
  variant = 'primary',
  icon,
  iconWidth = 20,
  iconHeight = 20,
  onClick,
  disabled = false,
  className = '',
  type = 'button',
  active = false,
  roundedFull = true,
  iconOnly = false,
  form,
}: ButtonProps) {
  const baseStyles = `text-sm flex items-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
    roundedFull ? 'rounded-full' : 'rounded-[10px]'
  }`;
  
  const variantStyles = {
    primary: active 
      ? 'bg-primary-800 border-primary-800 text-white hover:bg-primary-800'
      : 'bg-primary-700 border-primary-700 text-white hover:bg-primary-800',

    secondary: active 
      ? 'border border-[#CAC4D0] text-gray-900 bg-[#49454F1A] hover:bg-[#49454F1A]'
      : 'border border-[#CAC4D0] text-gray-900 hover:bg-[#49454F1A]',
  };

  const paddingStyles = iconOnly 
    ? 'py-1 px-2' 
    : (roundedFull ? 'py-3 px-4' : 'p-3');

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${paddingStyles} ${className}`;

  return (
    <button
      type={type}
      className={combinedClassName}
      onClick={onClick}
      disabled={disabled}
      form={form}
    >
      {icon && (
        <Image
          src={icon}
          alt={label || ''}
          width={iconWidth}
          height={iconHeight}
        />
      )}

      {label && <span>{label}</span>}
    </button>
  );
}

import React from 'react';

export interface ToggleProps {
  id?: string;
  name?: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'switch';
}

export default function Toggle({
  id,
  name,
  label,
  description,
  checked,
  onChange,
  disabled = false,
  error,
  size = 'md',
  variant = 'default'
}: ToggleProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      onChange(e.target.checked);
    }
  };

  const getSizeClasses = () => {
    if (variant === 'switch') {
      switch (size) {
        case 'sm':
          return {
            container: 'w-8 h-4',
            thumb: 'w-3 h-3',
            translate: 'translate-x-4'
          };
        case 'lg':
          return {
            container: 'w-12 h-6',
            thumb: 'w-5 h-5',
            translate: 'translate-x-6'
          };
        default:
          return {
            container: 'w-10 h-6',
            thumb: 'w-4 h-4',
            translate: 'translate-x-5'
          };
      }
    } else {
      switch (size) {
        case 'sm':
          return { checkbox: 'h-3 w-3' };
        case 'lg':
          return { checkbox: 'h-5 w-5' };
        default:
          return { checkbox: 'h-4 w-4' };
      }
    }
  };

  const sizeClasses = getSizeClasses();

  if (variant === 'switch') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">
              {label}
            </label>
            {description && (
              <p className="text-sm text-gray-500 mt-1">
                {description}
              </p>
            )}
          </div>
          
          <div className="relative">
            <input
              type="checkbox"
              id={id}
              name={name}
              checked={checked}
              onChange={handleChange}
              disabled={disabled}
              className="sr-only"
            />
            <label
              htmlFor={id}
              className={`
                relative inline-flex cursor-pointer items-center border
                ${sizeClasses.container}
                ${checked 
                  ? 'bg-[#14AE5C] border-[#009951]' 
                  : 'bg-white border-[#757575]'
                }
                ${disabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-opacity-80'
                }
                rounded-full transition-colors duration-200 ease-in-out
                ${error ? 'ring-2 ring-red-300' : 'focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2'}
              `}
            >
              <span
                className={`
                  ${sizeClasses.thumb}
                  ${checked ? `${sizeClasses.translate} bg-[#F5F5F5]` : 'bg-[#757575] translate-x-0.5'}
                  pointer-events-none inline-block transform rounded-full shadow-lg ring-0 transition duration-200 ease-in-out
                `}
              />
            </label>
          </div>
        </div>
        
        {error && (
          <p className="text-red-600 text-sm">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Default checkbox variant
  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          id={id}
          name={name}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className={`
            ${sizeClasses.checkbox}
            text-primary-600 focus:ring-primary-500 border-gray-300 rounded
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
            transition-colors duration-200
          `}
        />
        <div className="flex-1">
          <label 
            htmlFor={id} 
            className={`
              text-sm font-medium text-gray-700 
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {label}
          </label>
          {description && (
            <p className="text-sm text-gray-500 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      
      {error && (
        <p className="text-red-600 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}

import React from 'react';
import { clsx } from 'clsx';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  label: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  inline?: boolean;
  error?: string;
  className?: string;
  id?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  value,
  defaultValue,
  onChange,
  options,
  placeholder = "- Select -",
  required = false,
  disabled = false,
  inline = false,
  error,
  className = '',
  id
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange && !disabled) {
      onChange(e.target.value);
    }
  };

  const selectClasses = `
    w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer
    ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}
    ${error ? 'border-red-500' : ''}
    ${className}
  `.trim();

  const borderColor = error ? '#ef4444' : '#D9D9D9';

  const selectStyle = {
    borderColor,
    backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23666' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m1 6 7 7 7-7'/%3e%3c/svg%3e")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.75rem center',
    backgroundSize: '16px 12px',
    paddingRight: '2.5rem'
  };

  return (
    <div className={clsx("select-field", {
      'flex gap-2 items-center': inline,
    })}>
      {label && (
        <label 
          htmlFor={id || name} 
          className={clsx("block text-sm font-medium text-gray-700 whitespace-nowrap", {
            'mb-2': !inline,
          })}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={id || name}
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        disabled={disabled}
        className={selectClasses}
        style={selectStyle}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default SelectField;

import React from 'react';

export interface InputFieldProps {
  label: string;
  name?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'datetime-local';
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  id?: string;
  min?: string;
  maxLength?: number;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  defaultValue,
  onChange,
  placeholder,
  required = false,
  readOnly = false,
  disabled = false,
  error,
  className = '',
  id,
  min,
  maxLength
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange && !readOnly && !disabled) {
      onChange(e.target.value);
    }
  };

  const inputClasses = `
    w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
    ${readOnly || disabled 
      ? 'bg-gray-50 text-gray-500 cursor-not-allowed' 
      : 'bg-white'
    }
    ${error ? 'border-red-500' : ''}
    ${className}
  `.trim();

  const borderColor = error ? '#ef4444' : '#D9D9D9';

  return (
    <div className='input-field'>
      <label 
        htmlFor={id || name} 
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={id || name}
        name={name}
        type={type}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={disabled}
        min={min}
        className={inputClasses}
        style={{ borderColor }}
      />
      <div className="flex justify-between items-start mt-1">
        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <span />
        )}
        {maxLength !== undefined && (
          <p className={`text-xs ${(value?.length ?? 0) >= maxLength ? 'text-red-500' : 'text-gray-400'}`}>
            {value?.length ?? 0}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
};

export default InputField;

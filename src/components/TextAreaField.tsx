import React from 'react';

export interface TextAreaFieldProps {
  label: string;
  name?: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  error?: string;
  rows?: number;
  className?: string;
  id?: string;
}

const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  readOnly = false,
  disabled = false,
  error,
  rows = 3,
  className = '',
  id
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange && !readOnly && !disabled) {
      onChange(e.target.value);
    }
  };

  const textareaClasses = `
    w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical
    ${readOnly || disabled 
      ? 'bg-gray-50 text-gray-500 cursor-not-allowed' 
      : 'bg-white'
    }
    ${error ? 'border-red-500' : ''}
    ${className}
  `.trim();

  const borderColor = error ? '#ef4444' : '#D9D9D9';

  return (
    <div>
      <label 
        htmlFor={id || name} 
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        id={id || name}
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={disabled}
        rows={rows}
        className={textareaClasses}
        style={{ borderColor }}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default TextAreaField;

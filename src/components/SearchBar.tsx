import React, { ReactNode } from 'react';
import Image from 'next/image';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
  name?: string;
  asFormInput?: boolean;
  hasPageParam?: boolean;
  children?: ReactNode;
}

export default function SearchBar({ 
  placeholder = "Search for any keywords...", 
  value,
  defaultValue,
  onChange,
  className = "",
  name = "search",
  asFormInput = false,
  hasPageParam = true,
  children
}: SearchBarProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  if (asFormInput) {
    return (
      <form method="GET" className={`flex-1 ${className}`}>
        {/* Hidden inputs passed as children */}
        {children}

        {/* Reset to page 1 on search */}
        {hasPageParam && (
          <input type="hidden" name="page" value="1" />
        )}

        <div className="bg-white flex items-center border border-gray-300 rounded-full overflow-hidden py-3 px-4 text-sm gap-2">
          <input
            type="text"
            name={name}
            placeholder={placeholder}
            defaultValue={defaultValue}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            className='outline-none w-full'
          />
          <button type="submit" className="flex items-center">
            <Image
              src={'/icons/icon-search.svg'}
              alt={'Search'}
              width={16}
              height={16}
            />
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className={`bg-white flex items-center border border-gray-300 rounded-full overflow-hidden py-3 px-4 text-sm gap-2 ${className}`}>
      <input
        type="text"
        name={asFormInput ? name : undefined}
        placeholder={placeholder}
        value={asFormInput ? undefined : value}
        defaultValue={asFormInput ? defaultValue : undefined}
        onChange={asFormInput ? undefined : handleInputChange}
        className='outline-none w-full'
      />

      {asFormInput ? (
        <button type="submit" className="flex items-center">
          <Image
            src={'/icons/icon-search.svg'}
            alt={'Search'}
            width={16}
            height={16}
          />
        </button>
      ) : (
        <Image
          src={'/icons/icon-search.svg'}
          alt={'Search'}
          width={16}
          height={16}
        />
      )}
    </div>
  );
}

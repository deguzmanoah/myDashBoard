import React from 'react';
import Image from 'next/image';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  onBackClick?: () => void;
}

export default function PageHeader({ 
  title,
  description,
  children,
  onBackClick
}: PageHeaderProps) {
  return (
    <div className='flex flex-col gap-4'>
      {/* Page Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <div className='flex gap-4 items-center'>
              {onBackClick && (
                <button
                  className="bg-[#DAE0E5] hover:bg-[#CAD0D5] p-2 rounded-full"
                  onClick={onBackClick}
                >
                  <Image 
                    src="/icons/icon-arrow-left.svg" 
                    alt="Back" 
                    width={24} 
                    height={24} 
                  />
                </button>
              )}
              
              <h1 className="text-2xl font-bold">{title}</h1>
            </div>

            {description && (
              <p className="text-gray-600 mt-1">
                {description}
              </p>
            )}
          </div>

          {children && (
            <div className='flex gap-3'>
              {children}
            </div>
          )}
        </div>
      </div>

      <div className='h-px bg-[#CAC4D0]'></div>
    </div>
  );
}

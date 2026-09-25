import React from 'react';
import Image from 'next/image';

interface StatsCardProps {
  title: string;
  value: number;
  icon?: string;
  className?: string;
}

export default function StatsCard({ title, value, icon, className = '' }: StatsCardProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center gap-4">
        {icon && (
          <div>
            <Image 
              src={icon} 
              alt={title} 
              width={36}
              height={36}
              className="text-gray-600"
            />
          </div>
        )}
        <div>
          <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        </div>
      </div>
    </div>
  );
}

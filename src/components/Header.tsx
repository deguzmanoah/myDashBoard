"use client";

import React from 'react';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="hidden main-header bg-accent-400 shadow px-6 py-4 items-center justify-between">
      <div className='w-full max-w-[240px]'>
        <div className='bg-white flex items-center gap-2 border border-gray-300 rounded-full overflow-hidden py-2 px-3 text-sm'>
          <Image
            src={'/icons/icon-search.svg'}
            alt={'Search'}
            width={16}
            height={16}
          />

          <input
            type="text"
            placeholder="Start searching..."
            className='outline-none w-full'
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <a href="#">
          <Image
            src="/avatar.png"
            alt="Avatar"
            width={32}
            height={32}
          />
        </a>

        <a href="#">
          <Image
            src="/icons/icon-settings.svg"
            alt="settings"
            width={20}
            height={20}
          />
        </a>

        <a href="#">
          <Image
            src="/icons/icon-bell.svg"
            alt="notification"
            width={20}
            height={20}
          />
        </a>

        <a href="#">
          <Image
            src="/flag-us.png"
            alt="US Flag"
            width={20}
            height={20}
          />
        </a>
      </div>
    </header>
  );
}

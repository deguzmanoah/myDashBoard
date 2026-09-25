"use client";

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { useAuth } from '@/hooks/useAuth';
import { useMenuItems } from '@/hooks/useMenuItems';
import { type MenuItem } from '@/config/menuConfig';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

// Menu Item Component
const MenuItem: React.FC<{ item: MenuItem; collapsed: boolean }> = ({ item, collapsed }) => {
  const [showSubmenu, setShowSubmenu] = useState(false);
  const menuItemRef = useRef<HTMLLIElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (item.onClick) {
      e.preventDefault();
      item.onClick();
    }
    // Prevent navigation if item has submenus
    if (item.subItems && item.subItems.length > 0) {
      e.preventDefault();
    }
  };

  const hasSubItems = item.subItems && item.subItems.length > 0;

  const handleMouseEnter = () => {
    if (hasSubItems) {
      setShowSubmenu(true);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    if (hasSubItems && menuItemRef.current) {
      // Check if the mouse is leaving to a related target that's not within our menu item
      const relatedTarget = e.relatedTarget as Node;
      if (!relatedTarget || !menuItemRef.current.contains(relatedTarget)) {
        setShowSubmenu(false);
      }
    }
  };

  if (item.type === 'divider') {
    return <li className="my-2 border-b border-[#E2E8F0]" />;
  }

  return (
    <li
      ref={menuItemRef}
      className={clsx('relative', {
        'px-4': !collapsed,
      })}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {item.href && !hasSubItems ? (
        <Link
          href={item.href}
          className={clsx(
            'flex items-center gap-3 rounded-3xl relative transition-all min-h-[48px] no-width-transition',
            {
              'px-4 py-3 w-full': !collapsed,
              'ml-[9px]': collapsed,
              'w-[48px] justify-center': collapsed,
              'bg-accent-300 text-primary-900': item.isActive,
              'text-primary-700 hover:bg-accent-300 hover:text-primary-900': !item.isActive
            }
          )}
        >
          {item.icon && (
            <Image
              src={item.icon}
              alt={item.alt || item.label?.toLowerCase() || ''}
              width={20}
              height={20}
            />
          )}
          
          {!collapsed && (
            <>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </>
          )}
          
          {/* Show badge as dot when collapsed */}
          {collapsed && item.badge && (
            <span className="absolute -top-1 -right-1 bg-red-500 rounded-full h-3 w-3"></span>
          )}
        </Link>
      ) : (
        <button
          className={clsx(
            'flex items-center gap-3 rounded-3xl relative transition-all min-h-[48px] no-width-transition text-left',
            {
              'px-4 py-3 w-full': !collapsed,
              'ml-[9px] py-3 w-[48px] justify-center': collapsed,
              'bg-accent-300 text-primary-900': item.isActive,
              'text-primary-700 hover:bg-accent-300 hover:text-primary-900': !item.isActive
            }
          )}
          onClick={handleClick}
        >
          {item.icon && (
            <Image
              src={item.icon}
              alt={item.alt || item.label?.toLowerCase() || ''}
              width={20}
              height={20}
            />
          )}
          
          {!collapsed && (
            <>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
              {hasSubItems && (
                <Image
                  src="/icons/icon-chevron-right.svg"
                  alt="submenu"
                  width={16}
                  height={16}
                  className="ml-2"
                />
              )}
            </>
          )}
          
          {/* Show badge as dot when collapsed */}
          {collapsed && item.badge && (
            <span className="absolute -top-1 -right-1 bg-red-500 rounded-full h-3 w-3"></span>
          )}
        </button>
      )}

      {/* Submenu */}
      {hasSubItems && showSubmenu && (
        <div 
          className="absolute min-w-[216px] p-2"
          style={{
            left: '100%',
            top: '0',
            zIndex: 9999
          }}
        >
          <div className='bg-white border border-gray-200 rounded-lg shadow-xl'>
            {item.subItems!.map((subItem, subIndex) => (
              <Link
                key={subItem.id || `sub-${item.id}-${subIndex}`}
                href={subItem.href}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                {subItem.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </li>
  );
};

export default function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const { logout } = useAuth();

  // Get dynamic menu configuration with active state
  const menuItems = useMenuItems(logout);

  return (
    <aside className={`relative selection:bg-white text-primary-700 transition-all ${collapsed ? 'w-16' : 'w-64'} flex flex-col`}>
      <div className='h-[74px] w-full flex items-center justify-center'>
        {collapsed
          ? <Image
              src="/logo-mobile.png"
              alt="Charge Logo Mobile"
              width={42}
              height={42}
              priority
              className='mx-auto my-4'
              />

          : <div className='h-[74px] w-full flex items-center justify-center'>
              <Image
                src="/logo.png"
                alt="Charge Logo"
                width={196}
                height={74}
                priority
              />
            </div>
        }
      </div>

      <button
        className="w-6 h-6 absolute top-6 -right-3 border border-[#E2E8F0] rounded-full flex items-center justify-center bg-white hover:bg-gray-100 transition"
        onClick={onToggleCollapse}
      >
        {collapsed
          ? <Image
              src="/icons/icon-chevron-right.svg"
              alt="uncollapse"
              width={20}
              height={20}
            />
            
          : <Image
              src="/icons/icon-chevron-left.svg"
              alt="collapse"
              width={20}
              height={20}
            />
        }
      </button>

      <div className='overflow-visible'>
        <nav className={clsx("flex-1 mt-4 space-y-2", {
          'w-[256px]': !collapsed
        })}>
          <ul className={clsx('flex flex-col gap-2', {
            '': collapsed,
            '': !collapsed
          })}>
            {menuItems.map((item, index) => (
              <MenuItem key={item.id || `divider-${index}`} item={item} collapsed={collapsed} />
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}

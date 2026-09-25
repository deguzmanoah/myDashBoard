import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { getMenuItems, type MenuItem } from '@/config/menuConfig';

export const useMenuItems = (logout: () => void): MenuItem[] => {
  const pathname = usePathname();

  return useMemo(() => {
    return getMenuItems(logout).map(item => {
      // Check if any submenu item is active
      const hasActiveSubItem = item.subItems?.some(subItem => pathname === subItem.href) || false;
      
      // Determine if main item is active
      let isActive = false;
      if (item.href) {
        if (item.href === '/dashboard') {
          // Exact match for dashboard
          isActive = pathname === '/dashboard';
        } else {
          // Prefix match for other menu items
          isActive = pathname.startsWith(item.href);
        }
      }
      
      // Parent is active if it's directly active OR if any submenu item is active
      const finalIsActive = isActive || hasActiveSubItem;

      return {
        ...item,
        isActive: finalIsActive
      };
    });
  }, [logout, pathname]);
};

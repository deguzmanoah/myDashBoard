export interface SubMenuItem {
  id: string;
  label: string;
  href: string;
  alt?: string;
}

export interface MenuItem {
  id?: string;
  label?: string;
  icon?: string;
  href?: string;
  onClick?: () => void;
  alt?: string;
  type?: string;
  badge?: string | number; // For notifications or counts
  isActive?: boolean;
  permissions?: string[]; // For role-based access
  subItems?: SubMenuItem[]; // For dropdown submenus
}

export const getMenuItems = (logout: () => void): MenuItem[] => [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '/icons/icon-dashboard.svg',
    href: '/dashboard',
    alt: 'dashboard'
  },
  {
    id: 'branches',
    label: 'Branches',
    icon: '/icons/icon-pin-on-map.svg',
    href: '/dashboard/branches',
    alt: 'branches'
  },
  {
    id: 'pricing-tariff',
    label: 'Pricing & Tariff',
    icon: '/icons/icon-pricing-tariff.svg',
    href: '/dashboard/pricing-tariff',
    alt: 'pricing and tariff'
  },
  {
    id: 'charging-stations',
    label: 'Charging Stations',
    icon: '/icons/icon-charging-stations.svg',
    href: '/dashboard/charging-stations',
    alt: 'charging stations'
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: '/icons/icon-transactions.svg',
    alt: 'transactions',
    subItems: [
      {
        id: 'paid-charging',
        label: 'Paid Charging',
        href: '/dashboard/transactions/paid-charging',
        alt: 'paid charging'
      },
      {
        id: 'free-charging',
        label: 'Free Charging',
        href: '/dashboard/transactions/free-charging',
        alt: 'free charging'
      },
      {
        id: 'failed-charging',
        label: 'Failed Charging',
        href: '/dashboard/transactions/failed-charging',
        alt: 'failed charging'
      }
    ]
  },
  {
    id: 'user-activity',
    label: 'User Activity',
    icon: '/icons/icon-users-top-view.svg',
    href: '/dashboard/user-activity',
    alt: 'user activity'
  },
  {
    type: 'divider',
  },
  {
    id: 'app-cms',
    label: 'App CMS',
    icon: '/icons/icon-settings.svg',
    alt: 'app cms',
    subItems: [
      {
        id: 'homepage-banners',
        label: 'Homepage Banners',
        href: '/dashboard/app-cms/homepage-banners',
        alt: 'homepage banners'
      },
      {
        id: 'faqs',
        label: 'FAQs',
        href: '/dashboard/app-cms/faqs',
        alt: 'frequently asked questions'
      },
      {
        id: 'privacy-policies',
        label: 'Privacy Policies',
        href: '/dashboard/app-cms/privacy-policy',
        alt: 'privacy policies'
      },
      {
        id: 'terms-conditions',
        label: 'Terms and Conditions',
        href: '/dashboard/app-cms/terms-conditions',
        alt: 'terms and conditions'
      }
    ]
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: '/icons/icon-bell.svg',
    href: '/dashboard/notifications',
    alt: 'notifications'
  },
  {
    id: 'admin-management',
    label: 'Admin Management',
    icon: '/icons/icon-users-top-view.svg',
    href: '/dashboard/admin-management',
    alt: 'admin management'
  },
  {
    id: 'version-logs',
    label: 'Version Logs',
    icon: '/icons/icon-file.svg',
    href: '/dashboard/version-logs',
    alt: 'version logs'
  },
  {
    type: 'divider'
  },
  {
    id: 'logout',
    label: 'Logout',
    icon: '/icons/icon-exit.svg',
    onClick: logout,
    alt: 'logout'
  }
];

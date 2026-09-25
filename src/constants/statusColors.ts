export const statusColors = {
  'active': 'bg-green-100 text-green-800',
  'succeeded': 'bg-green-100 text-green-800',
  'pending': 'bg-yellow-100 text-yellow-800',
  'suspended': 'bg-orange-100 text-orange-800',
  'deactivated': 'bg-red-100 text-red-800',
  'inactive': 'bg-gray-100 text-gray-800',
  'expired': 'bg-gray-100 text-gray-800',
  'cancelled': 'bg-gray-100 text-gray-800',
  'maintenance': 'bg-yellow-100 text-yellow-800',
  'error': 'bg-red-100 text-red-800',
  'failed': 'bg-red-100 text-red-800',
} as const;

export type StatusColorKey = keyof typeof statusColors;

// Helper function to normalize status to title case
export const normalizeStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

// Helper function to get status color classes
export const getStatusColor = (status: string): string => {
  const lowercaseStatus = status.toLowerCase() as StatusColorKey;
  return statusColors[lowercaseStatus] || 'bg-gray-100 text-gray-800';
};

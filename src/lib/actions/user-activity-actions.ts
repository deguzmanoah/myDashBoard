'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { authenticatedRequest } from '@/lib/api';

const BASE_URL = '/customers';

// Interface for API response customer data
export interface ApiCustomer {
  user_id: number;
  customer_name: string;
  email: string;
  contact_number: string;
  registration_date?: string;
  terms_accepted: boolean | null;
  status: string;
  total_transactions: number;
  total_amount_spent: number;
  last_session_date?: string | null;
  vehicles: {
    vehicle_id?: number | string;
    make?: string;
    model?: string;
    plate_number?: string;
    year?: string;
    kwh?: string[];
    connector_type?: string[];
  }[];
}

const customerStatusSchema = z.object({
  user_id: z.coerce.number().min(1, 'Customer ID is required'),
  status: z.string().min(1, 'Status is required'),
});

export type CustomerStatusFormState = {
  errors?: {
    user_id?: string[];
    status?: string[];
    _form?: string[];
  };
  success?: boolean;
};

export async function updateCustomerStatus(
  prevState: CustomerStatusFormState,
  formData: FormData
): Promise<CustomerStatusFormState> {
  try {
    const validatedFields = customerStatusSchema.safeParse({
      user_id: formData.get('user_id'),
      status: formData.get('status'),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { user_id, status } = validatedFields.data;

    // Make authenticated API request with only status in payload
    const response = await authenticatedRequest(`${BASE_URL}/${user_id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });

    if (response.status === 401) {
      redirect('/login');
    }

    if (response.error) {
      return {
        errors: {
          _form: [response.error],
        },
      };
    }

    // Revalidate the user activity page
    revalidatePath('/dashboard/user-activity');

    return {
      success: true,
    };

  } catch (error) {
    console.error('Error updating customer status:', error);
    return {
      errors: {
        _form: ['An unexpected error occurred. Please try again.'],
      },
    };
  }
}

/**
 * Fetch a specific customer by ID
 */
export async function getCustomerById(id: string): Promise<{ 
  data?: ApiCustomer; 
  error?: string; 
}> {
  try {
    const response = await authenticatedRequest<ApiCustomer>(`${BASE_URL}/${id}`, {
      method: 'GET',
    });

    if (response.status === 401) {
      redirect('/login');
    }

    if (response.error) {
      return {
        error: response.error,
      };
    }

    return {
      data: response.data,
    };
  } catch (error) {
    console.error('Error fetching customer by ID:', error);
    return {
      error: 'An unexpected error occurred while fetching customer data.',
    };
  }
}

export async function getCustomers(params: {
  page: number;
  limit: number;
  status: string;
  search: string;
}) {
  try {
    const searchParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
      ...(params.status !== 'All' && { status: params.status }),
      ...(params.search && { search: params.search }),
    });

    // Make authenticated API request
    const response = await authenticatedRequest<{
      page: number;
      limit: number;
      total_customers: number;
      total_online_users: number;
      total_new_users: number;
      customers: ApiCustomer[];
    }>(`${BASE_URL}?${searchParams}`, {
      method: 'GET',
    });

    if (response.status === 401) {
      redirect('/login');
    }

    if (response.error) {
      throw new Error(response.error);
    }

    const data = response.data;
    const customerStatuses = ['All', 'Active', 'Inactive', 'Suspended'];

    // Transform API response to match expected interface if needed
    const transformedCustomers = data?.customers?.map((customer: ApiCustomer) => ({
      ...customer,
      id: customer?.user_id?.toString(),
    })) || [];

    return {
      customers: transformedCustomers,
      totalItems: data?.total_customers || 0,
      totalCustomers: data?.total_customers || 0,
      totalOnlineUsers: data?.total_online_users || 0,
      totalNewUsers: data?.total_new_users || 0,
      customerStatuses,
    };
  } catch (error) {
    console.error('Fetch customers error:', error);
    throw error;
  }
}

/**
 * Fetch active customers for forms or other components that need customer lists
 */
export async function getActiveCustomers(): Promise<{
  customers?: ApiCustomer[];
  error?: string;
}> {
  try {
    const response = await authenticatedRequest<{
      page: number;
      limit: number;
      total_customers: number;
      customers: ApiCustomer[];
    }>(`${BASE_URL}?limit=99&status=Active`, {
      method: 'GET',
    });

    if (response.status === 401) {
      redirect('/login');
    }

    if (response.error) {
      return {
        error: response.error,
      };
    }

    return {
      customers: response.data?.customers || [],
    };
  } catch (error) {
    console.error('Error fetching active customers:', error);
    return {
      error: 'An unexpected error occurred while fetching customer data.',
    };
  }
}

/**
 * Export user activity as CSV
 */
export async function exportUserActivityAsCSV(formData: FormData) {
  try {
    const status = formData.get('status') as string || 'All';
    const search = formData.get('search') as string || '';

    // Fetch all customers with high limit
    const result = await getCustomers({
      page: 1,
      limit: 9999,
      status,
      search,
    });

    // Convert customers data to CSV
    const headers = [
      'Customer Name',
      'Email',
      'Contact Number',
      'Registration Date',
      'Terms Accepted',
      'Status',
      'Total Transactions',
      'Total Amount Spent',
      'Last Session Date'
    ];

    const formatDate = (dateString: string | null | undefined) => {
      if (!dateString) return 'N/A';
      try {
        return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return 'Invalid Date';
      }
    };

    const formatCurrency = (amount: number | null | undefined) => {
      if (amount === null || amount === undefined) return 'N/A';
      return `₱${amount.toFixed(2)}`;
    };

    const csvRows = [
      headers.join(','), // Header row
      ...result.customers.map(customer => [
        `"${customer.customer_name || 'N/A'}"`,
        `"${customer.email || 'N/A'}"`,
        `"${customer.contact_number || 'N/A'}"`,
        `"${formatDate(customer.registration_date)}"`,
        `"${customer.terms_accepted ? 'Yes' : 'No'}"`,
        `"${customer.status || 'N/A'}"`,
        `"${customer.total_transactions || 0}"`,
        `"${formatCurrency(customer.total_amount_spent)}"`,
        `"${formatDate(customer.last_session_date)}"`
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `user-activity-export-${timestamp}.csv`;

    // Return the CSV content and filename
    return {
      success: true,
      csvContent,
      filename,
    };

  } catch (error) {
    console.error('Export user activity error:', error);
    return {
      success: false,
      error: 'Failed to export user activity. Please try again.',
    };
  }
}

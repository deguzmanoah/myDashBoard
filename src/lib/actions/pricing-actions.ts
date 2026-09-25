'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { authenticatedRequest } from '@/lib/api';

const BASE_URL = '/pricing';

// Interface for API response pricing data
export interface ApiPricing {
  pricing_id?: number;
  name: string;
  cost: number;
  rate: number;
  idle: number;
  admin_fee: number;
  status: string;
  created_by_admin_id?: number;
  updated_by_admin_id?: number;
  created_date?: string;
  updated_date?: string;
  admin_name?: string;
  admin_id?: string;
}

const pricingSchema = z.object({
  pricing_id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  cost: z.coerce.number().min(0, 'Cost must be a positive number'),
  rate: z.coerce.number().min(0, 'Rate must be a positive number'),
  idle: z.coerce.number().min(0, 'Idle fee must be a positive number'),
  admin_fee: z.coerce.number().min(0, 'Admin fee must be a positive number'),
  admin_id: z.string().optional(),
  status: z.string().optional(),
  created_by_admin_id: z.string().optional(),
  updated_by_admin_id: z.string().optional(),
});

export type PricingFormState = {
  errors?: {
    pricing_id?: string[];
    name?: string[];
    cost?: string[];
    rate?: string[];
    idle?: string[];
    admin_fee?: string[];
    status?: string[];
    _form?: string[];
  };
  success?: boolean;
};

export async function createPricing(
  prevState: PricingFormState,
  formData: FormData
): Promise<PricingFormState> {
  try {
    const validatedFields = pricingSchema.safeParse({
      name: formData.get('name'),
      cost: formData.get('cost'),
      rate: formData.get('rate'),
      idle: formData.get('idle'),
      admin_fee: formData.get('admin_fee'),
      status: formData.get('status'),
      admin_id: formData.get('admin_id'),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields?.error?.flatten()?.fieldErrors,
      };
    }

    const pricingData = validatedFields.data;

    // Make authenticated API request
    const response = await authenticatedRequest(`${BASE_URL}`, {
      method: 'POST',
      body: JSON.stringify(pricingData),
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

    // Revalidate the pricing tariff page
    revalidatePath('/dashboard/pricing-tariff');

    return {
      success: true,
    };

  } catch (error) {
    console.error('Error creating pricing:', error);
    return {
      errors: {
        _form: ['An unexpected error occurred. Please try again.'],
      },
    };
  }
}

export async function updatePricing(
  prevState: PricingFormState,
  formData: FormData
): Promise<PricingFormState> {
  try {
    const validatedFields = pricingSchema.safeParse({
      pricing_id: formData.get('pricing_id'),
      name: formData.get('name'),
      cost: formData.get('cost'),
      rate: formData.get('rate'),
      idle: formData.get('idle'),
      admin_fee: formData.get('admin_fee'),
      status: formData.get('status'),
      admin_id: formData.get('admin_id'),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const pricingData = validatedFields.data;
    
    // Make authenticated API request
    const response = await authenticatedRequest(`${BASE_URL}/${pricingData.pricing_id}`, {
      method: 'PUT',
      body: JSON.stringify(pricingData),
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

    // Revalidate the pricing tariff page
    revalidatePath('/dashboard/pricing-tariff');
    
    // Check if this is a status-only update (from component)
    const isStatusOnlyUpdate = formData.get('status') && !formData.get('_fromForm');
    
    if (isStatusOnlyUpdate) {
      // Return success state for component handling
      return {
        success: true,
      };
    }

    return {
      success: true,
    };

  } catch (error) {
    console.error('Error updating pricing:', error);
    return {
      errors: {
        _form: ['An unexpected error occurred. Please try again.'],
      },
    };
  }
}

/**
 * Fetch a specific pricing by ID
 */
export async function getPricingById(id: string): Promise<{ 
  data?: ApiPricing; 
  error?: string; 
}> {
  try {
    const response = await authenticatedRequest<ApiPricing>(`${BASE_URL}/${id}`, {
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
    console.error('Error fetching pricing by ID:', error);
    return {
      error: 'An unexpected error occurred while fetching pricing data.',
    };
  }
}

export async function getPricings(params: {
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
      items: ApiPricing[];
      total_items: number;
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
    const { pricingStatuses } = await import('@/data/mockPricings');

    // Transform API response to match expected interface if needed
    const transformedPricings = data?.items?.map((pricing: ApiPricing) => ({
      ...pricing,
      id: pricing?.pricing_id?.toString(),
    })) || [];

    return {
      pricings: transformedPricings,
      totalItems: data?.total_items || 0,
      pricingStatuses,
    };
  } catch (error) {
    console.error('Fetch pricings error:', error);
    throw error;
  }
}

/**
 * Fetch active pricings for forms (e.g., charging station creation)
 */
export async function getActivePricings(): Promise<{
  pricings?: ApiPricing[];
  error?: string;
}> {
  try {
    const response = await authenticatedRequest<{
      items: ApiPricing[];
      total_items: number;
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
      pricings: response.data?.items || [],
    };
  } catch (error) {
    console.error('Error fetching active pricings:', error);
    return {
      error: 'An unexpected error occurred while fetching pricing data.',
    };
  }
}

/**
 * Export pricing tariffs as CSV
 */
export async function exportPricingAsCSV(formData: FormData) {
  try {
    const status = formData.get('status') as string || 'All';
    const search = formData.get('search') as string || '';

    // Fetch all pricing tariffs with high limit
    const result = await getPricings({
      page: 1,
      limit: 9999,
      status,
      search,
    });

    // Convert pricing data to CSV
    const headers = [
      'Name',
      'Cost (₱/kWh)',
      'Rate (₱/hour)',
      'Idle Fee (₱/hour)',
      'Admin Fee (₱)',
      'Status',
      'Admin Name',
      'Created Date',
      'Updated Date'
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
      ...result.pricings.map(pricing => [
        `"${pricing.name || 'N/A'}"`,
        `"${formatCurrency(pricing.cost)}"`,
        `"${formatCurrency(pricing.rate)}"`,
        `"${formatCurrency(pricing.idle)}"`,
        `"${formatCurrency(pricing.admin_fee)}"`,
        `"${pricing.status || 'N/A'}"`,
        `"${pricing.admin_name || 'N/A'}"`,
        `"${formatDate(pricing.created_date)}"`,
        `"${formatDate(pricing.updated_date)}"`
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `pricing-tariff-export-${timestamp}.csv`;

    // Return the CSV content and filename
    return {
      success: true,
      csvContent,
      filename,
    };

  } catch (error) {
    console.error('Export pricing tariffs error:', error);
    return {
      success: false,
      error: 'Failed to export pricing tariffs. Please try again.',
    };
  }
}

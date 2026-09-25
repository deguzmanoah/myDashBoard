'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { authenticatedRequest } from '@/lib/api';

const BASE_URL = '/branches';

// Interface for API response branch data
export interface ApiBranch {
  branch_id?: number;
  station_name: string;
  charger_location: string;
  city: string;
  region: string;
  zip_code: string;
  address: string;
  latitude: string;
  longitude: string;
  status: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  description_json: any;
  created_by_admin_id?: number;
  updated_by_admin_id?: number;
  created_date?: string;
  updated_date?: string;
  admin_name?: string;
  admin_id?: string;
}

const branchSchema = z.object({
  branch_id: z.string().optional(),
  station_name: z.string().min(1, 'Station name is required'),
  charger_location: z.string().optional(), // base64 encoded image
  city: z.string().min(1, 'City is required'),
  region: z.string().min(1, 'Region is required'),
  zip_code: z.string().min(1, 'Zip code is required'),
  address: z.string().min(1, 'Address is required'),
  latitude: z.string().min(1, 'Latitude is required'),
  longitude: z.string().min(1, 'Longitude is required'),
  status: z.string().optional(),
  description: z.string().optional(),
  description_json: z.any().optional(),
  admin_id: z.string().optional(),
  created_by_admin_id: z.string().optional(),
  updated_by_admin_id: z.string().optional(),
});

export type BranchFormState = {
  errors?: {
    branch_id?: string[];
    station_name?: string[];
    charger_location?: string[];
    city?: string[];
    region?: string[];
    zip_code?: string[];
    address?: string[];
    latitude?: string[];
    longitude?: string[];
    status?: string[];
    description?: string[];
    description_json?: string[];
    _form?: string[];
  };
  success?: boolean;
};

export async function createBranch(
  prevState: BranchFormState,
  formData: FormData
): Promise<BranchFormState> {
  try {
    // Handle charger_location: either a file upload or existing URL
    const chargerLocationFile = formData.get('charger_location') as File;
    const chargerLocationUrl = formData.get('charger_location_url') as string;
    
    // Use file if present, otherwise use URL
    let chargerLocationValue = '';
    if (chargerLocationFile && chargerLocationFile.size > 0) {
      // Convert file to base64
      try {
        const arrayBuffer = await chargerLocationFile.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        chargerLocationValue = `data:${chargerLocationFile.type};base64,${base64}`;
      } catch (error) {
        console.error('Error converting file to base64:', error);
        return {
          errors: {
            _form: ['Failed to process the uploaded image. Please try again.'],
          },
        };
      }
    } else if (chargerLocationUrl) {
      chargerLocationValue = chargerLocationUrl;
    }

    const validatedFields = branchSchema.safeParse({
      station_name: formData.get('station_name'),
      charger_location: chargerLocationValue,
      city: formData.get('city'),
      region: formData.get('region'),
      zip_code: formData.get('zip_code'),
      address: formData.get('address'),
      latitude: formData.get('latitude'),
      longitude: formData.get('longitude'),
      status: formData.get('status'),
      description: formData.get('description'),
      description_json: formData.get('description_json'),
      admin_id: formData.get('admin_id'),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields?.error?.flatten()?.fieldErrors,
      };
    }

    const branchData = validatedFields.data;

    // Parse description_json back to object if it exists
    let parsedDescriptionJson;
    if (branchData.description_json) {
      try {
        parsedDescriptionJson = JSON.parse(branchData.description_json);
      } catch {
        return {
          errors: {
            _form: ['Invalid description format'],
          },
        };
      }
    }

    // Prepare payload with parsed description_json
    const branchPayload = JSON.stringify({
      ...branchData,
      description_json: parsedDescriptionJson,
    });

    // Make authenticated API request
    const response = await authenticatedRequest(`${BASE_URL}`, {
      method: 'POST',
      body: branchPayload,
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

    // Revalidate the branches page
    revalidatePath('/dashboard/branches');

    return {
      success: true,
    };

  } catch (error) {
    console.error('Error creating branch:', error);
    return {
      errors: {
        _form: ['An unexpected error occurred. Please try again.'],
      },
    };
  }
}

export async function updateBranch(
  prevState: BranchFormState,
  formData: FormData
): Promise<BranchFormState> {
  try {
    // Handle charger_location: either a file upload or existing URL
    const chargerLocationFile = formData.get('charger_location') as File;
    const chargerLocationUrl = formData.get('charger_location_url') as string;
    
    // Use file if present, otherwise use URL
    let chargerLocationValue = '';
    if (chargerLocationFile && chargerLocationFile.size > 0) {
      // Convert file to base64
      try {
        const arrayBuffer = await chargerLocationFile.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        chargerLocationValue = `data:${chargerLocationFile.type};base64,${base64}`;
      } catch (error) {
        console.error('Error converting file to base64:', error);
        return {
          errors: {
            _form: ['Failed to process the uploaded image. Please try again.'],
          },
        };
      }
    } else if (chargerLocationUrl) {
      chargerLocationValue = chargerLocationUrl;
    }

    const validatedFields = branchSchema.safeParse({
      branch_id: formData.get('branch_id'),
      station_name: formData.get('station_name'),
      charger_location: chargerLocationValue,
      city: formData.get('city'),
      region: formData.get('region'),
      zip_code: formData.get('zip_code'),
      address: formData.get('address'),
      latitude: formData.get('latitude'),
      longitude: formData.get('longitude'),
      status: formData.get('status'),
      description: formData.get('description'),
      description_json: formData.get('description_json'),
      admin_id: formData.get('admin_id'),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const branchData = validatedFields.data;
    
    // Parse description_json back to object if it exists
    let parsedDescriptionJson;
    if (branchData.description_json) {
      try {
        parsedDescriptionJson = JSON.parse(branchData.description_json);
      } catch {
        return {
          errors: {
            _form: ['Invalid description format'],
          },
        };
      }
    }

    // Prepare payload with parsed description_json
    const branchPayload = {
      ...branchData,
      description_json: parsedDescriptionJson,
    };
    
    const branchId = branchData.branch_id;
    
    // Make authenticated API request
    const response = await authenticatedRequest(`${BASE_URL}/${branchId}`, {
      method: 'PUT',
      body: JSON.stringify(branchPayload),
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

    // Revalidate the branches page
    revalidatePath('/dashboard/branches');
    
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
    console.error('Error updating branch:', error);
    return {
      errors: {
        _form: ['An unexpected error occurred. Please try again.'],
      },
    };
  }
}

/**
 * Fetch a specific branch by ID
 */
export async function getBranchById(id: string): Promise<{ 
  data?: ApiBranch; 
  error?: string; 
}> {
  try {
    const response = await authenticatedRequest<ApiBranch>(`${BASE_URL}/${id}`, {
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
    console.error('Error fetching branch by ID:', error);
    return {
      error: 'An unexpected error occurred while fetching branch data.',
    };
  }
}

export async function getBranches(params: {
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
      items: ApiBranch[];
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
    
    // Default branch statuses - this should be moved to a separate mock file later
    const branchStatuses = ['Active', 'Inactive'];

    // Transform API response to match expected interface if needed
    const transformedBranches = data?.items?.map((branch: ApiBranch) => ({
      ...branch,
      id: branch?.branch_id?.toString(),
    })) || [];

    return {
      branches: transformedBranches,
      totalItems: data?.total_items || 0,
      branchStatuses,
    };
  } catch (error) {
    console.error('Fetch branches error:', error);
    throw error;
  }
}

/**
 * Export branches as CSV
 */
export async function exportBranchesAsCSV(formData: FormData) {
  try {
    const status = formData.get('status') as string || 'All';
    const search = formData.get('search') as string || '';

    // Fetch all branches with high limit
    const result = await getBranches({
      page: 1,
      limit: 9999,
      status,
      search,
    });

    // Convert branches data to CSV
    const headers = [
      'Station Name',
      'Charger Location',
      'City',
      'Region',
      'Zip Code',
      'Address',
      'Latitude',
      'Longitude',
      'Status',
      'Description',
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

    const stripHtml = (html: string) => {
      return html?.replace(/<[^>]*>/g, '').trim() || 'N/A';
    };

    const csvRows = [
      headers.join(','), // Header row
      ...result.branches.map(branch => [
        `"${branch.station_name || 'N/A'}"`,
        `"${branch.charger_location || 'N/A'}"`,
        `"${branch.city || 'N/A'}"`,
        `"${branch.region || 'N/A'}"`,
        `"${branch.zip_code || 'N/A'}"`,
        `"${branch.address || 'N/A'}"`,
        `"${branch.latitude || 'N/A'}"`,
        `"${branch.longitude || 'N/A'}"`,
        `"${branch.status || 'N/A'}"`,
        `"${stripHtml(branch.description)}"`,
        `"${branch.admin_name || 'N/A'}"`,
        `"${formatDate(branch.created_date)}"`,
        `"${formatDate(branch.updated_date)}"`
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `branches-export-${timestamp}.csv`;

    // Return the CSV content and filename
    return {
      success: true,
      csvContent,
      filename,
    };

  } catch (error) {
    console.error('Export branches error:', error);
    return {
      success: false,
      error: 'Failed to export branches. Please try again.',
    };
  }
}

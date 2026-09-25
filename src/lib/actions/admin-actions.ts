'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { authenticatedRequest } from '@/lib/api';

const BASE_URL = '/admin/users'

// Interface for API response user data
export interface ApiUser {
  user_id?: number;
  first_name: string;
  last_name: string;
  role: string;
  email: string;
  organization: string;
  status: string;
  created_by_admin_id?: string;
  updated_by_admin_id?: string;
  invite_name?: null;
  invite_sent_at?: string;
  updated_at?: string;
  internal_notes?: string;
}

const adminSchema = z.object({
  user_id: z.string().optional(),
  role: z.string().min(1, 'Role is required'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  organization: z.string().min(1, 'Organization is required'),
  status: z.string().optional(),
  internal_notes: z.string().optional(),
  created_by_admin_id: z.string().optional(),
  updated_by_admin_id: z.string().optional(),
});

export type AdminFormState = {
  errors?: {
    user_id?: string[];
    role?: string[];
    first_name?: string[];
    last_name?: string[];
    email?: string[];
    organization?: string[];
    status?: string[];
    internal_notes?: string[];
    _form?: string[];
  };
  success?: boolean;
};

export async function createAdmin(
  prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  try {
    const validatedFields = adminSchema.safeParse({
      role: formData.get('role'),
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      email: formData.get('email'),
      organization: formData.get('organization'),
      status: formData.get('status'),
      internal_notes: formData.get('internal_notes'),
      created_by_admin_id: formData.get('created_by_admin_id'),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields?.error?.flatten()?.fieldErrors,
      };
    }

    const adminData = validatedFields.data;

    // Make authenticated API request
    const response = await authenticatedRequest(`${BASE_URL}/invite`, {
      method: 'POST',
      body: JSON.stringify(adminData),
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

    // Revalidate the admin management page
    revalidatePath('/dashboard/admin-management');

    return {
      success: true,
    };

  } catch (error) {
    console.error('Error creating admin:', error);
    return {
      errors: {
        _form: ['An unexpected error occurred. Please try again.'],
      },
    };
  }
}

export async function updateAdmin(
  prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  try {
    const validatedFields = adminSchema.safeParse({
      user_id: formData.get('user_id'),
      role: formData.get('role'),
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      email: formData.get('email'),
      organization: formData.get('organization'),
      status: formData.get('status'),
      internal_notes: formData.get('internal_notes'),
      updated_by_admin_id: formData.get('updated_by_admin_id'),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const adminData = validatedFields.data;
    // Make authenticated API request
    const response = await authenticatedRequest(`${BASE_URL}/${adminData.user_id}`, {
      method: 'PATCH',
      body: JSON.stringify(adminData),
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

    // Revalidate the admin management page
    revalidatePath('/dashboard/admin-management');

    return {
      success: true,
    };

  } catch (error) {
    console.error('Error updating admin:', error);
    return {
      errors: {
        _form: ['An unexpected error occurred. Please try again.'],
      },
    };
  }
}

export async function deactivateAdmin(
  prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {

  try {
    const adminData = {
      user_id: formData.get('user_id'),
      status: formData.get('status'),
      updated_by_admin_id: formData.get('updated_by_admin_id'),
    };

    // Make authenticated API request
    const response = await authenticatedRequest(`${BASE_URL}/${adminData.user_id}`, {
      method: 'PATCH',
      body: JSON.stringify(adminData),
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

    // Revalidate the admin management page
    revalidatePath('/dashboard/admin-management');
    
    return {
      success: true,
    };

  } catch (error) {
    console.error('Error deactivating admin:', error);
    return {
      errors: {
        _form: ['An unexpected error occurred. Please try again.'],
      },
    };
  }
}

export async function resendInvite(
  email: string,
  adminId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const inviteData = {
      email,
      admin_id: adminId,
    };

    // Make authenticated API request
    const response = await authenticatedRequest(`${BASE_URL}/resend-invite`, {
      method: 'POST',
      body: JSON.stringify(inviteData),
    });

    if (response.status === 401) {
      redirect('/login');
    }

    if (response.error) {
      return {
        error: response.error,
      };
    }

    // Revalidate the admin management page
    revalidatePath('/dashboard/admin-management');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error resending invite:', error);
    return {
      error: 'An unexpected error occurred while resending the invite.',
    };
  }
}

/**
 * Fetch a specific admin user by ID
 */
export async function getAdminById(id: string): Promise<{ 
  data?: ApiUser; 
  error?: string; 
}> {
  try {
    const response = await authenticatedRequest<ApiUser>(`${BASE_URL}/${id}`, {
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
    console.error('Error fetching admin by ID:', error);
    return {
      error: 'An unexpected error occurred while fetching admin data.',
    };
  }
}

export async function getAdmins(params: {
  page: number;
  limit: number;
  status: string;
  search: string;
}) {
  try {
    const searchParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
      ...(params.status !== 'all' && { status: params.status }),
      ...(params.search && { search: params.search }),
    });

    // Make authenticated API request
    const response = await authenticatedRequest<{
      users: ApiUser[];
      total_users: number;
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
    const { adminStatuses } = await import('@/data/mockAdmins');

    // Transform API response to match expected interface
    const transformedAdmins = data?.users?.map((user: ApiUser) => ({
      ...user,
      id: user?.user_id?.toString(),
      lastLogin: null
    })) || [];

    return {
      admins: transformedAdmins,
      totalItems: data?.total_users || 0,
      adminStatuses,
    };
  } catch (error) {
    console.error('Fetch admins error:', error);
    throw error;
  }
}

/**
 * Export admins as CSV
 */
export async function exportAdminsAsCSV(formData: FormData) {
  try {
    const status = formData.get('status') as string || 'All';
    const search = formData.get('search') as string || '';

    // Fetch all admins with high limit
    const result = await getAdmins({
      page: 1,
      limit: 9999,
      status,
      search,
    });

    // Convert admins data to CSV
    const headers = [
      'First Name',
      'Last Name',
      'Email',
      'Role',
      'Organization',
      'Status',
      'Invite Sent At',
      'Updated At',
      'Internal Notes'
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

    const csvRows = [
      headers.join(','), // Header row
      ...result.admins.map(admin => [
        `"${admin.first_name || 'N/A'}"`,
        `"${admin.last_name || 'N/A'}"`,
        `"${admin.email || 'N/A'}"`,
        `"${admin.role || 'N/A'}"`,
        `"${admin.organization || 'N/A'}"`,
        `"${admin.status || 'N/A'}"`,
        `"${formatDate(admin.invite_sent_at)}"`,
        `"${formatDate(admin.updated_at)}"`,
        `"${admin.internal_notes || 'N/A'}"`
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `admin-management-export-${timestamp}.csv`;

    // Return the CSV content and filename
    return {
      success: true,
      csvContent,
      filename,
    };

  } catch (error) {
    console.error('Export admins error:', error);
    return {
      success: false,
      error: 'Failed to export admins. Please try again.',
    };
  }
}

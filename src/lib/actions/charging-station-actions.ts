'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { authenticatedRequest } from '@/lib/api';

const BASE_URL = '/chargers';

// Date helper functions
export async function formatDateForInput(dateString: string | null | undefined): Promise<string> {
  if (!dateString) return '';
  // Handle both ISO format "2025-10-14T00:00:00" and simple date "2025-10-14"
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  // Return YYYY-MM-DD format for HTML date inputs
  return date.toISOString().split('T')[0];
}

// Connector helper functions
export async function validateConnectors(connectors: ApiConnector[]): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  if (!connectors || connectors.length === 0) {
    errors.push('At least one connector is required');
    return { isValid: false, errors };
  }

  connectors.forEach((connector, index) => {
    if (!connector.status || connector.status.trim() === '') {
      errors.push(`Connector ${index + 1}: Status is required`);
    }
  });

  return { isValid: errors.length === 0, errors };
}

// Interface for API response charging station data
export interface ApiConnector {
  connector_id: number | string;
  connector_code: string;
  charger_id: number;
  ocpp_connector_number?: string;
  status: string;
  qr_code?: string;
}

export interface ApiChargingStation {
  charger_id?: number;
  charger_code: string;
  charger_type: string;
  power_output: string;
  branch_id: number;
  pricing_id: number;
  brand: string;
  manufacturer_location: string;
  installation_date: string;
  warranty_expiration_date: string;
  firmware_version: string;
  serial_number: string;
  status: string;
  created_by_admin_id?: number;
  updated_by_admin_id?: number;
  created_date?: string;
  updated_date?: string;
  admin_name?: string;
  admin_id?: string;
  connectors: ApiConnector[];
}

// Connector schema for validation
const connectorSchema = z.object({
  connector_id: z.union([z.number(), z.string()]).optional(),
  connector_code: z.string().optional(),
  charger_id: z.number().optional(),
  ocpp_connector_number: z.union([z.number(), z.string()]).optional(),
  status: z.string().min(1, 'Connector status is required'),
  qr_code: z.string().optional(),
});

const chargingStationSchema = z.object({
  charger_id: z.string().optional(),
  charger_code: z.string().min(1, 'Charger code is required'),
  charger_type: z.string().min(1, 'Charger type is required'),
  power_output: z.string().min(1, 'Power output is required'),
  branch_id: z.string().min(1, 'Branch is required'),
  pricing_id: z.string().min(1, 'Pricing is required'),
  brand: z.string().min(1, 'Brand is required'),
  manufacturer_location: z.string().min(1, 'Manufacturer location is required'),
  installation_date: z.string().min(1, 'Installation date is required'),
  warranty_expiration_date: z.string().min(1, 'Warranty expiration date is required'),
  firmware_version: z.string().min(1, 'Firmware version is required'),
  serial_number: z.string().min(1, 'Serial number is required'),
  status: z.string().optional(),
  connectors: z.array(connectorSchema).optional(),
  admin_id: z.string().optional(),
  created_by_admin_id: z.string().optional(),
  updated_by_admin_id: z.string().optional(),
});

export type ChargingStationFormState = {
  errors?: {
    charger_id?: string[];
    charger_code?: string[];
    charger_type?: string[];
    power_output?: string[];
    branch_id?: string[];
    pricing_id?: string[];
    brand?: string[];
    manufacturer_location?: string[];
    installation_date?: string[];
    warranty_expiration_date?: string[];
    firmware_version?: string[];
    serial_number?: string[];
    status?: string[];
    connectors?: string[];
    _form?: string[];
  };
  success?: boolean;
};

export async function rebootChargingStation(charger_id: number | undefined) {
  try {
    if (!charger_id) return 'error';

    // Make authenticated API request
    const response = await authenticatedRequest(`/reset-charger`, {
      method: 'POST',
      body: JSON.stringify({
        charger_id,
        reset_type: 'Hard'
      }),
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

    // Revalidate the charging stations page
    revalidatePath('/dashboard/charging-stations');

    return {
      success: true,
    };

  } catch (error) {
    console.error('Error rebooting charging station:', error);
    return {
      errors: {
        _form: ['An unexpected error occurred. Please try again.'],
      },
    };
  }
}

export async function createChargingStation(
  prevState: ChargingStationFormState,
  formData: FormData
): Promise<ChargingStationFormState> {
  try {
    // Parse connectors data if provided
    let connectorsData = undefined;
    const connectorsJson = formData.get('connectors');
    if (connectorsJson && typeof connectorsJson === 'string') {
      try {
        connectorsData = JSON.parse(connectorsJson);
      } catch (parseError) {
        console.error('Error parsing connectors data:', parseError);
      }
    }

    const validatedFields = chargingStationSchema.safeParse({
      charger_code: formData.get('charger_code'),
      charger_type: formData.get('charger_type'),
      power_output: formData.get('power_output'),
      branch_id: formData.get('branch_id'),
      pricing_id: formData.get('pricing_id'),
      brand: formData.get('brand'),
      manufacturer_location: formData.get('manufacturer_location'),
      installation_date: formData.get('installation_date'),
      warranty_expiration_date: formData.get('warranty_expiration_date'),
      firmware_version: formData.get('firmware_version'),
      serial_number: formData.get('serial_number'),
      status: formData.get('status'),
      connectors: connectorsData,
      admin_id: formData.get('admin_id'),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields?.error?.flatten()?.fieldErrors,
      };
    }

    const chargingStationData = validatedFields.data;

    // Make authenticated API request
    const response = await authenticatedRequest(`${BASE_URL}`, {
      method: 'POST',
      body: JSON.stringify(chargingStationData),
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

    // Revalidate the charging stations page
    revalidatePath('/dashboard/charging-stations');

    return {
      success: true,
    };

  } catch (error) {
    console.error('Error creating charging station:', error);
    return {
      errors: {
        _form: ['An unexpected error occurred. Please try again.'],
      },
    };
  }
}

export async function updateChargingStation(
  prevState: ChargingStationFormState,
  formData: FormData
): Promise<ChargingStationFormState> {
  try {
    // Parse connectors data if provided
    let connectorsData = undefined;
    const connectorsJson = formData.get('connectors');
    if (connectorsJson && typeof connectorsJson === 'string') {
      try {
        connectorsData = JSON.parse(connectorsJson);
      } catch (parseError) {
        console.error('Error parsing connectors data:', parseError);
      }
    }

    const validatedFields = chargingStationSchema.safeParse({
      charger_id: formData.get('charger_id'),
      charger_code: formData.get('charger_code'),
      charger_type: formData.get('charger_type'),
      power_output: formData.get('power_output'),
      branch_id: formData.get('branch_id'),
      pricing_id: formData.get('pricing_id'),
      brand: formData.get('brand'),
      manufacturer_location: formData.get('manufacturer_location'),
      installation_date: formData.get('installation_date'),
      warranty_expiration_date: formData.get('warranty_expiration_date'),
      firmware_version: formData.get('firmware_version'),
      serial_number: formData.get('serial_number'),
      status: formData.get('status'),
      connectors: connectorsData,
      admin_id: formData.get('admin_id'),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const chargingStationData = validatedFields.data;
    
    // Make authenticated API request
    const response = await authenticatedRequest(`${BASE_URL}/${chargingStationData.charger_id}`, {
      method: 'PUT',
      body: JSON.stringify(chargingStationData),
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

    // Revalidate the charging stations page
    revalidatePath('/dashboard/charging-stations');
    
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
    console.error('Error updating charging station:', error);
    return {
      errors: {
        _form: ['An unexpected error occurred. Please try again.'],
      },
    };
  }
}

/**
 * Fetch a specific charging station by ID
 */
export async function getChargingStationById(id: string): Promise<{ 
  data?: ApiChargingStation; 
  error?: string; 
}> {
  try {
    const response = await authenticatedRequest<ApiChargingStation>(`${BASE_URL}/${id}`, {
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
    console.error('Error fetching charging station by ID:', error);
    return {
      error: 'An unexpected error occurred while fetching charging station data.',
    };
  }
}

export async function getChargingStations(params: {
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
      items: ApiChargingStation[];
      total_items: number;
      page: number;
      limit: number;
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
    const { chargingStationStatuses } = await import('@/data/mockChargingStations');

    // Transform API response to match expected interface if needed
    const transformedStations = data?.items?.map((station: ApiChargingStation) => ({
      ...station,
      id: station?.charger_id?.toString(),
    })) || [];

    return {
      chargingStations: transformedStations,
      totalItems: data?.total_items || 0,
      chargingStationStatuses,
    };
  } catch (error) {
    console.error('Fetch charging stations error:', error);
    throw error;
  }
}

/**
 * Update connector status for a specific charging station
 */
export async function updateConnectorStatus(
  chargerId: string,
  connectorId: string,
  status: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const response = await authenticatedRequest(`${BASE_URL}/${chargerId}/connectors/${connectorId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    if (response.status === 401) {
      redirect('/login');
    }

    if (response.error) {
      return {
        error: response.error,
      };
    }

    // Revalidate the charging stations page
    revalidatePath('/dashboard/charging-stations');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error updating connector status:', error);
    return {
      error: 'An unexpected error occurred while updating connector status.',
    };
  }
}

/**
 * Generate QR code for a specific connector
 */
export async function generateConnectorQR(
  chargerId: string,
  connectorId: string
): Promise<{ qrCode?: string; error?: string }> {
  try {
    const response = await authenticatedRequest<{ qr_code: string }>(`${BASE_URL}/${chargerId}/connectors/${connectorId}/qr-code`, {
      method: 'POST',
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
      qrCode: response.data?.qr_code,
    };
  } catch (error) {
    console.error('Error generating connector QR code:', error);
    return {
      error: 'An unexpected error occurred while generating QR code.',
    };
  }
}

/**
 * Export charging stations as CSV
 */
export async function exportChargingStationsAsCSV(formData: FormData) {
  try {
    const status = formData.get('status') as string || 'All';
    const search = formData.get('search') as string || '';

    // Fetch all charging stations with high limit
    const result = await getChargingStations({
      page: 1,
      limit: 9999,
      status,
      search,
    });

    // Convert charging stations data to CSV
    const headers = [
      'Charger Code',
      'Charger Type',
      'Power Output',
      'Brand',
      'Manufacturer Location',
      'Installation Date',
      'Warranty Expiration Date',
      'Firmware Version',
      'Serial Number',
      'Status',
      'Total Connectors',
      'Active Connectors',
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
          day: 'numeric'
        });
      } catch {
        return 'Invalid Date';
      }
    };

    const csvRows = [
      headers.join(','), // Header row
      ...result.chargingStations.map(station => [
        `"${station.charger_code || 'N/A'}"`,
        `"${station.charger_type || 'N/A'}"`,
        `"${station.power_output || 'N/A'}"`,
        `"${station.brand || 'N/A'}"`,
        `"${station.manufacturer_location || 'N/A'}"`,
        `"${formatDate(station.installation_date)}"`,
        `"${formatDate(station.warranty_expiration_date)}"`,
        `"${station.firmware_version || 'N/A'}"`,
        `"${station.serial_number || 'N/A'}"`,
        `"${station.status || 'N/A'}"`,
        `"${station.connectors?.length || 0}"`,
        `"${station.connectors?.filter(c => c.status === 'Active').length || 0}"`,
        `"${station.admin_name || 'N/A'}"`,
        `"${formatDate(station.created_date)}"`,
        `"${formatDate(station.updated_date)}"`
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `charging-stations-export-${timestamp}.csv`;

    // Return the CSV content and filename
    return {
      success: true,
      csvContent,
      filename,
    };

  } catch (error) {
    console.error('Export charging stations error:', error);
    return {
      success: false,
      error: 'Failed to export charging stations. Please try again.',
    };
  }
}

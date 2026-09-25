'use server';

import { redirect } from 'next/navigation';
import { authenticatedRequest } from '@/lib/api';

const BASE_URL = '/admin/transactions';

// Interface for API response transaction data
export interface ApiTransaction {
  payment_date?: string;
  branch?: string | null;
  serial_number?: string | null;
  charger_code?: string | null;
  connector_code?: string | null;
  customer_name?: string;
  payment_method?: string | null;
  transaction_amount?: number | null;
  refund_amount?: number | null;
  xendit_payment_id?: string | null;
  reference_id?: string | null;
  payment_status?: string | null;
  charge_start_date?: string | null;
  charge_end_date?: string | null;
  charge_duration?: string | null;
  total_kwh?: number | null;
  charge_status?: string | null;
  failure_code?: string | null;
}

export async function getTransactions(params: {
  page: number;
  limit: number;
  status: string;
  search: string;
  transactionType?: string; // Optional parameter to specify transaction type (e.g., 'paidCharging')
  startDateTime?: string;
  endDateTime?: string;
}) {
  try {
    const searchParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
      ...(params.status !== 'All' && { payment_status: params.status }),
      ...(params.search && { search: params.search }),
      ...(params.transactionType && { transaction_type: params.transactionType }),
      ...(params.startDateTime && { start_date_time: params.startDateTime }),
      ...(params.endDateTime && { end_date_time: params.endDateTime }),
    });

    // Make authenticated API request
    const response = await authenticatedRequest<{
      items: ApiTransaction[];
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
    
    // Define transaction statuses for filtering
    const transactionStatuses = ["All", "CANCELED", "SUCCEEDED", "FAILED", "EXPIRED", "PENDING" ] as const;

    return {
      transactions: data?.items || [],
      totalItems: data?.total_items || 0,
      transactionStatuses,
    };
  } catch (error) {
    console.error('Fetch transactions error:', error);
    throw error;
  }
}

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

/**
 * Export paid charging transactions as CSV
 */
export async function exportPaidChargingAsCSV(formData: FormData) {
  try {
    const search = formData.get('search') as string || '';
    const startDateTime = formData.get('start_date_time') as string || '';
    const endDateTime = formData.get('end_date_time') as string || '';

    const result = await getTransactions({
      page: 1,
      limit: 9999,
      status: 'SUCCEEDED',
      search,
      transactionType: 'paid_charging',
      startDateTime,
      endDateTime,
    });

    const headers = [
      'Payment Date',
      'Customer Name',
      'Branch',
      'Charger Code',
      'Connector Code',
      'Payment Method',
      'Transaction Amount',
      'Refund Amount',
      'Xendit Payment ID',
      'Reference',
      'Payment Status',
      'Charge Start Date',
      'Charge End Date',
      'Charge Duration',
      'Total kWh',
    ];

    const csvRows = [
      headers.join(','),
      ...result.transactions.map(t => [
        `"${formatDate(t.payment_date)}"`,
        `"${t.customer_name || 'N/A'}"`,
        `"${t.branch || 'N/A'}"`,
        `"${t.charger_code || 'N/A'}"`,
        `"${t.connector_code || 'N/A'}"`,
        `"${t.payment_method || 'N/A'}"`,
        `"${t.transaction_amount}"`,
        `"${t.refund_amount}"`,
        `"${t.xendit_payment_id || 'N/A'}"`,
        `"${t.reference_id || 'N/A'}"`,
        `"${t.payment_status || 'Unknown'}"`,
        `"${formatDate(t.charge_start_date)}"`,
        `"${formatDate(t.charge_end_date)}"`,
        `"${t.charge_duration || 'N/A'}"`,
        `"${t.total_kwh ? `${t.total_kwh}` : 'N/A'}"`,
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const timestamp = new Date().toISOString().split('T')[0];

    return { success: true, csvContent, filename: `paid-charging-export-${timestamp}.csv` };
  } catch (error) {
    console.error('Export paid charging error:', error);
    return { success: false, error: 'Failed to export transactions. Please try again.' };
  }
}

/**
 * Export free charging transactions as CSV
 */
export async function exportFreeChargingAsCSV(formData: FormData) {
  try {
    const search = formData.get('search') as string || '';
    const startDateTime = formData.get('start_date_time') as string || '';
    const endDateTime = formData.get('end_date_time') as string || '';

    const result = await getTransactions({
      page: 1,
      limit: 9999,
      status: '',
      search,
      transactionType: 'free_charging',
      startDateTime,
      endDateTime,
    });

    const headers = [
      'Customer Name',
      'Branch',
      'Charger Code',
      'Connector Code',
      'Charge Start Date',
      'Charge End Date',
      'Charge Duration',
      'Total kWh',
    ];

    const csvRows = [
      headers.join(','),
      ...result.transactions.map(t => [
        `"${t.customer_name || 'N/A'}"`,
        `"${t.branch || 'N/A'}"`,
        `"${t.charger_code || 'N/A'}"`,
        `"${t.connector_code || 'N/A'}"`,
        `"${formatDate(t.charge_start_date)}"`,
        `"${formatDate(t.charge_end_date)}"`,
        `"${t.charge_duration || 'N/A'}"`,
        `"${t.total_kwh ? `${t.total_kwh}` : 'N/A'}"`,
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const timestamp = new Date().toISOString().split('T')[0];

    return { success: true, csvContent, filename: `free-charging-export-${timestamp}.csv` };
  } catch (error) {
    console.error('Export free charging error:', error);
    return { success: false, error: 'Failed to export transactions. Please try again.' };
  }
}

/**
 * Export failed charging transactions as CSV
 */
export async function exportFailedChargingAsCSV(formData: FormData) {
  try {
    const search = formData.get('search') as string || '';
    const startDateTime = formData.get('start_date_time') as string || '';
    const endDateTime = formData.get('end_date_time') as string || '';

    const result = await getTransactions({
      page: 1,
      limit: 9999,
      status: '',
      search,
      transactionType: 'failed_charging',
      startDateTime,
      endDateTime,
    });

    const headers = [
      'Payment Date',
      'Customer Name',
      'Branch',
      'Charger Code',
      'Connector Code',
      'Payment Method',
      'Transaction Amount',
      'Refund Amount',
      'Xendit Payment ID',
      'Reference',
      'Payment Status',
      'Charge Start Date',
      'Charge End Date',
      'Charge Duration',
      'Total kWh',
    ];

    const csvRows = [
      headers.join(','),
      ...result.transactions.map(t => [
        `"${formatDate(t.payment_date)}"`,
        `"${t.customer_name || 'N/A'}"`,
        `"${t.branch || 'N/A'}"`,
        `"${t.charger_code || 'N/A'}"`,
        `"${t.connector_code || 'N/A'}"`,
        `"${t.payment_method || 'N/A'}"`,
        `"${t.transaction_amount}"`,
        `"${t.refund_amount}"`,
        `"${t.xendit_payment_id || 'N/A'}"`,
        `"${t.reference_id || 'N/A'}"`,
        `"${t.payment_status || 'Unknown'}"`,
        `"${formatDate(t.charge_start_date)}"`,
        `"${formatDate(t.charge_end_date)}"`,
        `"${t.charge_duration || 'N/A'}"`,
        `"${t.total_kwh ? `${t.total_kwh}` : 'N/A'}"`,
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const timestamp = new Date().toISOString().split('T')[0];

    return { success: true, csvContent, filename: `failed-charging-export-${timestamp}.csv` };
  } catch (error) {
    console.error('Export failed charging error:', error);
    return { success: false, error: 'Failed to export transactions. Please try again.' };
  }
}

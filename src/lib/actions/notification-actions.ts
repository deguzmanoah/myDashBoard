'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { authenticatedRequest } from '@/lib/api';

const BASE_URL = '/notifications';

// Interface for API response notification data
export interface ApiNotification {
  id?: number;
  title: string;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message_json: any;
  target_audience: string;
  category: string;
  type: string;
  priority: string;
  send_at?: string | null;
  status: string;
  created_by_admin_id?: number;
  updated_by_admin_id?: number;
  created_date?: string;
  updated_date?: string;
  admin_name?: string;
  admin_id?: string;
}

const notificationSchema = z.object({
  id: z.string().optional(),
  status: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required').refine((value) => {
    // Check if the message is just empty HTML tags or whitespace
    const strippedHTML = value.replace(/<[^>]*>/g, '').trim();
    return strippedHTML.length > 0;
  }, 'Message content is required'),
  message_json: z.string().min(1, 'Message JSON is required').refine((value) => {
    try {
      const parsed = JSON.parse(value);
      // Check if the parsed JSON represents empty content
      if (typeof parsed === 'object' && parsed !== null) {
        // For Lexical editor state, check if it has meaningful content
        if (parsed.root && parsed.root.children) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const hasContent = parsed.root.children.some((child: any) => {
            if (child.children && child.children.length > 0) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return child.children.some((textNode: any) => {
                return textNode.text && textNode.text.trim().length > 0;
              });
            }
            return false;
          });
          return hasContent;
        }
      }
      // If it's a string, check if it's not empty
      return typeof parsed === 'string' ? parsed.trim().length > 0 : true;
    } catch {
      return false;
    }
  }, 'Message content is required'),
  target_audience: z.string().min(1, 'Target audience is required'),
  category: z.enum(['email', 'in-app', 'both'], {
    message: 'Please select a valid category',
  }),
  type: z.enum(['Update', 'Reminder', 'Maintenance'], {
    message: 'Please select a valid notification type',
  }),
  priority: z.enum(['Low', 'Medium', 'High'], {
    message: 'Please select a valid priority level',
  }),
  send_at: z.string().nullable().optional(),
  send_now: z.boolean().optional(),
  admin_id: z.string().optional(),
  created_by_admin_id: z.string().optional(),
  updated_by_admin_id: z.string().optional(),
}).refine((data) => {
  // If send_now is false, send_at should be provided
  if (!data.send_now && (!data.send_at || data.send_at.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: 'Schedule date & time is required when not sending immediately',
  path: ['send_at'],
});

export type NotificationFormState = {
  errors?: {
    id?: string[];
    title?: string[];
    message?: string[];
    message_json?: string[];
    target_audience?: string[];
    category?: string[];
    type?: string[];
    priority?: string[];
    send_at?: string[];
    send_now?: string[];
    _form?: string[];
  };
  success?: boolean;
};

export async function createNotification(
  prevState: NotificationFormState,
  formData: FormData
): Promise<NotificationFormState> {
  try {
    const validatedFields = notificationSchema.safeParse({
      title: formData.get('title'),
      message: formData.get('message'),
      message_json: formData.get('message_json'),
      target_audience: formData.get('target_audience'),
      category: formData.get('category'),
      type: formData.get('type'),
      priority: formData.get('priority'),
      send_at: formData.get('send_at') || null,
      send_now: formData.get('send_now') === 'true',
      admin_id: formData.get('admin_id'),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields?.error?.flatten()?.fieldErrors,
      };
    }

    const notificationData = validatedFields.data;

    // Parse message_json back to object
    let parsedMessageJson;
    try {
      parsedMessageJson = JSON.parse(notificationData.message_json);
    } catch {
      return {
        errors: {
          _form: ['Invalid message format'],
        },
      };
    }

    // Fix double backslashes in the message field before JSON.stringify
    const fixedMessage = notificationData.message
      .replace(/\\\\"/g, '\\"')  // Fix double-escaped quotes: \\" becomes \"
      .replace(/\\\\'/g, "\\'")  // Fix double-escaped single quotes: \\' becomes \'
      .replace(/\\\\\\/g, '\\\\'); // Fix triple backslashes: \\\ becomes \\

    // Add default status for new notifications
    const notificationPayload = JSON.stringify({
      ...notificationData,
      message: fixedMessage, // Use the fixed message
      message_json: parsedMessageJson,
      status: 'Scheduled'
    });

    // Make authenticated API request
    const response = await authenticatedRequest(`${BASE_URL}`, {
      method: 'POST',
      body: notificationPayload,
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

    // Revalidate the notifications page
    revalidatePath('/dashboard/notifications');

    return {
      success: true,
    };

  } catch (error) {
    console.error('Error creating notification:', error);
    return {
      errors: {
        _form: ['An unexpected error occurred. Please try again.'],
      },
    };
  }
}

export async function updateNotification(
  prevState: NotificationFormState,
  formData: FormData
): Promise<NotificationFormState> {
  try {
    const validatedFields = notificationSchema.safeParse({
      id: formData.get('id'),
      title: formData.get('title'),
      message: formData.get('message'),
      message_json: formData.get('message_json'),
      target_audience: formData.get('target_audience'),
      category: formData.get('category'),
      type: formData.get('type'),
      priority: formData.get('priority'),
      send_at: formData.get('send_at') || null,
      send_now: formData.get('send_now') === 'true',
      admin_id: formData.get('admin_id'),
      status: formData.get('status'),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const notificationData = validatedFields.data;
    
    // Parse message_json back to object
    let parsedMessageJson;
    try {
      parsedMessageJson = JSON.parse(notificationData.message_json);
    } catch {
      return {
        errors: {
          _form: ['Invalid message format'],
        },
      };
    }

    // Use message as-is (it's already HTML content) but fix potential double-escaping
    const fixedMessage = notificationData.message
      .replace(/\\\\"/g, '\\"')  // Fix double-escaped quotes: \\" becomes \"
      .replace(/\\\\'/g, "\\'")  // Fix double-escaped single quotes: \\' becomes \'
      .replace(/\\\\\\/g, '\\\\'); // Fix triple backslashes: \\\ becomes \\

    // Prepare payload with parsed message_json
    const notificationPayload = {
      ...notificationData,
      message: fixedMessage, // Use the fixed message
      message_json: parsedMessageJson
    };
    
    // Make authenticated API request
    const response = await authenticatedRequest(`${BASE_URL}/${notificationData.id}`, {
      method: 'PUT',
      body: JSON.stringify(notificationPayload),
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

    // Revalidate the notifications page
    revalidatePath('/dashboard/notifications');
    
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
    console.error('Error updating notification:', error);
    return {
      errors: {
        _form: ['An unexpected error occurred. Please try again.'],
      },
    };
  }
}

interface GetNotificationsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export async function getNotifications(params: GetNotificationsParams = {}) {
  try {
    const { page = 1, limit = 10, status = 'All', search = '' } = params;
    
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status !== 'All' && { status }),
      ...(search && { search }),
    });

    // Make authenticated API request
    const response = await authenticatedRequest<{
      items: ApiNotification[];
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
    const { notificationStatuses } = await import('@/data/mockNotifications');

    // Transform API response to match expected interface if needed
    const transformedNotifications = data?.items?.map((notification: ApiNotification) => ({
      ...notification,
      id: notification?.id?.toString(),
    })) || [];

    return {
      notifications: transformedNotifications,
      totalItems: data?.total_items || 0,
      notificationStatuses: ['All', ...notificationStatuses] as const,
    };
  } catch (error) {
    console.error('Fetch notifications error:', error);
    throw error;
  }
}

export async function getNotificationById(id: string) {
  try {
    const response = await authenticatedRequest<ApiNotification>(`${BASE_URL}/${id}`, {
      method: 'GET',
    });

    if (response.status === 401) {
      redirect('/login');
    }

    if (response.error) {
      return {
        error: response.error,
        data: null,
      };
    }

    return {
      error: null,
      data: response.data,
    };
  } catch (error) {
    console.error('Error fetching notification by ID:', error);
    return {
      error: 'An unexpected error occurred while fetching notification data.',
      data: null,
    };
  }
}

/**
 * Export notifications as CSV
 */
export async function exportNotificationsAsCSV(formData: FormData) {
  try {
    const status = formData.get('status') as string || 'All';
    const search = formData.get('search') as string || '';

    // Fetch all notifications with high limit
    const result = await getNotifications({
      page: 1,
      limit: 9999,
      status,
      search,
    });

    // Convert notifications data to CSV
    const headers = [
      'Title',
      'Message',
      'Target Audience',
      'Category',
      'Type',
      'Priority',
      'Send At',
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

    const stripHtml = (html: string) => {
      return html?.replace(/<[^>]*>/g, '').trim() || 'N/A';
    };

    const csvRows = [
      headers.join(','), // Header row
      ...result.notifications.map(notification => [
        `"${notification.title || 'N/A'}"`,
        `"${stripHtml(notification.message)}"`,
        `"${notification.target_audience || 'N/A'}"`,
        `"${notification.category || 'N/A'}"`,
        `"${notification.type || 'N/A'}"`,
        `"${notification.priority || 'N/A'}"`,
        `"${formatDate(notification.send_at)}"`,
        `"${notification.status || 'N/A'}"`,
        `"${notification.admin_name || 'N/A'}"`,
        `"${formatDate(notification.created_date)}"`,
        `"${formatDate(notification.updated_date)}"`
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `notifications-export-${timestamp}.csv`;

    // Return the CSV content and filename
    return {
      success: true,
      csvContent,
      filename,
    };

  } catch (error) {
    console.error('Export notifications error:', error);
    return {
      success: false,
      error: 'Failed to export notifications. Please try again.',
    };
  }
}

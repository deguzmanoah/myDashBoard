'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { authenticatedRequest } from '@/lib/api';

const BASE_URL = '/version';

// ─── API types ───────────────────────────────────────────────────────────────

export interface ApiChangeItem {
  change_type: 'Feature' | 'Improve' | 'Fix';
  description: string;
}

export interface ApiVersionLog {
  id?: number;
  platform: 'Web' | 'Mobile';
  release_type: 'Major' | 'Minor' | 'Patch';
  version_number: string;
  release_date: string;
  changes: ApiChangeItem[];
  status: 'In Progress' | 'Published' | 'Deferred';
  created_by_admin_id?: number;
  updated_by_admin_id?: number;
  created_date?: string;
  updated_date?: string;
}

// ─── Zod schema ──────────────────────────────────────────────────────────────

const changeItemSchema = z.object({
  change_type: z.enum(['Feature', 'Improve', 'Fix']),
  description: z.string().min(1, 'Change description is required'),
});

const versionLogSchema = z.object({
  id: z.string().optional(),
  platform: z.enum(['Web', 'Mobile']),
  release_type: z.enum(['Major', 'Minor', 'Patch']),
  version_number: z.string().min(1, 'Version number is required'),
  release_date: z.string().min(1, 'Release date is required'),
  changes: z
    .array(changeItemSchema)
    .min(1, 'At least one change is required'),
  status: z.enum(['In Progress', 'Published', 'Deferred']),
});

// ─── Form state ──────────────────────────────────────────────────────────────

export type VersionLogFormState = {
  errors?: {
    platform?: string[];
    release_type?: string[];
    version_number?: string[];
    release_date?: string[];
    changes?: string[];
    status?: string[];
    _form?: string[];
  };
  success?: boolean;
};

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function getVersionLogs(
  platform?: 'Web' | 'Mobile'
): Promise<ApiVersionLog[]> {
  const params = new URLSearchParams();
  if (platform) params.set('platform', platform);
  const url = params.size ? `${BASE_URL}?${params.toString()}` : BASE_URL;

  const response = await authenticatedRequest<ApiVersionLog[]>(url);

  if (response.status === 401) {
    redirect('/login');
  }

  if (response.error || !response.data) {
    console.error('Failed to fetch version logs:', response.error);
    return [];
  }

  return response.data;
}

export async function getVersionLog(id: number | string): Promise<ApiVersionLog | null> {
  const response = await authenticatedRequest<ApiVersionLog>(`${BASE_URL}/${id}`);

  if (response.status === 401) {
    redirect('/login');
  }

  if (response.error || !response.data) {
    console.error('Failed to fetch version log:', response.error);
    return null;
  }

  return response.data;
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function createVersionLog(
  _prevState: VersionLogFormState,
  formData: FormData
): Promise<VersionLogFormState> {
  try {
    let changes: ApiChangeItem[] = [];
    try {
      changes = JSON.parse(formData.get('changes') as string);
    } catch {
      return { errors: { _form: ['Invalid changes format'] } };
    }

    const validatedFields = versionLogSchema.safeParse({
      platform: formData.get('platform'),
      release_type: formData.get('release_type'),
      version_number: formData.get('version_number'),
      release_date: formData.get('release_date'),
      changes,
      status: formData.get('status'),
    });

    if (!validatedFields.success) {
      return { errors: validatedFields.error.flatten().fieldErrors };
    }

    const response = await authenticatedRequest<ApiVersionLog>(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(validatedFields.data),
    });

    if (response.status === 401) {
      redirect('/login');
    }

    if (response.error) {
      return { errors: { _form: [response.error] } };
    }

    revalidatePath('/dashboard/version-logs');

    return { success: true };
  } catch (error) {
    console.error('Error creating version log:', error);
    return { errors: { _form: ['An unexpected error occurred. Please try again.'] } };
  }
}

// ─── PUT ──────────────────────────────────────────────────────────────────────

export async function updateVersionLog(
  _prevState: VersionLogFormState,
  formData: FormData
): Promise<VersionLogFormState> {
  try {
    const id = formData.get('id') as string;

    if (!id) {
      return { errors: { _form: ['Version log ID is required for updates'] } };
    }

    let changes: ApiChangeItem[] = [];
    try {
      changes = JSON.parse(formData.get('changes') as string);
    } catch {
      return { errors: { _form: ['Invalid changes format'] } };
    }

    const validatedFields = versionLogSchema.safeParse({
      id,
      platform: formData.get('platform'),
      release_type: formData.get('release_type'),
      version_number: formData.get('version_number'),
      release_date: formData.get('release_date'),
      changes,
      status: formData.get('status'),
    });

    if (!validatedFields.success) {
      return { errors: validatedFields.error.flatten().fieldErrors };
    }

    const response = await authenticatedRequest<ApiVersionLog>(
      `${BASE_URL}/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(validatedFields.data),
      }
    );

    if (response.status === 401) {
      redirect('/login');
    }

    if (response.error) {
      return { errors: { _form: [response.error] } };
    }

    revalidatePath('/dashboard/version-logs');

    return { success: true };
  } catch (error) {
    console.error('Error updating version log:', error);
    return { errors: { _form: ['An unexpected error occurred. Please try again.'] } };
  }
}

'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { authenticatedRootRequest, publicRequest } from '@/lib/api';

const BASE_URL = '/terms-conditions';

export interface TermsConditionsFormState {
  success: boolean;
  errors: Record<string, string[]>;
  data?: {
    id: string;
    title: string;
    body: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body_json: any;
    is_published: boolean;
    version?: string;
    admin_name?: string;
    created_by_admin_id?: number;
    updated_by_admin_id?: number;
    created_date?: string;
    updated_date?: string;
    published_date?: string;
  };
}

// Schema for terms and conditions validation - ID is no longer required
const termsConditionsSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  body: z.string().min(1, 'Content is required').refine((value) => {
    // Check if the body is just empty HTML tags or whitespace
    const strippedHTML = value.replace(/<[^>]*>/g, '').trim();
    return strippedHTML.length > 0;
  }, 'Body content is required'),
  body_json: z.string().min(1, 'Body JSON is required').refine((value) => {
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
  }, 'Body content is required'),
  is_published: z.boolean(),
  updated_by_admin_id: z.string().optional(),
});

export async function updateTermsConditions(
  prevState: TermsConditionsFormState,
  formData: FormData
): Promise<TermsConditionsFormState> {
  try {
    const rawData = {
      title: formData.get('title') as string,
      body: formData.get('body') as string,
      body_json: formData.get('body_json') as string,
      is_published: formData.get('is_published') === 'true',
      updated_by_admin_id: formData.get('updated_by_admin_id') as string,
    };

    const validatedData = termsConditionsSchema.parse(rawData);

    // Parse body_json back to object
    let parsedBodyJson;
    try {
      parsedBodyJson = JSON.parse(validatedData.body_json);
    } catch {
      return {
        success: false,
        errors: { general: ['Invalid body format'] }
      };
    }

    // Fix double backslashes in the body field before JSON.stringify
    const fixedBody = validatedData.body
      .replace(/\\\\"/g, '\\"')  // Fix double-escaped quotes: \\" becomes \"
      .replace(/\\\\'/g, "\\'")  // Fix double-escaped single quotes: \\' becomes \'
      .replace(/\\\\\\/g, '\\\\'); // Fix triple backslashes: \\\ becomes \\

    // Make authenticated API request to update terms and conditions
    const response = await authenticatedRootRequest(BASE_URL, {
      method: 'PUT',
      body: JSON.stringify({
        title: validatedData.title,
        body: fixedBody, // Use the fixed body
        body_json: parsedBodyJson,
        is_published: validatedData.is_published,
        updated_by_admin_id: validatedData.updated_by_admin_id,
      }),
    });

    if (response.status === 401) {
      redirect('/login');
    }

    if (response.error) {
      return {
        success: false,
        errors: { general: [response.error] }
      };
    }

    // Revalidate the terms and conditions page
    revalidatePath('/dashboard/app-cms/terms-conditions');
    
    return {
      success: true,
      errors: {},
      data: {
        ...(response.data || {}),
        body_json: parsedBodyJson
      } as {
        id: string;
        title: string;
        body: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body_json: any;
        is_published: boolean;
        version?: string;
        admin_name?: string;
        created_by_admin_id?: number;
        updated_by_admin_id?: number;
        created_date?: string;
        updated_date?: string;
        published_date?: string;
      }
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      
      for (const issue of error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(issue.message);
      }

      return {
        success: false,
        errors: fieldErrors
      };
    }

    console.error('Error updating terms and conditions:', error);
    return {
      success: false,
      errors: { general: ['An unexpected error occurred'] }
    };
  }
}

export async function getTermsConditions(usePublicAPI: boolean = false): Promise<{
  success: boolean;
  data?: {
    id: string;
    title: string;
    body: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body_json: any;
    is_published: boolean;
    version?: string;
    admin_name?: string;
    created_by_admin_id?: number;
    updated_by_admin_id?: number;
    created_date?: string;
    updated_date?: string;
    published_date?: string;
  };
  error?: string;
}> {
  try {
    // Use public or authenticated request based on the flag
    const response = usePublicAPI 
      ? await publicRequest(BASE_URL, { method: 'GET' })
      : await authenticatedRootRequest(BASE_URL, { method: 'GET' });

    if (response.status === 401 && !usePublicAPI) {
      redirect('/login');
    }

    if (response.error) {
      return { success: false, error: response.error };
    }

    const data = response.data as {
      id: string;
      title: string;
      body: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body_json: any;
      is_published: boolean;
      version?: string;
      admin_name?: string;
      created_by_admin_id?: number;
      updated_by_admin_id?: number;
      created_date?: string;
      updated_date?: string;
      published_date?: string;
    };

    // For public requests, only return published content
    if (usePublicAPI && !data.is_published) {
      return { success: false, error: 'Terms and conditions are not published' };
    }

    return {
      success: true,
      data
    };

  } catch (error) {
    console.error('Error fetching terms and conditions:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

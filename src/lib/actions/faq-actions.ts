'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { authenticatedRootRequest } from '@/lib/api';

const BASE_URL = '/faqs';

// Interface for API response FAQ data
export interface ApiFAQ {
  id?: number;
  question: string;
  answer: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  answer_json: any;
  category: string;
  status: string;
  order?: number;
  created_by_admin_id?: number;
  updated_by_admin_id?: number;
  created_date?: string;
  updated_date?: string;
  last_updated?: string;
  admin_name?: string;
  admin_id?: string;
}

const faqSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required').refine((value) => {
    // Check if the answer is just empty HTML tags or whitespace
    const strippedHTML = value.replace(/<[^>]*>/g, '').trim();
    return strippedHTML.length > 0;
  }, 'Answer content is required'),
  answer_json: z.string().min(1, 'Answer JSON is required').refine((value) => {
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
  }, 'Answer content is required'),
  category: z.string().min(1, 'Category is required'),
  order: z.string().min(1, 'Order is required').regex(/^\d+$/, 'Order must be a positive number'),
  admin_id: z.string().optional(),
  status: z.string().optional(),
  created_by_admin_id: z.string().optional(),
  updated_by_admin_id: z.string().optional(),
});

// Schema for status updates (less strict validation)
const faqStatusUpdateSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
  answer_json: z.string().min(1, 'Answer JSON is required'), // Just check it exists, not content
  category: z.string().min(1, 'Category is required'),
  order: z.string().min(1, 'Order is required').regex(/^\d+$/, 'Order must be a positive number'),
  admin_id: z.string().optional(),
  status: z.string().optional(),
  created_by_admin_id: z.string().optional(),
  updated_by_admin_id: z.string().optional(),
});

export type FAQFormState = {
  errors?: {
    id?: string[];
    question?: string[];
    answer?: string[];
    answer_json?: string[];
    category?: string[];
    status?: string[];
    order?: string[];
    _form?: string[];
  };
  success?: boolean;
};

export async function createFAQ(
  prevState: FAQFormState,
  formData: FormData
): Promise<FAQFormState> {
  try {
    const validatedFields = faqSchema.safeParse({
      question: formData.get('question'),
      answer: formData.get('answer'),
      answer_json: formData.get('answer_json'),
      category: formData.get('category'),
      order: formData.get('order'),
      status: formData.get('status'),
      created_by_admin_id: formData.get('admin_id'),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields?.error?.flatten()?.fieldErrors,
      };
    }

    const faqData = validatedFields.data;

    // Parse answer_json back to object
    let parsedAnswerJson;
    try {
      parsedAnswerJson = JSON.parse(faqData.answer_json);
    } catch {
      return {
        errors: {
          _form: ['Invalid answer format'],
        },
      };
    }

    // Fix double backslashes in the answer field before JSON.stringify
    const fixedAnswer = faqData.answer
      .replace(/\\\\"/g, '\\"')  // Fix double-escaped quotes: \\" becomes \"
      .replace(/\\\\'/g, "\\'")  // Fix double-escaped single quotes: \\' becomes \'
      .replace(/\\\\\\/g, '\\\\'); // Fix triple backslashes: \\\ becomes \\

    // Prepare payload with parsed answer_json
    const faqPayload = JSON.stringify({
      ...faqData,
      answer: fixedAnswer, // Use the fixed answer
      answer_json: parsedAnswerJson,
    });

    // Make authenticated API request
    const response = await authenticatedRootRequest(`${BASE_URL}`, {
      method: 'POST',
      body: faqPayload,
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

    // Revalidate the FAQ page
    revalidatePath('/dashboard/app-cms/faqs');

    return {
      success: true,
    };

  } catch (error) {
    console.error('Error creating FAQ:', error);
    return {
      errors: {
        _form: ['An unexpected error occurred. Please try again.'],
      },
    };
  }
}

export async function updateFAQ(
  prevState: FAQFormState,
  formData: FormData
): Promise<FAQFormState> {
  try {
    // Check if this is a status update (deactivation) by checking if status is present
    const status = formData.get('status');
    const isStatusUpdate = status === 'Inactive' || status === 'Active';
    
    // Use appropriate schema based on operation type
    const schema = isStatusUpdate ? faqStatusUpdateSchema : faqSchema;
    
    const validatedFields = schema.safeParse({
      id: formData.get('id'),
      question: formData.get('question'),
      answer: formData.get('answer'),
      answer_json: formData.get('answer_json'),
      category: formData.get('category'),
      order: formData.get('order'),
      status: formData.get('status'),
      updated_by_admin_id: formData.get('admin_id'),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const faqData = validatedFields.data;
    
    // Parse answer_json back to object
    let parsedAnswerJson;
    try {
      parsedAnswerJson = JSON.parse(faqData.answer_json);
    } catch {
      return {
        errors: {
          _form: ['Invalid answer format'],
        },
      };
    }

    // Use answer as-is (it's already HTML content) but fix potential double-escaping
    const fixedAnswer = faqData.answer
      .replace(/\\\\"/g, '\\"')  // Fix double-escaped quotes: \\" becomes \"
      .replace(/\\\\'/g, "\\'")  // Fix double-escaped single quotes: \\' becomes \'
      .replace(/\\\\\\/g, '\\\\'); // Fix triple backslashes: \\\ becomes \\

    // Prepare payload with parsed answer_json
    const faqPayload = {
      ...faqData,
      answer: fixedAnswer, // Use the fixed answer
      answer_json: parsedAnswerJson
    };
    
    const faqId = faqData.id || faqData.id;
    
    // Make authenticated API request
    const response = await authenticatedRootRequest(`${BASE_URL}/${faqId}`, {
      method: 'PUT',
      body: JSON.stringify(faqPayload),
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

    // Revalidate the FAQ page
    revalidatePath('/dashboard/app-cms/faqs');
    
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
    console.error('Error updating FAQ:', error);
    return {
      errors: {
        _form: ['An unexpected error occurred. Please try again.'],
      },
    };
  }
}

/**
 * Fetch a specific FAQ by ID
 */
export async function getFAQById(id: string): Promise<{ 
  data?: ApiFAQ; 
  error?: string; 
}> {
  try {
    const response = await authenticatedRootRequest<ApiFAQ>(`${BASE_URL}/${id}`, {
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
    console.error('Error fetching FAQ by ID:', error);
    return {
      error: 'An unexpected error occurred while fetching FAQ data.',
    };
  }
}

export async function getFAQs(params: {
  page: number;
  limit: number;
  status: string;
  search: string;
  category?: string;
}) {
  try {
    const searchParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
      ...(params.status !== 'All' && { status: params.status }),
      ...(params.search && { search: params.search }),
      ...(params.category && params.category !== 'All' && { category: params.category }),
    });

    // Make authenticated API request
    const response = await authenticatedRootRequest<{
      items: ApiFAQ[];
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

    // Import FAQ statuses and categories
    const { faqStatuses, faqCategories } = await import('@/data/mockFAQs');

    // Transform API response to match expected interface if needed
    const transformedFAQs = data?.items?.map((faq: ApiFAQ) => ({
      ...faq,
      id: faq?.id?.toString() || faq?.id?.toString(),
    })) || [];

    return {
      faqs: transformedFAQs,
      totalItems: data?.total_items || 0,
      faqStatuses,
      faqCategories,
    };
  } catch (error) {
    console.error('Fetch FAQs error:', error);
    throw error;
  }
}

/**
 * Duplicate an existing FAQ
 */
export async function duplicateFAQ(
  faqId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    // First, get the original FAQ
    const originalFAQ = await getFAQById(faqId);
    
    if (originalFAQ.error || !originalFAQ.data) {
      return {
        error: originalFAQ.error || 'Failed to fetch original FAQ',
      };
    }

    // Create a new FAQ based on the original
    const duplicatedFAQData = {
      question: `${originalFAQ.data.question} (Copy)`,
      answer: originalFAQ.data.answer,
      answer_json: originalFAQ.data.answer_json,
      category: originalFAQ.data.category,
      status: 'Inactive', // Set duplicated FAQ to inactive by default
    };

    const response = await authenticatedRootRequest(`${BASE_URL}`, {
      method: 'POST',
      body: JSON.stringify(duplicatedFAQData),
    });

    if (response.status === 401) {
      redirect('/login');
    }

    if (response.error) {
      return {
        error: response.error,
      };
    }

    // Revalidate the FAQ page
    revalidatePath('/dashboard/app-cms/faqs');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error duplicating FAQ:', error);
    return {
      error: 'An unexpected error occurred while duplicating FAQ.',
    };
  }
}

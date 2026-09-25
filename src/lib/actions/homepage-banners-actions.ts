'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { authenticatedRequest } from '@/lib/api';

const BASE_URL = '/banners';

// Interface for API response banner data
export interface ApiBanner {
  id: number;
  title: string;
  image: string;
  url: string;
  is_published: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

// Interface for pagination and response structure
export interface BannerResponse {
  page: number;
  limit: number;
  total_items: number;
  items: ApiBanner[];
}

// Interface for get banners parameters
interface GetBannersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string; // 'All', 'Published', 'Draft'
}

export async function getBanners(params: GetBannersParams = {}) {
  try {
    const { page = 1, limit = 6, status = 'All', search = '' } = params;
    
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status !== 'All' && { 
        is_published: status === 'Published' ? 'true' : 'false' 
      }),
      ...(search && { search }),
    });

    // Make authenticated API request
    const response = await authenticatedRequest<BannerResponse>(`${BASE_URL}?${searchParams}`, {
      method: 'GET',
    });

    if (response.status === 401) {
      redirect('/login');
    }

    if (response.error) {
      throw new Error(response.error);
    }

    const data = response.data;

    return {
      banners: data?.items || [],
      totalItems: data?.total_items || 0,
      currentPage: data?.page || page,
      totalPages: Math.ceil((data?.total_items || 0) / limit),
    };
  } catch (error) {
    console.error('Get banners error:', error);
    throw error;
  }
}

export async function getBannerById(id: number) {
  try {
    const response = await authenticatedRequest<ApiBanner>(`${BASE_URL}/${id}`, {
      method: 'GET',
    });

    if (response.status === 401) {
      redirect('/login');
    }

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data;
  } catch (error) {
    console.error('Get banner by ID error:', error);
    throw error;
  }
}

export async function updateBannerStatus(id: number, is_published: boolean) {
  try {
    const response = await authenticatedRequest(`${BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ is_published }),
    });

    if (response.status === 401) {
      redirect('/login');
    }

    if (response.error) {
      throw new Error(response.error);
    }

    // Revalidate the banners page
    revalidatePath('/dashboard/app-cms/homepage-banners');
    
    return response.data;
  } catch (error) {
    console.error('Update banner status error:', error);
    throw error;
  }
}

export async function deleteBanner(id: number) {
  try {
    const response = await authenticatedRequest(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });

    if (response.status === 401) {
      redirect('/login');
    }

    if (response.error) {
      throw new Error(response.error);
    }

    // Revalidate the banners page
    revalidatePath('/dashboard/app-cms/homepage-banners');
    
    return response.data;
  } catch (error) {
    console.error('Delete banner error:', error);
    throw error;
  }
}

// Form validation schema
const bannerSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  url: z.string().optional(),
  is_published: z.boolean().optional(),
  order: z.number().min(1, 'Order must be at least 1'),
});

export type BannerFormState = {
  errors?: {
    id?: string[];
    title?: string[];
    image?: string[];
    url?: string[];
    is_published?: string[];
    order?: string[];
    general?: string[];
  };
  message?: string;
};

export async function createBanner(prevState: BannerFormState, formData: FormData): Promise<BannerFormState> {
  try {
    // Extract data - image_base64 is already converted in the form
    const image_base64 = formData.get('image_base64') as string;
    const title = formData.get('title') as string;
    const url = formData.get('url') as string;
    const is_published = formData.get('is_published') === 'true';
    const order = parseInt(formData.get('order') as string);

    // Validate basic fields
    const validatedFields = bannerSchema.safeParse({
      title,
      url,
      is_published,
      order,
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing or invalid fields.',
      };
    }

    // Check if image base64 is provided
    if (!image_base64) {
      return {
        errors: { image: ['Banner image is required'] },
        message: 'Missing banner image.',
      };
    }

    const response = await authenticatedRequest(`${BASE_URL}`, {
      method: 'POST',
      body: JSON.stringify({
        title,
        image: image_base64,
        url,
        is_published,
        order,
      }),
    });

    if (response.status === 401) {
      redirect('/login');
    }

    if (response.error) {
      return {
        errors: { general: [response.error] },
        message: 'Failed to create banner.',
      };
    }

    revalidatePath('/dashboard/app-cms/homepage-banners');
    redirect('/dashboard/app-cms/homepage-banners');
  } catch (error) {
    // Don't log NEXT_REDIRECT errors as they are expected behavior
    if (error instanceof Error && error.message !== 'NEXT_REDIRECT') {
      console.error('Create banner error:', error);
    }
    
    // If it's a redirect error, re-throw it so Next.js can handle it properly
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    
    return {
      errors: { general: ['An unexpected error occurred. Please try again.'] },
      message: 'Failed to create banner.',
    };
  }
}

export async function updateBanner(
  prevState: BannerFormState,
  formData: FormData
): Promise<BannerFormState> {
  try {
    const id = formData.get('id') as string;
    
    if (!id) {
      return {
        errors: { general: ['Banner ID is required for updates.'] },
        message: 'Invalid banner data.',
      };
    }

    // Extract data - image_base64 is already converted in the form if provided
    const image_base64 = formData.get('image_base64') as string;
    const image_url = formData.get('image_url') as string;
    const title = formData.get('title') as string;
    const url = formData.get('url') as string;
    const is_published = formData.get('is_published') === 'true';
    const order = parseInt(formData.get('order') as string);

    // Validate basic fields
    const validatedFields = bannerSchema.safeParse({
      id,
      title,
      url,
      is_published,
      order,
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing or invalid fields.',
      };
    }

    // Prepare payload
    const payload: {
      title: string;
      url: string;
      is_published: boolean;
      order: number;
      image?: string;
    } = {
      title,
      url,
      is_published,
      order,
    };

    // Handle image - either use new base64 or keep existing URL
    if (image_base64) {
      // Use new base64 image
      payload.image = image_base64;

    } else if (image_url && typeof image_url === 'string' && image_url.trim() !== '') {
      // Keep existing image URL only if it's a valid string
      payload.image = image_url;
    }

    const response = await authenticatedRequest(`${BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    if (response.status === 401) {
      redirect('/login');
    }

    if (response.error) {
      return {
        errors: { general: [response.error] },
        message: 'Failed to update banner.',
      };
    }

    revalidatePath('/dashboard/app-cms/homepage-banners');
    redirect('/dashboard/app-cms/homepage-banners');
  } catch (error) {
    // Don't log NEXT_REDIRECT errors as they are expected behavior
    if (error instanceof Error && error.message !== 'NEXT_REDIRECT') {
      console.error('Update banner error:', error);
    }
    
    // If it's a redirect error, re-throw it so Next.js can handle it properly
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    
    return {
      errors: { general: ['An unexpected error occurred. Please try again.'] },
      message: 'Failed to update banner.',
    };
  }
}

'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { z } from 'zod';

const setPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/\W/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  type: z.enum(['set', 'reset']).optional().default('set'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type SetPasswordFormState = {
  errors?: {
    token?: string[];
    password?: string[];
    confirmPassword?: string[];
    type?: string[];
    _form?: string[];
  };
  success?: boolean;
};

export async function setPassword(
  prevState: SetPasswordFormState,
  formData: FormData
): Promise<SetPasswordFormState> {
  try {
    const validatedFields = setPasswordSchema.safeParse({
      token: formData.get('token'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
      type: formData.get('type'),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { token, password, type } = validatedFields.data;
    
    // Use different endpoints based on type
    const endpoint = type === 'reset' ? '/auth/set-password' : '/auth/accept-invite';
    
    const response = await fetch(`${process.env.THIRD_PARTY_API_WEB_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        errors: {
          _form: [errorData.message || 'Failed to set password'],
        },
      };
    }

    return {
      success: true,
    };

  } catch (error) {
    console.error('Error setting password:', error);
    return {
      errors: {
        _form: ['An unexpected error occurred. Please try again.'],
      },
    };
  }
}

// Additional auth-related server actions can be added here
// e.g., login, logout, password reset request, etc.

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export type ResetPasswordFormState = {
  errors?: {
    email?: string[];
    _form?: string[];
  };
  success?: boolean;
};

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormState = {
  errors?: {
    email?: string[];
    password?: string[];
    _form?: string[];
  };
  success?: boolean;
};

export async function login(
  prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  try {
    const validatedFields = loginSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { email, password } = validatedFields.data;

    // Bypass authentication for development environment only
    const isDevBypassEnabled = process.env.NODE_ENV === 'development' && 
                               process.env.ENABLE_DEV_LOGIN_BYPASS === 'true';
    
    if (isDevBypassEnabled && email === 'nikodeguzman@gmail.com') {
      const cookieStore = await cookies();
      const expirationDate = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours
      
      // Set a dummy token
      cookieStore.set('authToken', 'dev-token', {
        httpOnly: true,
        secure: false, // Always false in development
        sameSite: 'strict',
        expires: expirationDate,
        path: '/',
      });

      // Store user info
      cookieStore.set('userData', JSON.stringify({
        id: 'dev-user-1',
        name: 'Niko De Guzman',
        email: 'nikodeguzman@gmail.com',
        role: 'admin',
      }), {
        secure: false, // Always false in development
        sameSite: 'strict',
        expires: expirationDate,
        path: '/',
      });

      // Redirect on successful login
      redirect('/dashboard');
    }

    // Only make API request for other emails
    const response = await fetch(`${process.env.THIRD_PARTY_API_WEB_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        errors: {
          _form: [errorData.detail || 'Invalid credentials'],
        },
      };
    }

    const userData = await response.json();
    
    // Extract token and expiration from API response
    const { id, name, email: userEmail, role, token, expires_in } = userData;
    
    if (!token) {
      return {
        errors: {
          _form: ['Invalid response from server'],
        },
      };
    }

    // Store the token in httpOnly cookie for security
    const cookieStore = await cookies();
    const expirationDate = new Date(Date.now() + (expires_in * 1000)); // expiresIn is in seconds
    
    cookieStore.set('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: expirationDate,
      path: '/',
    });

    // Store user info in a separate cookie (not httpOnly so client can read it)
    cookieStore.set('userData', JSON.stringify({
      id,
      name,
      email: userEmail,
      role,
    }), {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: expirationDate,
      path: '/',
    });

  } catch (error) {
    console.error('Error during login:', error);
    return {
      errors: {
        _form: ['An unexpected error occurred. Please try again.'],
      },
    };
  }

  // Redirect on successful login
  redirect('/dashboard');
}

export async function resetPassword(
  prevState: ResetPasswordFormState,
  formData: FormData
): Promise<ResetPasswordFormState> {
  try {
    const validatedFields = resetPasswordSchema.safeParse({
      email: formData.get('email'),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { email } = validatedFields.data;

    const response = await fetch(`${process.env.THIRD_PARTY_API_WEB_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        errors: {
          _form: [errorData.detail || 'Failed to send reset password email'],
        },
      };
    }

    return {
      success: true,
    };

  } catch (error) {
    console.error('Error during password reset request:', error);
    return {
      errors: {
        _form: ['An unexpected error occurred. Please try again.'],
      },
    };
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  
  // Clear auth cookies
  cookieStore.delete('authToken');
  cookieStore.delete('userData');
  
  // Redirect to login page
  redirect('/login');
}

// Helper function to get auth token for API requests
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('authToken');
  return token?.value || null;
}

// Helper function to get user data
export async function getUserData(): Promise<UserData | null> {
  const cookieStore = await cookies();
  const userData = cookieStore.get('userData');
  
  if (!userData?.value) {
    return null;
  }
  
  try {
    return JSON.parse(userData.value);
  } catch {
    return null;
  }
}

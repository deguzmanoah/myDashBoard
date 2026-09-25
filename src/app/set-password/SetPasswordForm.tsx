'use client';

import React, { useState, useEffect, useActionState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import clsx from 'clsx';
import {
  setPassword as setPasswordAction,
  type SetPasswordFormState
} from '@/lib/actions/auth-actions';

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="btn-primary"
    >
      {pending ? 'Setting Password...' : 'Set Password'}
    </button>
  );
}

export default function SetPasswordForm() {
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clientErrors, setClientErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get the token and type from URL parameters
  const token = searchParams.get('token');
  const type = searchParams.get('type') || 'set'; // default to 'set' if not provided
  
  // Determine if this is a reset password flow
  const isResetPassword = type === 'reset';

  // Form state for server action
  const initialState: SetPasswordFormState = {};
  const [formState, formAction] = useActionState(setPasswordAction, initialState);

  // Client-side password validation
  const validatePassword = (password: string) => {
    const requirements = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChar: /\W/.test(password),
    };

    if (!requirements.minLength) return 'Password must be at least 8 characters long';
    if (!requirements.hasUpperCase) return 'Password must contain at least one uppercase letter';
    if (!requirements.hasLowerCase) return 'Password must contain at least one lowercase letter';
    if (!requirements.hasNumbers) return 'Password must contain at least one number';
    if (!requirements.hasSpecialChar) return 'Password must contain at least one special character';
    
    return null;
  };

  // Handle password change with real-time validation
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    
    const error = validatePassword(value);
    setClientErrors(prev => ({
      ...prev,
      password: error || undefined,
    }));
  };

  // Handle confirm password change with real-time validation
  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    
    const error = value && password && value !== password ? 'Passwords do not match' : undefined;
    setClientErrors(prev => ({
      ...prev,
      confirmPassword: error,
    }));
  };

  // Get password strength requirements status
  const getPasswordRequirements = () => {
    return {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChar: /\W/.test(password),
    };
  };

  const requirements = getPasswordRequirements();

  useEffect(() => {
    // If no token is present, redirect to login
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  // Handle successful password set
  useEffect(() => {
    if (formState.success) {
      setSuccess(true);
      // Redirect to login after showing success message
      const timer = setTimeout(() => {
        const message = isResetPassword ? 'password-reset' : 'password-set';
        router.push(`/login?message=${message}`);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [formState.success, router, isResetPassword]);

  if (success) {
    return (
      <div className="flex min-h-screen">
        {/* Left column: Success message */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 pt-16 bg-accent-50 max-w-[630px]">
          <div className="w-full max-w-[393px] text-center">
            <div>
              <Image
                src="/logo.png"
                alt="Charge Logo"
                width={339}
                height={127}
                priority
                className='-ml-[34px]'
              />
            </div>

            <h1 className="font-bold text-5xl mb-6 text-primary-800">
              Success!
            </h1>

            <p className='text-primary-700 font-medium mb-8'>
              Your password has been {isResetPassword ? 'reset' : 'set'} successfully. You will be redirected to the login page shortly.
            </p>

            <div className="w-12 h-12 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <div className='mt-auto text-primary-800'>
            Charge Ver 1.001
          </div>
        </div>

        {/* Right column: Background image */}
        <div className="flex-1 bg-accent-200 px-24 flex flex-col justify-center">
          <div className='max-w-[619px]'>
            <div>
              <h1 className="text-primary-900 text-[80px] mb-4 leading-[70px] font-normal">
                <strong>Password</strong> {isResetPassword ? 'Reset' : 'Set'} Successfully
              </h1>

              <p className="text-primary-600 font-medium">
                You can now login with your new password
              </p>
            </div>

            <div>
              <Image
                src="/ev-car-charging.svg"
                alt="Graphics"
                width={776}
                height={776}
                priority
                className='w-full'
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left column: Set password form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 pt-16 bg-accent-50 max-w-[630px]">
        <form
          action={formAction}
          className={clsx("w-full max-w-[393px]", {
            'has-error': formState.errors
          })}
        >
          <div>
            <Image
              src="/logo.png"
              alt="Charge Logo"
              width={339}
              height={127}
              priority
              className='-ml-[34px]'
            />
          </div>

          <h1 className="font-bold text-5xl mb-6 text-primary-800">
            {isResetPassword ? 'Reset Password' : 'Set Password'}
          </h1>

          <p className='text-primary-700 font-medium mb-8'>
            {isResetPassword 
              ? 'Create a new secure password for your account' 
              : 'Create a secure password for your account'
            }
          </p>

          {/* Hidden token field */}
          <input
            type="hidden"
            name="token"
            value={token || ''}
          />

          {/* Hidden type field */}
          <input
            type="hidden"
            name="type"
            value={type}
          />

          <div>
            <label htmlFor="password" className="form-label">
              New Password
            </label>

            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              required
              className={clsx("form-input", {
                'border-red-500': clientErrors.password || formState.errors?.password
              })}
              placeholder="Enter your new password"
            />
            
            {/* Show client-side error first, then server-side error */}
            {(clientErrors.password || formState.errors?.password) && (
              <div className="text-red-500 text-sm mt-1">
                {clientErrors.password || formState.errors?.password?.[0]}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>

            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              required
              className={clsx("form-input", {
                'border-red-500': clientErrors.confirmPassword || formState.errors?.confirmPassword
              })}
              placeholder="Confirm your new password"
            />
            
            {/* Show client-side error first, then server-side error */}
            {(clientErrors.confirmPassword || formState.errors?.confirmPassword) && (
              <div className="text-red-500 text-sm mt-1">
                {clientErrors.confirmPassword || formState.errors?.confirmPassword?.[0]}
              </div>
            )}
          </div>
          
          {formState.errors?._form && (
            <div className="alert-error -mt-4">
              {formState.errors._form[0]}
            </div>
          )}

          {formState.errors?.token && (
            <div className="alert-error -mt-4">
              {formState.errors.token[0]}
            </div>
          )}

          <div className='mt-6 mb-10 text-primary-700 text-sm'>
            <p className="mb-2">Password requirements:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li className={clsx({
                'text-green-600': requirements.minLength,
                'text-red-500': password && !requirements.minLength
              })}>
                At least 8 characters long {requirements.minLength && '✓'}
              </li>
              <li className={clsx({
                'text-green-600': requirements.hasUpperCase,
                'text-red-500': password && !requirements.hasUpperCase
              })}>
                Contains uppercase letters {requirements.hasUpperCase && '✓'}
              </li>
              <li className={clsx({
                'text-green-600': requirements.hasLowerCase,
                'text-red-500': password && !requirements.hasLowerCase
              })}>
                Contains lowercase letters {requirements.hasLowerCase && '✓'}
              </li>
              <li className={clsx({
                'text-green-600': requirements.hasNumbers,
                'text-red-500': password && !requirements.hasNumbers
              })}>
                Contains at least one number {requirements.hasNumbers && '✓'}
              </li>
              <li className={clsx({
                'text-green-600': requirements.hasSpecialChar,
                'text-red-500': password && !requirements.hasSpecialChar
              })}>
                Contains at least one special character {requirements.hasSpecialChar && '✓'}
              </li>
            </ul>
          </div>

          <SubmitButton
            disabled={
              !token || 
              !!clientErrors.password || 
              !!clientErrors.confirmPassword ||
              !password ||
              !confirmPassword
            } 
          />

          <div className='mt-6 text-center text-primary-900'>
            <a href="/login" className="hover:underline">
              Back to Login
            </a>
          </div>
        </form>

        <div className='mt-auto text-primary-800'>
          Charge Ver 1.001
        </div>
      </div>

      {/* Right column: Background image */}
      <div className="flex-1 bg-accent-200 px-24 flex flex-col justify-center">
        <div className='max-w-[619px]'>
          <div>
            <h1 className="text-primary-900 text-[80px] mb-4 leading-[70px] font-normal">
              <strong>{isResetPassword ? 'Reset Your' : 'Welcome to'}</strong> {isResetPassword ? 'Password' : 'Admin Portal'}
            </h1>

            <p className="text-primary-600 font-medium">
              {isResetPassword ? 'Create a new password to access your account' : 'Set your password to get started'}
            </p>
          </div>

          <div>
            <Image
              src="/ev-car-charging.svg"
              alt="Graphics"
              width={776}
              height={776}
              priority
              className='w-full'
            />
          </div>
        </div>
      </div>
    </div>
  );
}

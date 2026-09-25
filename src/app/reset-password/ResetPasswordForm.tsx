'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { resetPassword, type ResetPasswordFormState } from '@/lib/actions/auth-actions';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import clsx from 'clsx';

// Submit button component that uses useFormStatus
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary"
    >
      {pending ? 'Sending...' : 'Send Reset Email'}
    </button>
  );
}

export default function ResetPasswordForm() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [success, setSuccess] = useState(false);
  
  // Initialize form state with the resetPassword action
  const initialState: ResetPasswordFormState = {};
  const [state, formAction] = useActionState(resetPassword, initialState);

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Handle successful reset request
  useEffect(() => {
    if (state.success) {
      setSuccess(true);
    }
  }, [state.success]);

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

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h1 className="font-bold text-2xl mb-4 text-green-800">
                Reset Email Sent
              </h1>

              <p className='text-primary-700 mb-4'>
                We&apos;ve sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.
              </p>

              <p className='text-green-600 text-sm'>
                Didn&apos;t receive the email? Check your spam folder or try again.
              </p>
            </div>

            <div className='space-y-4'>
              <button
                onClick={() => setSuccess(false)}
                className="btn-secondary w-full"
              >
                Send Another Email
              </button>
              
              <div className='text-primary-900'>
                <a href="/login" className="hover:underline">
                  Back to Login
                </a>
              </div>
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
                <strong>Welcome to</strong> Admin Portal
              </h1>

              <p className="text-primary-600 font-medium">
                Check your email for reset instructions
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
      {/* Left column: Reset password form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 pt-16 bg-accent-50 max-w-[630px]">
        <form
          action={formAction}
          className={clsx("w-full max-w-[393px]", {
            'has-error': state?.errors?._form
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
            Reset Password
          </h1>

          <p className='text-primary-700 font-medium mb-8'>
            Enter your email address and we&apos;ll send you a link to reset your password
          </p>

          <div>
            <label htmlFor="email" className="form-label">
              Email Address
            </label>

            <input
              type="email"
              id="email"
              name="email"
              required
              className={clsx("form-input", {
                "border-red-500": state?.errors?.email
              })}
              placeholder="Enter your email address"
            />
            {state?.errors?.email && (
              <div className="text-red-600 text-sm mt-1">
                {state.errors.email.join(', ')}
              </div>
            )}
          </div>
          
          {state?.errors?._form && (
            <div className="alert-error -mt-4">
              {state.errors._form.join(', ')}
            </div>
          )}

          <div className='mt-6 mb-10 text-primary-900'>
            <a href="/login" className="hover:underline">
              Back to Login
            </a>
          </div>

          <SubmitButton />
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
              <strong>Welcome to</strong> Admin Portal
            </h1>

            <p className="text-primary-600 font-medium">
              Reset your password to regain access
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

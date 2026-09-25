'use client';

import React, { useEffect } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { login, type LoginFormState } from '@/lib/actions/auth-actions';
import { useAuth } from '@/hooks/useAuth';
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
      {pending ? 'Logging in...' : 'Login'}
    </button>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Initialize form state with the login action
  const initialState: LoginFormState = {};
  const [state, formAction] = useActionState(login, initialState);

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-screen">
      {/* Left column: Login form */}
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
            Login
          </h1>

          <p className='text-primary-700 font-medium mb-8'>
            Enter your account details
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

          <div>
            <label htmlFor="password" className="form-label">
              Password
            </label>

            <input
              type="password"
              id="password"
              name="password"
              required
              className={clsx("form-input", {
                "border-red-500": state?.errors?.password
              })}
              placeholder="Enter your password"
            />
            {state?.errors?.password && (
              <div className="text-red-600 text-sm mt-1">
                {state.errors.password.join(', ')}
              </div>
            )}
          </div>
          
          {state?.errors?._form && (
            <div className="alert-error -mt-4">
              {state.errors._form.join(', ')}
            </div>
          )}

          <div className='mb-10 text-primary-900'>
            <a
              href="/reset-password"
              className="hover:underline"
            >
              Forgot Password?
            </a>
          </div>

          <SubmitButton />
        </form>

        <div className='mt-auto text-primary-800'>
          Charge Ver 1.001
        </div>
      </div>

      {/* Right column: Background image or pattern */}
      <div className="flex-1 bg-accent-200 px-24 flex flex-col justify-center">
        <div className='max-w-[619px]'>
          <div>
            <h1 className="text-primary-900 text-[80px] mb-4 leading-[70px] font-normal">
              <strong>Welcome to</strong> Admin Portal
            </h1>

            <p className="text-primary-600 font-medium">
              Login to access your account
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

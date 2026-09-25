import React from 'react';
import { createPageMetadata } from '@/lib/metadata';
import LoginForm from './LoginForm';

export const metadata = createPageMetadata('Login', 'Login to the Charge admin dashboard');

export default function LoginPage() {
  return <LoginForm />;
}



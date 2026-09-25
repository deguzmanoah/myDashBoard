"use client";

import React from 'react';
import Link from 'next/link';

interface PublicPageLayoutProps {
  title: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export default function PublicPageLayout({ title, lastUpdated, children }: PublicPageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple header navigation */}
      {/* <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">EV Charge</h2>
            </div>
            <nav className="flex space-x-6">
              <Link 
                href="/privacy-policy" 
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link 
                href="/terms-conditions" 
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Terms & Conditions
              </Link>
            </nav>
          </div>
        </div>
      </header> */}

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          {/* Page header */}
          <h1 className="text-3xl font-bold text-gray-900">
            {title}
          </h1>

          {lastUpdated && (
            <p className="text-sm text-gray-500 mb-4">
              Last updated: {lastUpdated}
            </p>
          )}

          {/* Page content */}
          <div className="prose prose-lg max-w-none">
            {children}
          </div>
        </div>  
      </main>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} EV Charge. All rights reserved.
        </p>
      </div>
    </div>
  );
}

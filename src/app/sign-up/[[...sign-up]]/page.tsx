'use client';

import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 mb-8 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-2xl font-bold text-white">Deep Signal</span>
      </Link>

      {/* Sign Up Component */}
      <div className="relative z-10">
        <SignUp 
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-slate-900/80 backdrop-blur-xl border border-slate-800',
              headerTitle: 'text-white',
              headerSubtitle: 'text-slate-400',
              formButtonPrimary: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90',
              formFieldInput: 'bg-slate-800 border-slate-700 text-white',
              formFieldLabel: 'text-slate-300',
              footerActionLink: 'text-cyan-400 hover:text-cyan-300',
            }
          }}
          redirectUrl="/onboarding"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  );
}

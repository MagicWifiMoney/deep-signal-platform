'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function ChatRedirect() {
  const searchParams = useSearchParams();
  const domain = searchParams.get('domain') || '';
  const token = searchParams.get('token') || '';
  const name = searchParams.get('name') || 'Your Agent';

  useEffect(() => {
    if (domain && token) {
      window.location.href = `https://${domain}/#token=${token}`;
    }
  }, [domain, token]);

  if (!domain || !token) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🔗</div>
          <h1 className="text-2xl font-bold text-white mb-2">Missing credentials</h1>
          <p className="text-slate-400">This link needs a domain and token to connect to your agent.</p>
          <a href="/onboarding" className="mt-6 inline-block px-6 py-3 rounded-xl bg-cyan-500 text-white font-medium hover:bg-cyan-400 transition-all">
            Create an Agent →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <h1 className="text-xl font-bold text-white mb-2">Connecting to {name}...</h1>
        <p className="text-slate-400 text-sm">Redirecting to your agent</p>
        <a href={`https://${domain}/#token=${token}`} className="mt-4 inline-block text-cyan-400 text-sm hover:underline">
          Click here if not redirected
        </a>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ChatRedirect />
    </Suspense>
  );
}

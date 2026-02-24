'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function ChatInner() {
  const searchParams = useSearchParams();
  const domain = searchParams.get('domain') || '';
  const token = searchParams.get('token') || '';
  const ip = searchParams.get('ip') || '';
  const name = searchParams.get('name') || 'Your Agent';
  const [chatUrl, setChatUrl] = useState('');
  const [status, setStatus] = useState<'checking' | 'ready' | 'waiting'>('checking');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!token) return;

    // Try multiple endpoints until one works
    const endpoints = [
      domain ? `https://${domain}` : null,
      ip ? `http://${ip}:3000` : null,
    ].filter(Boolean) as string[];

    if (endpoints.length === 0) {
      setStatus('waiting');
      return;
    }

    let cancelled = false;

    const checkReady = async () => {
      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            mode: 'no-cors',
            signal: AbortSignal.timeout(5000),
          });
          // no-cors returns opaque response, but if it doesn't throw, server is up
          if (!cancelled) {
            setChatUrl(`${endpoint}/#token=${token}`);
            setStatus('ready');
            return;
          }
        } catch {
          // try next
        }
      }

      if (!cancelled) {
        setAttempts(a => a + 1);
        // If domain exists, just use it - DNS might not have propagated to us but could work for the user
        if (domain) {
          setChatUrl(`https://${domain}/#token=${token}`);
          setStatus('ready');
          return;
        }
        setTimeout(checkReady, 3000);
      }
    };

    checkReady();
    return () => { cancelled = true; };
  }, [domain, token, ip]);

  if (!token) {
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

  if (status === 'checking' || status === 'waiting') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h1 className="text-xl font-bold text-white mb-2">Connecting to {name}...</h1>
          <p className="text-slate-400 text-sm">
            {attempts > 0
              ? `Waiting for your agent to come online (attempt ${attempts})...`
              : 'Checking if your agent is ready...'}
          </p>
          {attempts > 3 && domain && (
            <a
              href={`https://${domain}/#token=${token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block px-4 py-2 rounded-lg bg-slate-800 text-cyan-400 text-sm hover:bg-slate-700 transition-all"
            >
              Try direct link →
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-950">
      <iframe
        src={chatUrl}
        className="w-full h-full border-0"
        allow="clipboard-write; clipboard-read"
        title={`Chat with ${name}`}
      />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ChatInner />
    </Suspense>
  );
}

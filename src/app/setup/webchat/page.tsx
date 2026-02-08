'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function WebChatSetupContent() {
  const searchParams = useSearchParams();
  const domain = searchParams.get('domain') || 'your-instance.ds.jgiebz.com';
  const [copied, setCopied] = useState(false);

  const embedCode = `<script src="https://${domain}/chat/widget.js"></script>`;
  
  const iframeCode = `<iframe 
  src="https://${domain}/chat?embed=true" 
  style="position: fixed; bottom: 20px; right: 20px; width: 400px; height: 600px; border: none; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.15);"
></iframe>`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="flex items-center justify-between p-6 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">Deep Signal</span>
        </Link>
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">
          Back to Dashboard
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Web Chat Setup</h1>
          <p className="text-slate-400">Add a chat widget to your website in minutes.</p>
        </div>

        {/* Step 1 */}
        <div className="mb-8 p-6 rounded-xl border border-slate-700 bg-slate-800/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold">1</div>
            <h2 className="text-xl font-semibold text-white">Choose Integration Method</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-slate-600 bg-slate-800/50">
              <h3 className="font-medium text-white mb-2">Embed Script (Recommended)</h3>
              <p className="text-sm text-slate-400 mb-3">
                Lightweight script that loads asynchronously. Best for most websites.
              </p>
              <div className="relative">
                <pre className="p-3 rounded-lg bg-slate-900 text-sm text-cyan-400 overflow-x-auto font-mono">
                  {embedCode}
                </pre>
                <button
                  onClick={() => copyToClipboard(embedCode)}
                  className="absolute top-2 right-2 px-2 py-1 rounded text-xs bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            
            <div className="p-4 rounded-lg border border-slate-600 bg-slate-800/50">
              <h3 className="font-medium text-white mb-2">Direct Iframe</h3>
              <p className="text-sm text-slate-400 mb-3">
                Direct embed with full control over positioning and styling.
              </p>
              <div className="relative">
                <pre className="p-3 rounded-lg bg-slate-900 text-sm text-cyan-400 overflow-x-auto font-mono text-xs">
                  {iframeCode}
                </pre>
                <button
                  onClick={() => copyToClipboard(iframeCode)}
                  className="absolute top-2 right-2 px-2 py-1 rounded text-xs bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="mb-8 p-6 rounded-xl border border-slate-700 bg-slate-800/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold">2</div>
            <h2 className="text-xl font-semibold text-white">Add to Your Website</h2>
          </div>
          
          <div className="space-y-4 text-slate-300">
            <p>Paste the code just before the closing <code className="px-2 py-0.5 rounded bg-slate-700 text-cyan-400">&lt;/body&gt;</code> tag on any page where you want the chat widget to appear.</p>
            
            <div className="p-4 rounded-lg bg-slate-900 font-mono text-sm">
              <div className="text-slate-500">&lt;html&gt;</div>
              <div className="text-slate-500 ml-4">&lt;head&gt;...&lt;/head&gt;</div>
              <div className="text-slate-500 ml-4">&lt;body&gt;</div>
              <div className="text-slate-500 ml-8">... your content ...</div>
              <div className="text-cyan-400 ml-8 bg-cyan-500/10 px-2 py-1 rounded">{embedCode}</div>
              <div className="text-slate-500 ml-4">&lt;/body&gt;</div>
              <div className="text-slate-500">&lt;/html&gt;</div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="mb-8 p-6 rounded-xl border border-slate-700 bg-slate-800/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold">3</div>
            <h2 className="text-xl font-semibold text-white">Test Your Widget</h2>
          </div>
          
          <p className="text-slate-300 mb-4">
            After adding the code, refresh your website. You should see a chat icon in the bottom-right corner.
          </p>
          
          <div className="flex gap-4">
            <a
              href={`https://${domain}/chat`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-cyan-600 text-white font-medium hover:bg-cyan-500 transition-colors"
            >
              Preview Chat Interface
            </a>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 font-medium hover:bg-slate-800 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>

        {/* Customization */}
        <div className="p-6 rounded-xl border border-slate-700 bg-slate-800/30">
          <h2 className="text-xl font-semibold text-white mb-4">Customization Options</h2>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-slate-500">Position:</span>
              <span className="text-slate-300">Modify the <code className="px-1 py-0.5 rounded bg-slate-700 text-cyan-400">bottom</code> and <code className="px-1 py-0.5 rounded bg-slate-700 text-cyan-400">right</code> values in the iframe style</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-slate-500">Size:</span>
              <span className="text-slate-300">Adjust <code className="px-1 py-0.5 rounded bg-slate-700 text-cyan-400">width</code> and <code className="px-1 py-0.5 rounded bg-slate-700 text-cyan-400">height</code> to fit your design</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-slate-500">Branding:</span>
              <span className="text-slate-300">Configure colors and logo in your dashboard settings</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


export default function WebChatSetup() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <WebChatSetupContent />
    </Suspense>
  );
}

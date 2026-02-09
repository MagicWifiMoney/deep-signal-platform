'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const SLACK_CLIENT_ID = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID;
const SLACK_SCOPES = 'app_mentions:read,channels:history,channels:read,chat:write,groups:history,groups:read,im:history,im:read,im:write,mpim:history,mpim:read,mpim:write';

function SlackSetupContent() {
  const searchParams = useSearchParams();
  const domain = searchParams.get('domain') || '';
  const instanceId = searchParams.get('instanceId') || '';
  const [step, setStep] = useState(1);
  
  // Build OAuth URL with state containing instance info
  const state = btoa(JSON.stringify({ domain, instanceId }));
  const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&scope=${SLACK_SCOPES}&redirect_uri=${encodeURIComponent('https://deep-signal-platform.vercel.app/api/slack/callback')}&state=${state}`;

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
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8 text-[#4A154B]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
            </svg>
            <h1 className="text-3xl font-bold text-white">Slack Setup</h1>
          </div>
          <p className="text-slate-400">Connect your AI agent to Slack in a few clicks.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s < step ? 'bg-emerald-500 text-white' :
                s === step ? 'bg-cyan-500 text-white' :
                'bg-slate-700 text-slate-400'
              }`}>
                {s < step ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : s}
              </div>
              {s < 3 && <div className={`w-16 h-0.5 ${s < step ? 'bg-emerald-500' : 'bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Add to Slack */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-slate-700 bg-slate-800/30">
              <h2 className="text-xl font-semibold text-white mb-4">Step 1: Authorize Deep Signal</h2>
              <p className="text-slate-300 mb-6">
                Click the button below to add Deep Signal to your Slack workspace. 
                You'll be asked to authorize the following permissions:
              </p>
              
              <div className="grid md:grid-cols-2 gap-3 mb-6">
                {[
                  { scope: 'Read messages', desc: 'See messages in channels where the agent is added' },
                  { scope: 'Send messages', desc: 'Reply to users and post in channels' },
                  { scope: 'View channels', desc: 'See which channels exist' },
                  { scope: 'View users', desc: 'Get user names and info for personalized responses' },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="text-sm font-medium text-white">{item.scope}</div>
                    <div className="text-xs text-slate-400">{item.desc}</div>
                  </div>
                ))}
              </div>

              <a href={slackAuthUrl}>
                <img 
                  alt="Add to Slack" 
                  height="40" 
                  width="139" 
                  src="https://platform.slack-edge.com/img/add_to_slack.png"
                  srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
                  className="hover:opacity-80 transition-opacity"
                />
              </a>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="text-sm font-medium text-white mb-1">Security Note</div>
                  <p className="text-xs text-slate-400">
                    Your Slack token is stored securely on your dedicated instance. 
                    Deep Signal never stores your credentials on our platform servers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Configure */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-slate-700 bg-slate-800/30">
              <h2 className="text-xl font-semibold text-white mb-4">Step 2: Configure Channels</h2>
              <p className="text-slate-300 mb-6">
                Choose which Slack channels your agent should monitor and respond in.
              </p>
              
              <div className="space-y-3 mb-6">
                {['#general', '#support', '#sales'].map((channel) => (
                  <label key={channel} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500" />
                    <span className="text-white">{channel}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 font-medium hover:bg-slate-800 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-2 rounded-lg bg-cyan-600 text-white font-medium hover:bg-cyan-500 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Test */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-white">Slack Connected</h2>
              </div>
              <p className="text-slate-300 mb-6">
                Your AI agent is now connected to Slack. Try mentioning it in a channel to test.
              </p>

              <div className="p-4 rounded-lg bg-slate-800/50 mb-6">
                <div className="text-sm text-slate-400 mb-2">Try this in Slack:</div>
                <div className="font-mono text-cyan-400">@Deep Signal Agent Hello, can you help me?</div>
              </div>

              <div className="flex gap-3">
                <a
                  href="https://slack.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2 rounded-lg bg-[#4A154B] text-white font-medium hover:bg-[#611f69] transition-colors"
                >
                  Open Slack
                </a>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 font-medium hover:bg-slate-800 transition-colors"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Manual Setup Option */}
        <div className="mt-12 p-6 rounded-xl border border-slate-700 bg-slate-800/30">
          <h3 className="text-lg font-semibold text-white mb-4">Advanced: Manual Setup</h3>
          <p className="text-slate-400 text-sm mb-4">
            If you prefer to create your own Slack app or need custom scopes, follow these steps:
          </p>
          
          <ol className="space-y-3 text-sm text-slate-300">
            <li className="flex gap-3">
              <span className="text-cyan-400">1.</span>
              <span>Go to <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">api.slack.com/apps</a> and create a new app</span>
            </li>
            <li className="flex gap-3">
              <span className="text-cyan-400">2.</span>
              <span>Add the required OAuth scopes under "OAuth & Permissions"</span>
            </li>
            <li className="flex gap-3">
              <span className="text-cyan-400">3.</span>
              <span>Install the app to your workspace</span>
            </li>
            <li className="flex gap-3">
              <span className="text-cyan-400">4.</span>
              <span>Copy the Bot User OAuth Token</span>
            </li>
            <li className="flex gap-3">
              <span className="text-cyan-400">5.</span>
              <span>Configure it in your instance dashboard settings</span>
            </li>
          </ol>

          <div className="mt-4 p-3 rounded-lg bg-slate-900">
            <div className="text-xs text-slate-500 mb-1">Required Scopes:</div>
            <code className="text-xs text-cyan-400 break-all">
              app_mentions:read, channels:history, channels:read, chat:write, groups:history, groups:read, im:history, im:read, im:write, mpim:history, mpim:read, mpim:write, users:read
            </code>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SlackSetup() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <SlackSetupContent />
    </Suspense>
  );
}

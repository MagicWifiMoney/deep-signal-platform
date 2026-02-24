'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type MessageRole = 'agent' | 'user' | 'system' | 'executing';

interface ExecutingStep {
  status: 'pending' | 'running' | 'done' | 'error';
  text: string;
}

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  steps?: ExecutingStep[];
  streaming?: boolean;
}

interface TerminalChatProps {
  mode: 'onboarding' | 'support';
  agentUrl: string;
  agentToken: string;
  className?: string;
}

// ─── Demo conversation for offline mode ──────────────────────────────────────

const ONBOARDING_DEMO: ChatMessage[] = [
  { id: 'd1', role: 'system', content: 'Agent offline — demo mode' },
  { id: 'd2', role: 'system', content: 'This is a preview of the onboarding experience' },
  { id: 'd3', role: 'agent', content: "Hey! I'm Signal — your setup assistant.\n\nI'm going to help you deploy your own AI agent in about 5 minutes.\nNo forms, no dashboards — just tell me about your company and I'll handle the rest.\n\nWhat's your company name?" },
  { id: 'd4', role: 'user', content: 'Acme Corp' },
  { id: 'd5', role: 'agent', content: "Nice, Acme Corp! What does your team primarily use this agent for?\n\n  [1] Customer support\n  [2] Internal knowledge base\n  [3] Sales / lead qualification\n  [4] Something else" },
  { id: 'd6', role: 'user', content: '1' },
  {
    id: 'd7',
    role: 'executing',
    content: 'Provisioning your instance...',
    steps: [
      { status: 'done', text: 'Reserved dedicated EC2 instance (us-east-2)' },
      { status: 'done', text: 'Configured OpenClaw gateway' },
      { status: 'done', text: 'Applied customer support persona' },
      { status: 'running', text: 'Activating secure endpoints...' },
    ],
  },
  { id: 'd8', role: 'agent', content: "Your agent is live. 🚀\n\nAccess it at: https://acme-corp.deep-signal.app\nGateway token: sk-ds-••••••••••••••••\n\nReady to configure your first knowledge base?" },
];

const SUPPORT_DEMO: ChatMessage[] = [
  { id: 'd1', role: 'system', content: 'Agent offline — demo mode' },
  { id: 'd2', role: 'system', content: 'This is a preview of the support experience' },
  { id: 'd3', role: 'agent', content: "Hey! Ask me anything about Deep Signal, OpenClaw, or AI agents.\n\nI can help with setup, configuration, pricing, integrations — whatever you need.\n\nWhat's on your mind?" },
  { id: 'd4', role: 'user', content: 'How much does it cost?' },
  { id: 'd5', role: 'agent', content: "Deep Signal instances start at $10/month. That includes:\n\n  ✓ Dedicated EC2 compute\n  ✓ OpenClaw gateway (unlimited messages)\n  ✓ 99.9% uptime SLA\n  ✓ Slack + web chat integrations\n  ✓ Knowledge base uploads\n\nNo per-message fees. No shared infrastructure. Flat rate." },
];

// ─── Initial messages (live mode) ─────────────────────────────────────────────

function buildInitialMessages(mode: 'onboarding' | 'support'): ChatMessage[] {
  if (mode === 'onboarding') {
    return [
      { id: 'i1', role: 'system', content: 'Deep Signal Terminal v2.0' },
      { id: 'i2', role: 'system', content: 'Secure connection established' },
      {
        id: 'i3',
        role: 'agent',
        content:
          "Hey! I'm Signal — your setup assistant.\n\nI'm going to help you deploy your own AI agent in about 5 minutes.\nNo forms, no dashboards — just tell me about your company and I'll handle the rest.\n\nWhat's your company name?",
      },
    ];
  }
  return [
    { id: 'i1', role: 'system', content: 'Deep Signal Support Terminal' },
    { id: 'i2', role: 'system', content: 'Connected to knowledge base' },
    {
      id: 'i3',
      role: 'agent',
      content:
        "Hey! Ask me anything about Deep Signal, OpenClaw, or AI agents.\n\nI can help with setup, configuration, pricing, integrations — whatever you need.\n\nWhat's on your mind?",
    },
  ];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Step icon ────────────────────────────────────────────────────────────────

function StepIcon({ status }: { status: ExecutingStep['status'] }) {
  if (status === 'done') return <span className="text-emerald-400">✓</span>;
  if (status === 'error') return <span className="text-red-400">✗</span>;
  if (status === 'running')
    return (
      <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse align-middle" />
    );
  return <span className="text-slate-600">○</span>;
}

// ─── Message renderer ─────────────────────────────────────────────────────────

function TerminalMessage({ msg }: { msg: ChatMessage }) {
  if (msg.role === 'system') {
    return (
      <div className="text-slate-500 font-mono text-sm leading-relaxed">
        <span className="text-slate-600">[system]</span>{' '}
        <span className="text-slate-400">{msg.content}</span>
      </div>
    );
  }

  if (msg.role === 'user') {
    return (
      <div className="flex gap-2 font-mono text-sm leading-relaxed">
        <span className="text-emerald-400 select-none shrink-0">&gt;</span>
        <span className="text-emerald-300">{msg.content}</span>
      </div>
    );
  }

  if (msg.role === 'executing') {
    return (
      <div className="font-mono text-sm leading-relaxed space-y-1">
        <div className="text-cyan-400 text-xs uppercase tracking-wider mb-2">
          {msg.content}
        </div>
        {msg.steps?.map((step, i) => (
          <div key={i} className="flex items-center gap-2 pl-4 text-slate-400">
            <StepIcon status={step.status} />
            <span
              className={
                step.status === 'done'
                  ? 'text-slate-300'
                  : step.status === 'running'
                  ? 'text-cyan-300'
                  : step.status === 'error'
                  ? 'text-red-400'
                  : 'text-slate-600'
              }
            >
              {step.text}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // agent
  return (
    <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
      <span className="text-cyan-400 select-none text-xs mr-2">signal$</span>
      <span className="text-slate-200">
        {msg.content}
        {msg.streaming && (
          <span className="inline-block w-2 h-4 bg-cyan-400 ml-0.5 align-text-bottom animate-[blink_1s_step-end_infinite]" />
        )}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TerminalChat({
  mode,
  agentUrl,
  agentToken,
  className = '',
}: TerminalChatProps) {
  const isOffline = !agentUrl || !agentToken;
  const demoMessages = mode === 'onboarding' ? ONBOARDING_DEMO : SUPPORT_DEMO;

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    isOffline ? [] : buildInitialMessages(mode)
  );
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const demoIndexRef = useRef(0);
  const demoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Demo auto-type
  useEffect(() => {
    if (!isOffline) return;

    function typeNext() {
      const i = demoIndexRef.current;
      if (i >= demoMessages.length) return;

      const msg = demoMessages[i];
      demoIndexRef.current = i + 1;

      setMessages((prev) => [...prev, { ...msg, id: uid() }]);

      const delay = msg.role === 'user' ? 800 : msg.role === 'system' ? 400 : 1200;
      demoTimerRef.current = setTimeout(typeNext, delay);
    }

    demoTimerRef.current = setTimeout(typeNext, 600);
    return () => {
      if (demoTimerRef.current) clearTimeout(demoTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOffline]);

  // Keep history-aware input API
  const conversationHistory = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading || isOffline) return;

      const userMsg: ChatMessage = { id: uid(), role: 'user', content: text };
      setMessages((prev) => [...prev, userMsg]);
      setHistory((h) => [text, ...h]);
      setHistoryIndex(-1);
      setInput('');
      setIsLoading(true);

      conversationHistory.current = [
        ...conversationHistory.current,
        { role: 'user', content: text },
      ];

      const agentId = uid();
      const agentMsg: ChatMessage = {
        id: agentId,
        role: 'agent',
        content: '',
        streaming: true,
      };
      setMessages((prev) => [...prev, agentMsg]);

      try {
        const res = await fetch(`${agentUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${agentToken}`,
          },
          body: JSON.stringify({
            model: 'default',
            messages: conversationHistory.current,
            stream: true,
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const contentType = res.headers.get('content-type') ?? '';
        const isStream = contentType.includes('text/event-stream');

        if (isStream && res.body) {
          // SSE streaming
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let fullContent = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed === 'data: [DONE]') continue;
              if (!trimmed.startsWith('data: ')) continue;

              try {
                const json = JSON.parse(trimmed.slice(6));
                const delta = json?.choices?.[0]?.delta?.content;
                if (delta) {
                  fullContent += delta;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === agentId ? { ...m, content: fullContent, streaming: true } : m
                    )
                  );
                }
              } catch {
                // partial chunk - skip
              }
            }
          }

          conversationHistory.current = [
            ...conversationHistory.current,
            { role: 'assistant', content: fullContent },
          ];
          setMessages((prev) =>
            prev.map((m) => (m.id === agentId ? { ...m, streaming: false } : m))
          );
        } else {
          // Non-streaming fallback with simulated typing
          const json = await res.json();
          const content: string =
            json?.choices?.[0]?.message?.content ?? json?.content ?? String(json);

          conversationHistory.current = [
            ...conversationHistory.current,
            { role: 'assistant', content },
          ];

          // Simulate typing character by character
          let i = 0;
          function typeChar() {
            i += Math.ceil(Math.random() * 4 + 1);
            const slice = content.slice(0, i);
            const done = i >= content.length;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === agentId
                  ? { ...m, content: slice, streaming: !done }
                  : m
              )
            );
            if (!done) setTimeout(typeChar, 18 + Math.random() * 15);
          }
          typeChar();
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        setMessages((prev) =>
          prev.map((m) =>
            m.id === agentId
              ? {
                  ...m,
                  content: `[system] Connection error: ${errMsg}`,
                  role: 'system',
                  streaming: false,
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [agentUrl, agentToken, isLoading, isOffline]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(next);
      setInput(history[next] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(historyIndex - 1, -1);
      setHistoryIndex(next);
      setInput(next === -1 ? '' : history[next] ?? '');
    }
  };

  const titleLabel =
    mode === 'onboarding' ? 'signal@deep-signal:~' : 'support@deep-signal:~';

  return (
    <div
      className={`flex flex-col rounded-xl overflow-hidden border border-slate-700/60 shadow-2xl shadow-black/60 bg-[#0a0a0f] ${className}`}
      style={{ fontFamily: 'var(--font-mono), "JetBrains Mono", monospace' }}
    >
      {/* ── Terminal title bar ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/80 border-b border-slate-700/60 select-none">
        {/* Traffic-light dots */}
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors cursor-default" title="close" />
          <span className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors cursor-default" title="minimize" />
          <span className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-400 transition-colors cursor-default" title="maximize" />
        </div>
        {/* Title */}
        <span className="flex-1 text-center text-xs text-slate-400 tracking-wide">
          {titleLabel}
        </span>
        {/* Status dot */}
        <span
          className={`w-2 h-2 rounded-full ${
            isOffline ? 'bg-slate-600' : isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-400'
          }`}
          title={isOffline ? 'offline' : isLoading ? 'processing' : 'connected'}
        />
      </div>

      {/* ── Scanline overlay (CRT effect) ──────────────────────────────── */}
      <div className="relative flex-1 flex flex-col overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
          }}
        />

        {/* ── Message area ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth min-h-0">
          {messages.map((msg) => (
            <TerminalMessage key={msg.id} msg={msg} />
          ))}

          {/* Loading dots when waiting for first token */}
          {isLoading &&
            !messages.some((m) => m.streaming) && (
              <div className="flex items-center gap-1 pl-1">
                <span className="text-cyan-400 text-xs mr-1">signal$</span>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400/60 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            )}

          <div ref={bottomRef} />
        </div>

        {/* ── Input area ───────────────────────────────────────────────── */}
        <div
          className="px-4 py-3 border-t border-slate-800/60 bg-[#0a0a0f]/80 flex items-center gap-2"
          onClick={() => inputRef.current?.focus()}
        >
          <span className="text-emerald-400 text-sm select-none shrink-0">&gt;</span>
          {isOffline ? (
            <span className="text-slate-600 text-sm italic">
              demo mode — connect an agent to enable chat
            </span>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder={isLoading ? '' : 'type a message...'}
              autoFocus
              className="flex-1 bg-transparent text-emerald-300 text-sm outline-none placeholder:text-slate-700 caret-emerald-400 disabled:opacity-50"
              style={{ fontFamily: 'inherit' }}
            />
          )}
          {!isOffline && input && (
            <button
              onClick={() => sendMessage(input)}
              disabled={isLoading}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors shrink-0 disabled:opacity-30"
              tabIndex={-1}
            >
              ↵
            </button>
          )}
        </div>
      </div>

      {/* Blink keyframe */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

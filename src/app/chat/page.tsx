'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | ContentBlock[];
  timestamp?: number;
}

interface ContentBlock {
  type: string;
  text?: string;
}

// ── WebSocket JSON-RPC Client ──────────────────────────────────────────
class GatewayClient {
  private ws: WebSocket | null = null;
  private pending = new Map<string, { resolve: (v: any) => void; reject: (e: Error) => void }>();
  private connectNonce: string | null = null;
  private onEvent: ((evt: any) => void) | null = null;
  private onDisconnect: (() => void) | null = null;
  private onReconnect: (() => void) | null = null;
  private url: string;
  private token: string;
  private sessionKey: string;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private backoffMs = 800;
  private stopped = false;

  constructor(url: string, token: string, sessionKey: string) {
    this.url = url;
    this.token = token;
    this.sessionKey = sessionKey;
  }

  setHandlers(handlers: {
    onEvent?: (evt: any) => void;
    onDisconnect?: () => void;
    onReconnect?: () => void;
  }) {
    this.onEvent = handlers.onEvent ?? null;
    this.onDisconnect = handlers.onDisconnect ?? null;
    this.onReconnect = handlers.onReconnect ?? null;
  }

  connect() {
    this.stopped = false;
    this._connect();
  }

  private _connect() {
    if (this.stopped) return;
    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.addEventListener('open', () => {
      // Wait for connect.challenge event before sending connect
    });

    this.ws.addEventListener('message', (e) => this.handleMessage(String(e.data ?? '')));

    this.ws.addEventListener('close', () => {
      this.ws = null;
      this.flushPending(new Error('disconnected'));
      this.onDisconnect?.();
      this.scheduleReconnect();
    });

    this.ws.addEventListener('error', () => {});
  }

  private scheduleReconnect() {
    if (this.stopped) return;
    const delay = this.backoffMs;
    this.backoffMs = Math.min(this.backoffMs * 1.7, 15000);
    this.reconnectTimer = setTimeout(() => this._connect(), delay);
  }

  private flushPending(err: Error) {
    for (const [, p] of this.pending) p.reject(err);
    this.pending.clear();
  }

  private handleMessage(raw: string) {
    let msg: any;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'event') {
      if (msg.event === 'connect.challenge') {
        this.connectNonce = msg.payload?.nonce ?? null;
        this.sendConnect();
        return;
      }
      this.onEvent?.(msg);
      return;
    }

    if (msg.type === 'res') {
      const p = this.pending.get(msg.id);
      if (!p) return;
      this.pending.delete(msg.id);
      if (msg.ok) p.resolve(msg.payload);
      else p.reject(new Error(msg.error?.message ?? 'request failed'));
    }
  }

  private async sendConnect() {
    try {
      // Use openclaw-control-ui client ID to leverage dangerouslyDisableDeviceAuth bypass
      // Device fields are required by schema but ignored when bypass is active
      const deviceId = crypto.randomUUID();
      const nonce = this.connectNonce ?? '';

      const result = await this.request('connect', {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: 'openclaw-control-ui',
          version: '1.0.0',
          platform: navigator.platform || 'web',
          mode: 'webchat',
        },
        role: 'operator',
        scopes: ['operator.admin', 'operator.approvals', 'operator.pairing'],
        device: {
          id: deviceId,
          publicKey: 'bypass',
          signature: 'bypass',
          signedAt: Date.now(),
          nonce,
        },
        caps: [],
        auth: { token: this.token },
        userAgent: navigator.userAgent,
        locale: navigator.language,
      });
      this.backoffMs = 800;
      this.onReconnect?.();
    } catch (err) {
      console.error('Connect failed:', err);
      this.ws?.close();
    }
  }

  request(method: string, params: any): Promise<any> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('not connected'));
    }
    const id = crypto.randomUUID();
    const msg = { type: 'req', id, method, params };
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws!.send(JSON.stringify(msg));
    });
  }

  stop() {
    this.stopped = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.flushPending(new Error('stopped'));
  }

  get connected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────
function extractText(content: string | ContentBlock[]): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((b) => b.type === 'text' && b.text)
      .map((b) => b.text!)
      .join('\n');
  }
  return '';
}

function formatTime(ts?: number): string {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// ── Simple Markdown-ish renderer ───────────────────────────────────────
function renderMarkdown(text: string): string {
  let html = text
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="code-block"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="msg-link">$1</a>')
    // Line breaks
    .replace(/\n/g, '<br/>');
  return html;
}

// ── Chat UI Component ──────────────────────────────────────────────────
function DeepSignalChat() {
  const searchParams = useSearchParams();
  const domain = searchParams.get('domain') || '';
  const token = searchParams.get('token') || '';
  const name = searchParams.get('name') || 'Your Agent';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [stream, setStream] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);

  const clientRef = useRef<GatewayClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const streamRef = useRef<string | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, stream, scrollToBottom]);

  // ── Connect ──
  useEffect(() => {
    if (!domain || !token) return;

    const wsUrl = `wss://${domain}`;
    const client = new GatewayClient(wsUrl, token, 'main');
    clientRef.current = client;

    client.setHandlers({
      onEvent: (evt) => {
        const payload = evt.payload ?? {};

        // Handle chat events (streaming + final)
        if (evt.event === 'chat') {
          const state = payload.state;
          const message = payload.message;

          if (state === 'delta') {
            const text = extractText(message?.content ?? '');
            if (text) {
              streamRef.current = text;
              setStream(text);
            }
          } else if (state === 'final') {
            const finalText = extractText(message?.content ?? '');
            if (finalText) {
              setMessages((prev) => [...prev, {
                role: 'assistant',
                content: finalText,
                timestamp: message?.timestamp ?? Date.now(),
              }]);
            } else if (streamRef.current) {
              setMessages((prev) => [...prev, {
                role: 'assistant',
                content: streamRef.current!,
                timestamp: Date.now(),
              }]);
            }
            streamRef.current = null;
            setStream(null);
            setRunId(null);
            setSending(false);
          } else if (state === 'aborted' || state === 'error') {
            if (streamRef.current) {
              setMessages((prev) => [...prev, {
                role: 'assistant',
                content: streamRef.current!,
                timestamp: Date.now(),
              }]);
            }
            streamRef.current = null;
            setStream(null);
            setRunId(null);
            setSending(false);
          }
        }
      },
      onDisconnect: () => setConnected(false),
      onReconnect: async () => {
        setConnected(true);
        // Load history
        try {
          const hist = await client.request('chat.history', { sessionKey: 'main', limit: 200 });
          if (hist?.messages) {
            setMessages(hist.messages.map((m: any) => ({
              role: m.role,
              content: extractText(m.content),
              timestamp: m.timestamp,
            })));
          }
        } catch (e) {
          console.error('Failed to load history:', e);
        }
      },
    });

    client.connect();

    return () => {
      client.stop();
      clientRef.current = null;
    };
  }, [domain, token]);

  // ── Send message ──
  const sendMessage = useCallback(async () => {
    const text = draft.trim();
    if (!text || !clientRef.current?.connected) return;

    setDraft('');
    setSending(true);
    streamRef.current = null;

    // Add user message immediately
    setMessages((prev) => [...prev, {
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }]);

    const idempotencyKey = crypto.randomUUID();
    setRunId(idempotencyKey);
    setStream('');

    try {
      await clientRef.current.request('chat.send', {
        sessionKey: 'main',
        message: text,
        deliver: false,
        idempotencyKey,
      });
    } catch (err) {
      console.error('Send failed:', err);
      setSending(false);
      setRunId(null);
      setStream(null);
    }
  }, [draft]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // ── No credentials ──
  if (!domain || !token) {
    return (
      <div className="chat-root">
        <div className="chat-empty">
          <div className="chat-empty-icon">🔗</div>
          <h1>Missing credentials</h1>
          <p>This link needs a domain and token to connect.</p>
          <a href="/onboarding" className="chat-cta">Create an Agent →</a>
        </div>
        <Style />
      </div>
    );
  }

  return (
    <div className="chat-root">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-inner">
          <div className="chat-avatar">
            <span className="chat-avatar-emoji">⚡</span>
          </div>
          <div className="chat-header-text">
            <div className="chat-header-name">{name}</div>
            <div className={`chat-header-status ${connected ? 'online' : 'offline'}`}>
              {connected ? 'Online' : 'Connecting...'}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && !stream && (
          <div className="chat-welcome">
            <div className="chat-welcome-icon">⚡</div>
            <div className="chat-welcome-text">
              Say hello to <strong>{name}</strong>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`msg-row ${msg.role}`}>
            <div className={`msg-bubble ${msg.role}`}>
              <div
                className="msg-text"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(
                    typeof msg.content === 'string' ? msg.content : extractText(msg.content)
                  ),
                }}
              />
              {msg.timestamp && (
                <div className="msg-time">{formatTime(msg.timestamp)}</div>
              )}
            </div>
          </div>
        ))}

        {/* Streaming bubble */}
        {stream !== null && (
          <div className="msg-row assistant">
            <div className="msg-bubble assistant streaming">
              {stream ? (
                <div
                  className="msg-text"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(stream) }}
                />
              ) : (
                <div className="typing-indicator">
                  <span /><span /><span />
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-wrap">
        <div className="chat-input-inner">
          <textarea
            ref={inputRef}
            className="chat-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            rows={1}
            disabled={!connected}
          />
          <button
            className={`chat-send ${draft.trim() && connected ? 'active' : ''}`}
            onClick={sendMessage}
            disabled={!draft.trim() || !connected || sending}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      <Style />
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────
function Style() {
  return (
    <style>{`
      * { margin: 0; padding: 0; box-sizing: border-box; }

      .chat-root {
        position: fixed;
        inset: 0;
        display: flex;
        flex-direction: column;
        background: #000;
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
        color: #fff;
        -webkit-font-smoothing: antialiased;
      }

      /* ── Header ── */
      .chat-header {
        flex-shrink: 0;
        background: rgba(20, 20, 20, 0.85);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-bottom: 1px solid rgba(255,255,255,0.08);
        padding: 12px 16px;
        padding-top: max(12px, env(safe-area-inset-top));
        z-index: 10;
      }
      .chat-header-inner {
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 720px;
        margin: 0 auto;
      }
      .chat-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #06b6d4, #8b5cf6);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .chat-avatar-emoji { font-size: 20px; }
      .chat-header-name {
        font-size: 17px;
        font-weight: 600;
        line-height: 1.2;
      }
      .chat-header-status {
        font-size: 13px;
        line-height: 1.2;
      }
      .chat-header-status.online { color: #34d399; }
      .chat-header-status.offline { color: #6b7280; }

      /* ── Messages ── */
      .chat-messages {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 16px;
        padding-bottom: 8px;
        -webkit-overflow-scrolling: touch;
      }

      .chat-welcome {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 80px 20px;
        opacity: 0.5;
      }
      .chat-welcome-icon { font-size: 48px; }
      .chat-welcome-text { font-size: 17px; color: #9ca3af; }

      .msg-row {
        display: flex;
        margin-bottom: 6px;
        max-width: 720px;
        margin-left: auto;
        margin-right: auto;
      }
      .msg-row.user { justify-content: flex-end; }
      .msg-row.assistant { justify-content: flex-start; }

      .msg-bubble {
        max-width: 78%;
        padding: 10px 14px;
        border-radius: 18px;
        font-size: 16px;
        line-height: 1.45;
        word-wrap: break-word;
        overflow-wrap: break-word;
        position: relative;
      }
      .msg-bubble.user {
        background: #0b84fe;
        color: #fff;
        border-bottom-right-radius: 4px;
      }
      .msg-bubble.assistant {
        background: #2c2c2e;
        color: #e5e5ea;
        border-bottom-left-radius: 4px;
      }
      .msg-bubble.streaming {
        min-height: 38px;
      }

      .msg-text { white-space: pre-wrap; }
      .msg-text .code-block {
        background: rgba(0,0,0,0.3);
        border-radius: 8px;
        padding: 10px 12px;
        margin: 8px 0;
        overflow-x: auto;
        font-family: 'SF Mono', 'Menlo', monospace;
        font-size: 14px;
        line-height: 1.4;
        display: block;
        white-space: pre;
      }
      .msg-text .inline-code {
        background: rgba(0,0,0,0.25);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'SF Mono', 'Menlo', monospace;
        font-size: 14px;
      }
      .msg-text .msg-link {
        color: #58a6ff;
        text-decoration: none;
      }
      .msg-text .msg-link:hover { text-decoration: underline; }

      .msg-time {
        font-size: 11px;
        opacity: 0.5;
        margin-top: 4px;
        text-align: right;
      }
      .msg-row.assistant .msg-time { text-align: left; }

      /* ── Typing indicator ── */
      .typing-indicator {
        display: flex;
        gap: 4px;
        padding: 4px 0;
        align-items: center;
      }
      .typing-indicator span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #9ca3af;
        animation: typingBounce 1.4s infinite ease-in-out;
      }
      .typing-indicator span:nth-child(1) { animation-delay: 0s; }
      .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
      .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

      @keyframes typingBounce {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
        30% { transform: translateY(-6px); opacity: 1; }
      }

      /* ── Input ── */
      .chat-input-wrap {
        flex-shrink: 0;
        background: rgba(20, 20, 20, 0.85);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-top: 1px solid rgba(255,255,255,0.08);
        padding: 10px 16px;
        padding-bottom: max(10px, env(safe-area-inset-bottom));
      }
      .chat-input-inner {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        max-width: 720px;
        margin: 0 auto;
        background: #1c1c1e;
        border-radius: 22px;
        padding: 6px 6px 6px 16px;
      }
      .chat-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        color: #fff;
        font-size: 16px;
        font-family: inherit;
        resize: none;
        max-height: 120px;
        line-height: 1.4;
        padding: 6px 0;
      }
      .chat-input::placeholder { color: #6b7280; }

      .chat-send {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: none;
        background: #3a3a3c;
        color: #6b7280;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
        transition: all 0.15s ease;
      }
      .chat-send.active {
        background: #0b84fe;
        color: #fff;
      }
      .chat-send:disabled { opacity: 0.5; cursor: default; }

      /* ── Empty state ── */
      .chat-empty {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px;
        text-align: center;
        gap: 12px;
      }
      .chat-empty-icon { font-size: 64px; }
      .chat-empty h1 { font-size: 24px; font-weight: 700; }
      .chat-empty p { color: #9ca3af; font-size: 16px; }
      .chat-cta {
        display: inline-block;
        margin-top: 16px;
        padding: 12px 28px;
        border-radius: 14px;
        background: linear-gradient(135deg, #06b6d4, #8b5cf6);
        color: #fff;
        font-weight: 600;
        font-size: 16px;
        text-decoration: none;
        transition: opacity 0.15s;
      }
      .chat-cta:hover { opacity: 0.9; }

      /* ── Scrollbar ── */
      .chat-messages::-webkit-scrollbar { width: 4px; }
      .chat-messages::-webkit-scrollbar-track { background: transparent; }
      .chat-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
    `}</style>
  );
}

// ── Page wrapper ───────────────────────────────────────────────────────
export default function ChatPage() {
  return (
    <Suspense fallback={
      <div style={{
        position: 'fixed', inset: 0, background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 40, height: 40, border: '3px solid #06b6d4',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <DeepSignalChat />
    </Suspense>
  );
}

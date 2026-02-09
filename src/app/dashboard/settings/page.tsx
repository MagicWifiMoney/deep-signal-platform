'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MODELS, formatCost } from '@/lib/models';

const MODEL_OPTIONS = MODELS.map(m => ({
  id: m.id,
  name: m.displayName,
  speed: m.speed === 'instant' ? 'Fastest' : m.speed === 'fast' ? 'Fast' : m.speed === 'medium' ? 'Balanced' : 'Thoughtful',
  cost: formatCost(m.inputCost),
  provider: m.provider,
  recommended: m.recommended,
}));

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    agentName: 'AI Assistant',
    model: 'claude-sonnet-4',
    tone: 'professional',
    systemPrompt: `You are a helpful AI assistant for our company. Be professional, accurate, and helpful.

Key behaviors:
- Answer questions clearly and concisely
- Ask clarifying questions when needed
- Escalate to human support for complex issues
- Never share confidential information`,
    welcomeMessage: "Hi! I'm here to help. How can I assist you today?",
    fallbackMessage: "I'm not sure I understand. Could you rephrase that, or would you like to speak with a human?",
    maxTokens: 4096,
    temperature: 0.7,
    
    // Channels
    whatsappEnabled: false,
    slackEnabled: false,
    telegramEnabled: false,
    webEnabled: true,
    
    // Advanced
    rateLimit: 60,
    contextWindow: 10,
    autoEscalate: true,
    logConversations: true,
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId: 'default',
          settings,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error('Failed to save settings:', e);
    } finally {
      setSaving(false);
    }
  };

  const handlePause = async () => {
    if (!confirm('Pause this instance? The agent will stop responding until resumed.')) return;
    try {
      await fetch('/api/instances/default/restart', { method: 'POST' });
      alert('Instance paused.');
    } catch (e) {
      console.error('Failed to pause instance:', e);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      const res = await fetch('/api/instances/default', { method: 'DELETE' });
      if (res.ok) {
        window.location.href = '/onboarding';
      }
    } catch (e) {
      console.error('Failed to delete instance:', e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold text-white">Instance Settings</h1>
        </div>
        
        <button
          onClick={handleSave}
          className={`px-6 py-2 rounded-xl font-medium transition-all ${
            saved 
              ? 'bg-emerald-500 text-white' 
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/25'
          }`}
        >
          {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save Changes'}
        </button>
      </header>

      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800 p-6">
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
            {[
              { id: 'general', label: 'General', icon: '⚙️' },
              { id: 'personality', label: 'Personality', icon: '✨' },
              { id: 'channels', label: 'Channels', icon: '💬' },
              { id: 'knowledge', label: 'Knowledge Base', icon: '📚' },
              { id: 'advanced', label: 'Advanced', icon: '🔧' },
              { id: 'danger', label: 'Danger Zone', icon: '⚠️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                  activeTab === tab.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-8 max-w-3xl">
          {/* General */}
          {activeTab === 'general' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">General Settings</h2>
                <p className="text-slate-400">Basic configuration for your AI agent</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Agent Name</label>
                  <input
                    type="text"
                    value={settings.agentName}
                    onChange={(e) => setSettings({ ...settings, agentName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Model</label>
                  <div className="grid gap-3 max-h-96 overflow-y-auto pr-2">
                    {MODEL_OPTIONS.map((model) => (
                      <label
                        key={model.id}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          settings.model === model.id
                            ? 'border-cyan-500 bg-cyan-500/10'
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="model"
                            value={model.id}
                            checked={settings.model === model.id}
                            onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                            className="hidden"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{model.name}</span>
                              {model.recommended && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">Recommended</span>
                              )}
                            </div>
                            <div className="text-sm text-slate-400">{model.speed} • {model.provider}</div>
                          </div>
                        </div>
                        <span className="text-sm text-slate-400">{model.cost}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Communication Tone</label>
                  <select
                    value={settings.tone}
                    onChange={(e) => setSettings({ ...settings, tone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="casual">Casual</option>
                    <option value="formal">Formal</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Personality */}
          {activeTab === 'personality' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Agent Personality</h2>
                <p className="text-slate-400">Customize how your agent communicates</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">System Prompt</label>
                  <textarea
                    value={settings.systemPrompt}
                    onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
                    rows={10}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none font-mono text-sm resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-2">This is the core instruction set for your agent</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Welcome Message</label>
                  <input
                    type="text"
                    value={settings.welcomeMessage}
                    onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Fallback Message</label>
                  <input
                    type="text"
                    value={settings.fallbackMessage}
                    onChange={(e) => setSettings({ ...settings, fallbackMessage: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-2">Shown when the agent doesn't understand</p>
                </div>
              </div>
            </div>
          )}

          {/* Channels */}
          {activeTab === 'channels' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Connected Channels</h2>
                <p className="text-slate-400">Manage where your agent can receive messages</p>
              </div>

              <div className="space-y-4">
                {[
                  { id: 'web', name: 'Web Chat', icon: '🌐', enabled: settings.webEnabled, configured: true },
                  { id: 'whatsapp', name: 'WhatsApp', icon: '📱', enabled: settings.whatsappEnabled, configured: false },
                  { id: 'slack', name: 'Slack', icon: '💼', enabled: settings.slackEnabled, configured: false },
                  { id: 'telegram', name: 'Telegram', icon: '✈️', enabled: settings.telegramEnabled, configured: false },
                ].map((channel) => (
                  <div key={channel.id} className="glass rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{channel.icon}</span>
                      <div>
                        <div className="font-medium text-white">{channel.name}</div>
                        <div className="text-sm text-slate-400">
                          {channel.configured ? 'Connected' : 'Not configured'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {!channel.configured && (
                        <Link
                          href={`/setup/${channel.id}`}
                          className="text-sm text-cyan-400 hover:underline"
                        >
                          Set up →
                        </Link>
                      )}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={channel.enabled}
                          onChange={() => {}}
                          disabled={!channel.configured}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 peer-disabled:opacity-50"></div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/setup"
                className="inline-flex items-center gap-2 text-cyan-400 hover:underline"
              >
                + Add another channel
              </Link>
            </div>
          )}

          {/* Knowledge Base */}
          {activeTab === 'knowledge' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Knowledge Base</h2>
                <p className="text-slate-400">Upload documents to give your agent context</p>
              </div>

              <div className="glass rounded-2xl p-8 border-dashed border-2 border-slate-600 text-center">
                <div className="text-5xl mb-4">📁</div>
                <h3 className="text-lg font-medium text-white mb-2">Upload Documents</h3>
                <p className="text-slate-400 mb-4">PDF, TXT, MD, or DOCX files up to 10MB</p>
                <button className="px-6 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors">
                  Choose Files
                </button>
              </div>

              <div>
                <h3 className="font-medium text-white mb-4">Uploaded Documents (0)</h3>
                <div className="text-center py-8 text-slate-500">
                  No documents uploaded yet
                </div>
              </div>

              <div className="glass rounded-xl p-4">
                <h3 className="font-medium text-white mb-2">💡 Tips</h3>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Upload FAQs, product docs, or company info</li>
                  <li>• The agent will reference these when answering questions</li>
                  <li>• More specific documents = better answers</li>
                </ul>
              </div>
            </div>
          )}

          {/* Advanced */}
          {activeTab === 'advanced' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Advanced Settings</h2>
                <p className="text-slate-400">Fine-tune your agent's behavior</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Max Tokens: {settings.maxTokens}
                  </label>
                  <input
                    type="range"
                    min="256"
                    max="8192"
                    step="256"
                    value={settings.maxTokens}
                    onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">Maximum response length</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Temperature: {settings.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.temperature}
                    onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">Lower = more focused, Higher = more creative</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Context Window: {settings.contextWindow} messages
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="20"
                    value={settings.contextWindow}
                    onChange={(e) => setSettings({ ...settings, contextWindow: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">How many previous messages to remember</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Rate Limit: {settings.rateLimit} msg/min
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="120"
                    step="10"
                    value={settings.rateLimit}
                    onChange={(e) => setSettings({ ...settings, rateLimit: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 cursor-pointer">
                    <div>
                      <div className="font-medium text-white">Auto-escalate complex issues</div>
                      <div className="text-sm text-slate-400">Notify humans when agent is uncertain</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoEscalate}
                      onChange={(e) => setSettings({ ...settings, autoEscalate: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 cursor-pointer">
                    <div>
                      <div className="font-medium text-white">Log all conversations</div>
                      <div className="text-sm text-slate-400">Store messages for analytics and training</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.logConversations}
                      onChange={(e) => setSettings({ ...settings, logConversations: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          {activeTab === 'danger' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Danger Zone</h2>
                <p className="text-slate-400">Irreversible actions for your instance</p>
              </div>

              <div className="space-y-4">
                <div className="glass rounded-xl p-6 border-amber-500/30">
                  <h3 className="font-medium text-white mb-2">Pause Instance</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Temporarily stop the agent from responding. You can resume anytime.
                  </p>
                  <button onClick={handlePause} className="px-4 py-2 rounded-lg border border-amber-500 text-amber-400 hover:bg-amber-500/10 transition-colors">
                    Pause Instance
                  </button>
                </div>

                <div className="glass rounded-xl p-6 border-rose-500/30">
                  <h3 className="font-medium text-white mb-2">Delete Instance</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Permanently delete this instance and all its data. This cannot be undone.
                  </p>
                  <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 rounded-lg border border-rose-500 text-rose-400 hover:bg-rose-500/10 transition-colors">
                    Delete Instance
                  </button>
                  {showDeleteConfirm && (
                    <div className="mt-3 p-4 rounded-lg bg-rose-500/10 border border-rose-500/30">
                      <p className="text-sm text-rose-300 mb-3">Are you sure? This will permanently destroy the instance and all data.</p>
                      <div className="flex gap-2">
                        <button onClick={handleDelete} className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm hover:bg-rose-500">
                          Yes, Delete
                        </button>
                        <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const STEPS = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'company', title: 'Company' },
  { id: 'api', title: 'API Keys' },
  { id: 'model', title: 'Model' },
  { id: 'channel', title: 'Communication' },
  { id: 'personality', title: 'Personality' },
  { id: 'deploy', title: 'Deploy' },
  { id: 'success', title: 'Live' },
];

const MODELS = [
  { id: 'haiku', name: 'Claude Haiku', speed: 'Fastest', cost: '$0.25/1M tokens', desc: 'Quick responses, cost-effective', latency: '~200ms', context: '200K tokens' },
  { id: 'sonnet', name: 'Claude Sonnet', speed: 'Fast', cost: '$3/1M tokens', desc: 'Best balance of speed and quality', latency: '~800ms', context: '200K tokens' },
  { id: 'opus', name: 'Claude Opus', speed: 'Thoughtful', cost: '$15/1M tokens', desc: 'Maximum capability and reasoning', latency: '~2s', context: '200K tokens' },
];

const CHANNELS = [
  { id: 'web', name: 'Web Chat', desc: 'Embed on your website. Easiest to set up.', setup: 'Copy a script tag to your site', recommended: true },
  { id: 'slack', name: 'Slack', desc: 'Workspace app for internal teams', setup: 'OAuth app installation' },
  { id: 'discord', name: 'Discord', desc: 'Server bot for communities', setup: 'Bot token configuration' },
  { id: 'whatsapp', name: 'WhatsApp', desc: 'Business messaging for customers', setup: 'Meta Business verification required' },
  { id: 'telegram', name: 'Telegram', desc: 'Bot integration', setup: 'BotFather token' },
  { id: 'email', name: 'Email', desc: 'Inbox assistant', setup: 'IMAP/SMTP or API integration' },
  { id: 'sms', name: 'SMS', desc: 'Text message support', setup: 'Twilio or carrier integration' },
];

const PERSONALITY_EXAMPLES = {
  professional: {
    greeting: "Good morning. How may I assist you today?",
    response: "I understand your concern regarding the invoice discrepancy. I've reviewed your account and can confirm the adjustment has been applied. You should see the corrected amount reflected within 24 hours.",
    closing: "Is there anything else I can help you with?"
  },
  friendly: {
    greeting: "Hey there! Great to hear from you. What can I help with today?",
    response: "Oh, I totally get it - billing stuff can be confusing! I took a look at your account and good news: I've already fixed that invoice issue. The corrected amount should show up in about a day.",
    closing: "Anything else on your mind? Happy to help!"
  },
  casual: {
    greeting: "Hey! What's up?",
    response: "Yeah, I see what happened with that invoice. All fixed now - you'll see the right amount in a day or so. No worries.",
    closing: "Need anything else?"
  },
  formal: {
    greeting: "Good day. I am at your service. How may I be of assistance?",
    response: "Thank you for bringing this matter to our attention. Upon thorough review of your account records, I have identified and rectified the invoice discrepancy. The corrected amount shall be reflected in your account within one business day.",
    closing: "Should you require any further assistance, please do not hesitate to inquire."
  },
};

interface CompanyAnalysis {
  description: string;
  icps: string[];
  suggestedTone: string;
  suggestedUseCase: string;
}

interface DeploymentStatus {
  id: number;
  hostname: string;
  ip: string;
  domain: string;
  status: string;
  dashboardUrl: string | null;
  gatewayToken: string;
  openclawReady: boolean;
}

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    companyName: '',
    companyUrl: '',
    companyDescription: '',
    industry: '',
    useCase: '',
    icps: [] as string[],
    apiProvider: 'anthropic' as 'anthropic' | 'openrouter',
    apiKey: '',
    model: 'sonnet',
    channel: 'web',
    agentName: 'AI Assistant',
    tone: 'professional',
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [companyAnalysis, setCompanyAnalysis] = useState<CompanyAnalysis | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deployment, setDeployment] = useState<DeploymentStatus | null>(null);
  const [deployProgress, setDeployProgress] = useState(0);

  const updateForm = (key: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Analyze company website
  const analyzeCompany = async () => {
    if (!formData.companyUrl) return;
    
    setIsAnalyzing(true);
    setAnalyzeError(null);
    setCompanyAnalysis(null);
    
    try {
      const res = await fetch('/api/analyze-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formData.companyUrl, name: formData.companyName }),
      });
      
      const text = await res.text();
      if (!text) {
        throw new Error('Empty response from server');
      }
      
      const analysis = JSON.parse(text);
      
      if (!res.ok) {
        throw new Error(analysis.error || 'Analysis failed');
      }
      
      setCompanyAnalysis(analysis);
      updateForm('companyDescription', analysis.description);
      updateForm('icps', analysis.icps);
      if (analysis.suggestedTone) {
        updateForm('tone', analysis.suggestedTone);
      }
      if (analysis.suggestedUseCase) {
        updateForm('useCase', analysis.suggestedUseCase);
      }
    } catch (error: any) {
      console.error('Failed to analyze company:', error);
      setAnalyzeError(error.message || 'Failed to analyze website');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Deploy instance
  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeployError(null);
    setDeployProgress(10);

    try {
      const res = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      // Handle empty responses
      const text = await res.text();
      if (!text) {
        throw new Error('Server returned empty response. Please try again.');
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Invalid response from server: ${text.substring(0, 100)}`);
      }

      if (!res.ok) {
        throw new Error(data.error || 'Deployment failed');
      }

      setDeployProgress(30);
      setDeployment({
        id: data.instance.id,
        hostname: data.instance.hostname,
        ip: data.instance.ip,
        domain: data.instance.domain,
        status: 'provisioning',
        dashboardUrl: data.instance.dashboardUrl,
        gatewayToken: data.instance.gatewayToken,
        openclawReady: false,
      });

      pollDeploymentStatus(data.instance.id);
    } catch (error: any) {
      setDeployError(error.message);
      setIsDeploying(false);
    }
  };

  // Poll for deployment status
  const pollDeploymentStatus = async (serverId: number) => {
    let attempts = 0;
    const maxAttempts = 60;

    const poll = async () => {
      attempts++;
      
      try {
        const res = await fetch(`/api/onboard?id=${serverId}`);
        const text = await res.text();
        
        if (!text) {
          if (attempts < maxAttempts) {
            setTimeout(poll, 2000);
          }
          return;
        }

        const data = JSON.parse(text);

        if (data.status === 'running') {
          setDeployProgress(60);
        }

        if (data.openclawReady) {
          setDeployProgress(100);
          setDeployment(prev => prev ? {
            ...prev,
            status: 'ready',
            openclawReady: true,
            dashboardUrl: data.dashboardUrl,
          } : null);
          setIsDeploying(false);
          nextStep();
          return;
        }

        if (attempts < maxAttempts) {
          setDeployProgress(Math.min(90, 30 + attempts * 2));
          setTimeout(poll, 2000);
        } else {
          setDeployment(prev => prev ? {
            ...prev,
            status: 'ready',
            dashboardUrl: `http://${prev.ip}:3000`,
          } : null);
          setIsDeploying(false);
          nextStep();
        }
      } catch (error) {
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        }
      }
    };

    poll();
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return (
          <div className="text-center max-w-xl mx-auto">
            <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Welcome to Deep Signal</h2>
            <p className="text-xl text-slate-400 mb-8">
              Deploy your dedicated AI agent in under 5 minutes.
            </p>
            <div className="grid grid-cols-3 gap-6 text-left mb-8">
              {[
                { title: 'Private Instance', text: 'Your own isolated server' },
                { title: 'Zero-Knowledge', text: 'We never see your data' },
                { title: 'Full Control', text: 'SSH access included' },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                  <div className="text-sm font-medium text-white mb-1">{item.title}</div>
                  <div className="text-xs text-slate-400">{item.text}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'company':
        return (
          <div className="max-w-xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-2">Tell us about your company</h2>
            <p className="text-slate-400 mb-8">We'll analyze your website to customize your AI agent.</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Company Name</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => updateForm('companyName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
                  placeholder="Acme Corp"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Company Website</label>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={formData.companyUrl}
                    onChange={(e) => updateForm('companyUrl', e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
                    placeholder="https://acme.com"
                  />
                  <button
                    onClick={analyzeCompany}
                    disabled={!formData.companyUrl || isAnalyzing}
                    className="px-6 py-3 rounded-xl bg-cyan-600 text-white font-medium hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                  </button>
                </div>
              </div>

              {isAnalyzing && (
                <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-slate-300">Analyzing your website...</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Fetching content and generating company profile</p>
                </div>
              )}

              {analyzeError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
                  <div className="text-rose-400 font-medium text-sm mb-1">Analysis Failed</div>
                  <p className="text-xs text-slate-400">{analyzeError}</p>
                </div>
              )}

              {companyAnalysis && !isAnalyzing && (
                <div className="space-y-4 p-6 rounded-xl bg-slate-800/30 border border-slate-700">
                  <div>
                    <div className="text-sm font-medium text-slate-300 mb-2">Company Overview</div>
                    <p className="text-sm text-slate-400">{companyAnalysis.description}</p>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-slate-300 mb-2">Potential ICPs (Ideal Customer Profiles)</div>
                    <div className="flex flex-wrap gap-2">
                      {companyAnalysis.icps.map((icp, i) => (
                        <span key={i} className="px-3 py-1 rounded-full text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {icp}
                        </span>
                      ))}
                    </div>
                  </div>

                  {companyAnalysis.suggestedUseCase && (
                    <div>
                      <div className="text-sm font-medium text-slate-300 mb-2">Suggested Use Case</div>
                      <p className="text-sm text-slate-400">{companyAnalysis.suggestedUseCase}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'api':
        return (
          <div className="max-w-xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-2">Connect your API</h2>
            <p className="text-slate-400 mb-8">Your keys are encrypted and stored only on your private instance.</p>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => updateForm('apiProvider', 'anthropic')}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    formData.apiProvider === 'anthropic'
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <div className="h-8 mb-4 flex items-center justify-center">
                    <svg viewBox="0 0 46 32" className="h-6 text-[#D97757]" fill="currentColor">
                      <path d="M32.73 0h-6.945L38.45 32h6.945L32.73 0ZM13.27 0 0 32h7.082l2.59-6.4h13.25l2.59 6.4h7.082L19.327 0h-6.055Zm-.702 19.2 4.334-10.705 4.334 10.705H12.57Z"/>
                    </svg>
                  </div>
                  <div className="font-medium text-white">Anthropic</div>
                  <div className="text-xs text-slate-400 mt-1">Direct API access</div>
                </button>
                <button
                  onClick={() => updateForm('apiProvider', 'openrouter')}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    formData.apiProvider === 'openrouter'
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <div className="h-8 mb-4 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="h-6 text-white" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                  </div>
                  <div className="font-medium text-white">OpenRouter</div>
                  <div className="text-xs text-slate-400 mt-1">Multi-provider access</div>
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {formData.apiProvider === 'anthropic' ? 'Anthropic' : 'OpenRouter'} API Key
                </label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => updateForm('apiKey', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors font-mono"
                  placeholder={formData.apiProvider === 'anthropic' ? 'sk-ant-...' : 'sk-or-v1-...'}
                />
                <p className="text-xs text-slate-500 mt-2">
                  Get your key: {formData.apiProvider === 'anthropic' 
                    ? 'console.anthropic.com' 
                    : 'openrouter.ai/keys'}
                </p>
              </div>
              
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white mb-1">Zero-knowledge architecture</div>
                    <p className="text-xs text-slate-400">
                      Your API key is encrypted and stored only on your private instance. 
                      Deep Signal platform cannot access your keys or conversation data.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'model':
        return (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-2">Choose your model</h2>
            <p className="text-slate-400 mb-8">You can change this anytime from your dashboard.</p>
            
            <div className="space-y-4">
              {MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => updateForm('model', model.id)}
                  className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
                    formData.model === model.id
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-semibold text-white">{model.name}</span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
                      {model.cost}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500 text-xs">Speed</span>
                      <div className="text-cyan-400">{model.speed}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs">Latency</span>
                      <div className="text-white">{model.latency}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs">Context</span>
                      <div className="text-white">{model.context}</div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mt-3">{model.desc}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 'channel':
        return (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-2">Connect Communication Layer</h2>
            <p className="text-slate-400 mb-8">How will users interact with your agent? You can add more channels later.</p>
            
            <div className="space-y-3">
              {CHANNELS.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => updateForm('channel', channel.id)}
                  className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                    formData.channel === channel.id
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                        {channel.id === 'web' && (
                          <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                        )}
                        {channel.id === 'slack' && (
                          <svg className="w-5 h-5 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                          </svg>
                        )}
                        {channel.id === 'discord' && (
                          <svg className="w-5 h-5 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
                          </svg>
                        )}
                        {channel.id === 'whatsapp' && (
                          <svg className="w-5 h-5 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                        )}
                        {channel.id === 'telegram' && (
                          <svg className="w-5 h-5 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                          </svg>
                        )}
                        {channel.id === 'email' && (
                          <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        )}
                        {channel.id === 'sms' && (
                          <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{channel.name}</span>
                          {channel.recommended && (
                            <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400">{channel.desc}</p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">{channel.setup}</div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-6 p-4 rounded-xl bg-slate-800/30 border border-slate-700">
              <p className="text-sm text-slate-400">
                Channel configuration happens after deployment. Web Chat is the fastest to set up - just copy a script tag to your website.
              </p>
            </div>
          </div>
        );

      case 'personality':
        return (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-2">Define personality</h2>
            <p className="text-slate-400 mb-8">Give your agent a name and communication style.</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Agent Name</label>
                <input
                  type="text"
                  value={formData.agentName}
                  onChange={(e) => updateForm('agentName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
                  placeholder="e.g., Alex, Maya, Aria..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Communication Tone</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'professional', label: 'Professional' },
                    { id: 'friendly', label: 'Friendly' },
                    { id: 'casual', label: 'Casual' },
                    { id: 'formal', label: 'Formal' },
                  ].map((tone) => (
                    <button
                      key={tone.id}
                      onClick={() => updateForm('tone', tone.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        formData.tone === tone.id
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-white font-medium">{tone.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Example responses */}
              <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700">
                <div className="text-sm font-medium text-slate-300 mb-4">
                  Example responses for "{formData.tone}" tone:
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Greeting</div>
                    <div className="text-sm text-white bg-slate-800/50 p-3 rounded-lg">
                      {PERSONALITY_EXAMPLES[formData.tone as keyof typeof PERSONALITY_EXAMPLES]?.greeting}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Response to billing issue</div>
                    <div className="text-sm text-white bg-slate-800/50 p-3 rounded-lg">
                      {PERSONALITY_EXAMPLES[formData.tone as keyof typeof PERSONALITY_EXAMPLES]?.response}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Closing</div>
                    <div className="text-sm text-white bg-slate-800/50 p-3 rounded-lg">
                      {PERSONALITY_EXAMPLES[formData.tone as keyof typeof PERSONALITY_EXAMPLES]?.closing}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'deploy':
        return (
          <div className="max-w-2xl mx-auto">
            {!isDeploying && !deployment && (
              <>
                <div className="text-center mb-8">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Ready to Deploy</h2>
                  <p className="text-slate-400">
                    Review your configuration below. Deployment takes approximately 2 minutes.
                  </p>
                </div>
                
                {/* Detailed specs */}
                <div className="space-y-6">
                  {/* Instance Configuration */}
                  <div className="rounded-xl border border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-700">
                      <h3 className="font-semibold text-white">Instance Configuration</h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Server Type</div>
                          <div className="text-white font-mono">Hetzner CPX21</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Location</div>
                          <div className="text-white font-mono">US East (Ashburn)</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">vCPU</div>
                          <div className="text-white font-mono">3 cores (AMD EPYC)</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Memory</div>
                          <div className="text-white font-mono">4 GB DDR4</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Storage</div>
                          <div className="text-white font-mono">80 GB NVMe SSD</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Network</div>
                          <div className="text-white font-mono">20 TB/mo included</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">OS</div>
                          <div className="text-white font-mono">Ubuntu 24.04 LTS</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Monthly Cost</div>
                          <div className="text-emerald-400 font-mono">$10.59/mo + API usage</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Agent Configuration */}
                  <div className="rounded-xl border border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-700">
                      <h3 className="font-semibold text-white">Agent Configuration</h3>
                    </div>
                    <div className="p-6 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Company</span>
                        <span className="text-white">{formData.companyName || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Agent Name</span>
                        <span className="text-white">{formData.agentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Model</span>
                        <span className="text-white">{MODELS.find(m => m.id === formData.model)?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Communication Layer</span>
                        <span className="text-white">{CHANNELS.find(c => c.id === formData.channel)?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tone</span>
                        <span className="text-white capitalize">{formData.tone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">API Provider</span>
                        <span className="text-white capitalize">{formData.apiProvider}</span>
                      </div>
                    </div>
                  </div>

                  {/* What happens next */}
                  <div className="rounded-xl border border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-700">
                      <h3 className="font-semibold text-white">What Happens Next</h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {[
                          { step: '1', title: 'Server Provisioning', desc: 'A dedicated Hetzner VPS is created in your name (~30s)', time: '0:00-0:30' },
                          { step: '2', title: 'System Setup', desc: 'Ubuntu 24.04, Node.js 22, and dependencies are installed (~45s)', time: '0:30-1:15' },
                          { step: '3', title: 'OpenClaw Installation', desc: 'OpenClaw gateway and your agent configuration are deployed (~30s)', time: '1:15-1:45' },
                          { step: '4', title: 'Health Check', desc: 'We verify your instance is responding and ready (~15s)', time: '1:45-2:00' },
                        ].map((item) => (
                          <div key={item.step} className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 text-sm text-slate-300">
                              {item.step}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-white">{item.title}</span>
                                <span className="text-xs text-slate-500 font-mono">{item.time}</span>
                              </div>
                              <p className="text-sm text-slate-400">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Security note */}
                  <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <div>
                        <div className="text-sm font-medium text-white mb-1">Your instance is physically isolated</div>
                        <p className="text-xs text-slate-400">
                          Your API keys and conversation data never leave your server. 
                          You get full SSH access for auditing. 
                          No shared infrastructure with other clients.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {deployError && (
                  <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
                    <div className="text-rose-400 font-medium mb-1">Deployment Error</div>
                    <p className="text-sm text-slate-400">{deployError}</p>
                  </div>
                )}
                
                <div className="mt-8 text-center">
                  <button
                    onClick={handleDeploy}
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                  >
                    Deploy Instance
                  </button>
                </div>
              </>
            )}

            {isDeploying && (
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center animate-pulse">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Deploying Your Instance</h2>
                <p className="text-slate-400 mb-8">
                  This usually takes 1-2 minutes. Do not close this page.
                </p>
                
                <div className="max-w-md mx-auto mb-8">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-cyan-400">{deployProgress}%</span>
                  </div>
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${deployProgress}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3 text-left max-w-md mx-auto">
                  {[
                    { label: 'Creating server', done: deployProgress >= 20 },
                    { label: 'Installing OpenClaw', done: deployProgress >= 50 },
                    { label: 'Configuring agent', done: deployProgress >= 70 },
                    { label: 'Starting gateway', done: deployProgress >= 90 },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        step.done ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {step.done ? (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (i + 1)}
                      </span>
                      <span className={step.done ? 'text-white' : 'text-slate-400'}>{step.label}</span>
                    </div>
                  ))}
                </div>

                {deployment && (
                  <div className="mt-8 p-4 rounded-xl bg-slate-800/50 text-left max-w-md mx-auto">
                    <div className="text-xs font-mono text-cyan-400">{deployment.hostname}</div>
                    <div className="text-xs text-slate-500">IP: {deployment.ip}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'success':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">Your Agent is Live</h2>
              <p className="text-xl text-slate-400">
                Your AI agent is deployed and ready to assist your customers.
              </p>
            </div>
            
            {/* Instance Details */}
            <div className="rounded-xl border border-slate-700 overflow-hidden mb-6">
              <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-700">
                <h3 className="font-semibold text-white">Instance Details</h3>
              </div>
              <div className="p-6 space-y-3 text-sm">
                {deployment && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dashboard URL</span>
                      <a href={deployment.dashboardUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline font-mono">
                        {deployment.domain}
                      </a>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">IP Address</span>
                      <span className="text-white font-mono">{deployment.ip}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Gateway Token</span>
                      <code className="px-2 py-1 rounded bg-slate-800 text-cyan-400 font-mono text-xs">{deployment.gatewayToken}</code>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Model</span>
                  <span className="text-white">{MODELS.find(m => m.id === formData.model)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className="text-emerald-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                </div>
              </div>
            </div>

            {/* Gateway Token Instructions */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <div className="text-sm font-medium text-white mb-1">Save Your Gateway Token</div>
                  <p className="text-xs text-slate-400">
                    You'll need to enter this token in the Control UI settings when you first access your dashboard.
                    Copy it now: <code className="px-1 py-0.5 rounded bg-slate-800 text-amber-400">{deployment?.gatewayToken}</code>
                  </p>
                </div>
              </div>
            </div>

            {/* Channel Setup */}
            <div className="rounded-xl border border-slate-700 overflow-hidden mb-6">
              <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-700">
                <h3 className="font-semibold text-white">Connect Communication Channels</h3>
              </div>
              <div className="p-4 space-y-3">
                <Link
                  href={`/setup/webchat?domain=${deployment?.domain}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                      <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-white">Web Chat</div>
                      <div className="text-xs text-slate-400">Embed a chat widget on your website</div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <Link
                  href={`/setup/slack?domain=${deployment?.domain}&instanceId=${deployment?.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#4A154B] flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-white">Slack</div>
                      <div className="text-xs text-slate-400">Connect to your Slack workspace</div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {deployment?.dashboardUrl && (
                <a 
                  href={deployment.dashboardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                >
                  Open Dashboard
                </a>
              )}
              <Link 
                href="https://missioncontrol.jgiebz.com"
                className="px-8 py-4 rounded-xl bg-slate-800/50 border border-slate-700 text-white font-semibold hover:bg-slate-800 transition-colors"
              >
                Mission Control
              </Link>
            </div>
          </div>
        );
    }
  };

  const canProceed = () => {
    switch (STEPS[currentStep].id) {
      case 'company':
        return formData.companyName.trim() !== '';
      case 'api':
        return formData.apiKey.trim() !== '';
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="flex items-center justify-between p-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">Deep Signal</span>
        </Link>
        
        {/* Progress */}
        <div className="hidden md:flex items-center gap-2">
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                  i < currentStep 
                    ? 'bg-emerald-500 text-white' 
                    : i === currentStep 
                      ? 'bg-cyan-500 text-white' 
                      : 'bg-slate-700 text-slate-400'
                }`}
              >
                {i < currentStep ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (i + 1)}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${i < currentStep ? 'bg-emerald-500' : 'bg-slate-700'}`} />
              )}
            </div>
          ))}
        </div>
        
        <div className="md:hidden text-sm text-slate-400">
          Step {currentStep + 1} of {STEPS.length}
        </div>
        
        <Link
          href="/dashboard"
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          Skip for now
        </Link>
      </header>

      {/* Content */}
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-6 py-12">
        {renderStep()}
      </main>

      {/* Navigation */}
      {currentStep < STEPS.length - 1 && !isDeploying && (
        <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 to-transparent">
          <div className="max-w-xl mx-auto flex justify-between">
            {currentStep > 0 && STEPS[currentStep].id !== 'deploy' ? (
              <button
                onClick={prevStep}
                className="px-6 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white font-medium hover:bg-slate-800 transition-colors"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            
            {STEPS[currentStep].id !== 'deploy' && (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}

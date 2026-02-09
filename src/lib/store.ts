// Client-side storage for instance settings

export interface InstanceSettings {
  // General
  agentName: string;
  model: string;
  tone: 'professional' | 'friendly' | 'casual' | 'formal';
  
  // Personality
  systemPrompt: string;
  welcomeMessage: string;
  fallbackMessage: string;
  
  // Advanced
  maxTokens: number;
  temperature: number;
  contextWindow: number;
  rateLimit: number;
  autoEscalate: boolean;
  logConversations: boolean;
  
  // Channels
  channels: {
    whatsapp: { enabled: boolean; configured: boolean; config?: Record<string, string> };
    slack: { enabled: boolean; configured: boolean; config?: Record<string, string> };
    telegram: { enabled: boolean; configured: boolean; config?: Record<string, string> };
    discord: { enabled: boolean; configured: boolean; config?: Record<string, string> };
    email: { enabled: boolean; configured: boolean; config?: Record<string, string> };
    web: { enabled: boolean; configured: boolean };
  };
}

const DEFAULT_SETTINGS: InstanceSettings = {
  agentName: 'AI Assistant',
  model: 'anthropic/claude-sonnet-4',
  tone: 'professional',
  systemPrompt: `You are a helpful AI assistant. Be professional, accurate, and helpful.

Key behaviors:
- Answer questions clearly and concisely
- Ask clarifying questions when needed
- Escalate to human support for complex issues
- Never share confidential information`,
  welcomeMessage: "Hi! I'm here to help. How can I assist you today?",
  fallbackMessage: "I'm not sure I understand. Could you rephrase that?",
  maxTokens: 4096,
  temperature: 0.7,
  contextWindow: 10,
  rateLimit: 60,
  autoEscalate: true,
  logConversations: true,
  channels: {
    whatsapp: { enabled: false, configured: false },
    slack: { enabled: false, configured: false },
    telegram: { enabled: false, configured: false },
    discord: { enabled: false, configured: false },
    email: { enabled: false, configured: false },
    web: { enabled: true, configured: true },
  },
};

const STORAGE_KEY = 'deep-signal-settings';

export function getSettings(): InstanceSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Partial<InstanceSettings>): InstanceSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  
  try {
    const current = getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save settings:', e);
    return getSettings();
  }
}

export function resetSettings(): InstanceSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  
  localStorage.removeItem(STORAGE_KEY);
  return DEFAULT_SETTINGS;
}

// Onboarding state
export interface OnboardingState {
  completed: boolean;
  step: number;
  data: {
    companyName?: string;
    industry?: string;
    useCase?: string;
    apiProvider?: string;
    apiKey?: string;
    model?: string;
    channel?: string;
    agentName?: string;
    tone?: string;
  };
  deployment?: {
    id: number;
    hostname: string;
    ip: string;
    domain: string;
    status: string;
    dashboardUrl: string | null;
    gatewayToken: string;
  };
}

const ONBOARDING_KEY = 'deep-signal-onboarding';

export function getOnboardingState(): OnboardingState {
  if (typeof window === 'undefined') {
    return { completed: false, step: 0, data: {} };
  }
  
  try {
    const stored = localStorage.getItem(ONBOARDING_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load onboarding state:', e);
  }
  
  return { completed: false, step: 0, data: {} };
}

export function saveOnboardingState(state: Partial<OnboardingState>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const current = getOnboardingState();
    const updated = { ...current, ...state };
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save onboarding state:', e);
  }
}

export function clearOnboardingState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ONBOARDING_KEY);
}

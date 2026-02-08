import { NextResponse } from 'next/server';

export interface InstanceSettings {
  agentName: string;
  model: string;
  tone: 'professional' | 'friendly' | 'casual' | 'formal';
  systemPrompt: string;
  welcomeMessage: string;
  fallbackMessage: string;
  maxTokens: number;
  temperature: number;
  contextWindow: number;
  rateLimit: number;
  autoEscalate: boolean;
  logConversations: boolean;
}

// In-memory store for demo (would be database in production)
const settingsStore: Record<string, InstanceSettings> = {};

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
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const instanceId = searchParams.get('instanceId');

  if (!instanceId) {
    return NextResponse.json(
      { error: 'instanceId is required' },
      { status: 400 }
    );
  }

  const settings = settingsStore[instanceId] || DEFAULT_SETTINGS;

  return NextResponse.json({
    instanceId,
    settings,
    lastUpdated: new Date().toISOString(),
  });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { instanceId, settings } = body;

    if (!instanceId) {
      return NextResponse.json(
        { error: 'instanceId is required' },
        { status: 400 }
      );
    }

    if (!settings) {
      return NextResponse.json(
        { error: 'settings object is required' },
        { status: 400 }
      );
    }

    // Validate settings
    const validationErrors: string[] = [];

    if (settings.agentName && settings.agentName.length > 50) {
      validationErrors.push('Agent name must be 50 characters or less');
    }

    if (settings.maxTokens && (settings.maxTokens < 256 || settings.maxTokens > 16384)) {
      validationErrors.push('Max tokens must be between 256 and 16384');
    }

    if (settings.temperature && (settings.temperature < 0 || settings.temperature > 1)) {
      validationErrors.push('Temperature must be between 0 and 1');
    }

    if (settings.rateLimit && (settings.rateLimit < 10 || settings.rateLimit > 120)) {
      validationErrors.push('Rate limit must be between 10 and 120');
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Merge with existing settings
    const currentSettings = settingsStore[instanceId] || DEFAULT_SETTINGS;
    const updatedSettings = { ...currentSettings, ...settings };
    settingsStore[instanceId] = updatedSettings;

    // In production, this would:
    // 1. Save to database
    // 2. Push config to the instance via SSH/API
    // 3. Trigger gateway restart if needed

    console.log(`Updated settings for instance ${instanceId}:`, updatedSettings);

    // Simulate push to instance
    await new Promise(r => setTimeout(r, 500));

    return NextResponse.json({
      success: true,
      instanceId,
      settings: updatedSettings,
      message: 'Settings saved and pushed to instance',
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Reset to defaults
  try {
    const body = await request.json();
    const { instanceId } = body;

    if (!instanceId) {
      return NextResponse.json(
        { error: 'instanceId is required' },
        { status: 400 }
      );
    }

    settingsStore[instanceId] = { ...DEFAULT_SETTINGS };

    return NextResponse.json({
      success: true,
      instanceId,
      settings: DEFAULT_SETTINGS,
      message: 'Settings reset to defaults',
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    return NextResponse.json(
      { error: 'Failed to reset settings' },
      { status: 500 }
    );
  }
}

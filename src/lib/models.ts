// All available models for Deep Signal instances

export interface Model {
  id: string;
  provider: 'anthropic' | 'openai' | 'google' | 'openrouter' | 'mistral' | 'groq';
  name: string;
  displayName: string;
  description: string;
  contextWindow: number;
  maxOutput: number;
  inputCost: number;  // per 1M tokens
  outputCost: number; // per 1M tokens
  speed: 'instant' | 'fast' | 'medium' | 'slow';
  capabilities: ('chat' | 'vision' | 'function_calling' | 'streaming')[];
  recommended?: boolean;
}

export const MODELS: Model[] = [
  // Anthropic Models
  {
    id: 'anthropic/claude-haiku-3-5',
    provider: 'anthropic',
    name: 'claude-3-5-haiku',
    displayName: 'Claude 3.5 Haiku',
    description: 'Fastest Claude model. Great for high-volume, simple tasks.',
    contextWindow: 200000,
    maxOutput: 8192,
    inputCost: 0.25,
    outputCost: 1.25,
    speed: 'instant',
    capabilities: ['chat', 'vision', 'function_calling', 'streaming'],
    recommended: true,
  },
  {
    id: 'anthropic/claude-sonnet-4',
    provider: 'anthropic',
    name: 'claude-sonnet-4',
    displayName: 'Claude Sonnet 4',
    description: 'Best balance of speed and intelligence. Recommended for most use cases.',
    contextWindow: 200000,
    maxOutput: 16384,
    inputCost: 3.00,
    outputCost: 15.00,
    speed: 'fast',
    capabilities: ['chat', 'vision', 'function_calling', 'streaming'],
    recommended: true,
  },
  {
    id: 'anthropic/claude-opus-4',
    provider: 'anthropic',
    name: 'claude-opus-4',
    displayName: 'Claude Opus 4',
    description: 'Most capable model. Best for complex reasoning and analysis.',
    contextWindow: 200000,
    maxOutput: 16384,
    inputCost: 15.00,
    outputCost: 75.00,
    speed: 'medium',
    capabilities: ['chat', 'vision', 'function_calling', 'streaming'],
  },
  
  // OpenAI Models (via OpenRouter)
  {
    id: 'openrouter/openai/gpt-4o',
    provider: 'openai',
    name: 'gpt-4o',
    displayName: 'GPT-4o',
    description: 'OpenAI\'s flagship multimodal model.',
    contextWindow: 128000,
    maxOutput: 16384,
    inputCost: 2.50,
    outputCost: 10.00,
    speed: 'fast',
    capabilities: ['chat', 'vision', 'function_calling', 'streaming'],
  },
  {
    id: 'openrouter/openai/gpt-4o-mini',
    provider: 'openai',
    name: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    description: 'Fast and affordable GPT-4 class model.',
    contextWindow: 128000,
    maxOutput: 16384,
    inputCost: 0.15,
    outputCost: 0.60,
    speed: 'instant',
    capabilities: ['chat', 'vision', 'function_calling', 'streaming'],
    recommended: true,
  },
  {
    id: 'openrouter/openai/o1',
    provider: 'openai',
    name: 'o1',
    displayName: 'OpenAI o1',
    description: 'Advanced reasoning model for complex problems.',
    contextWindow: 200000,
    maxOutput: 100000,
    inputCost: 15.00,
    outputCost: 60.00,
    speed: 'slow',
    capabilities: ['chat', 'streaming'],
  },
  
  // Google Models (via OpenRouter)
  {
    id: 'openrouter/google/gemini-2.0-flash',
    provider: 'google',
    name: 'gemini-2.0-flash',
    displayName: 'Gemini 2.0 Flash',
    description: 'Google\'s fastest multimodal model.',
    contextWindow: 1000000,
    maxOutput: 8192,
    inputCost: 0.10,
    outputCost: 0.40,
    speed: 'instant',
    capabilities: ['chat', 'vision', 'function_calling', 'streaming'],
    recommended: true,
  },
  {
    id: 'openrouter/google/gemini-2.5-pro',
    provider: 'google',
    name: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    description: 'Google\'s most capable model with 1M context.',
    contextWindow: 1000000,
    maxOutput: 65536,
    inputCost: 1.25,
    outputCost: 10.00,
    speed: 'fast',
    capabilities: ['chat', 'vision', 'function_calling', 'streaming'],
  },
  
  // Mistral Models
  {
    id: 'openrouter/mistral/mistral-large',
    provider: 'mistral',
    name: 'mistral-large',
    displayName: 'Mistral Large',
    description: 'Mistral\'s flagship model with strong reasoning.',
    contextWindow: 128000,
    maxOutput: 8192,
    inputCost: 2.00,
    outputCost: 6.00,
    speed: 'fast',
    capabilities: ['chat', 'function_calling', 'streaming'],
  },
  {
    id: 'openrouter/mistral/codestral',
    provider: 'mistral',
    name: 'codestral',
    displayName: 'Codestral',
    description: 'Specialized for code generation and understanding.',
    contextWindow: 32000,
    maxOutput: 8192,
    inputCost: 0.30,
    outputCost: 0.90,
    speed: 'fast',
    capabilities: ['chat', 'streaming'],
  },
  
  // Groq Models (Fast inference)
  {
    id: 'openrouter/groq/llama-3.3-70b',
    provider: 'groq',
    name: 'llama-3.3-70b',
    displayName: 'Llama 3.3 70B (Groq)',
    description: 'Ultra-fast Llama inference on Groq hardware.',
    contextWindow: 128000,
    maxOutput: 8192,
    inputCost: 0.59,
    outputCost: 0.79,
    speed: 'instant',
    capabilities: ['chat', 'function_calling', 'streaming'],
  },
  
  // DeepSeek
  {
    id: 'openrouter/deepseek/deepseek-r1',
    provider: 'openrouter',
    name: 'deepseek-r1',
    displayName: 'DeepSeek R1',
    description: 'Advanced reasoning model with chain-of-thought.',
    contextWindow: 64000,
    maxOutput: 8192,
    inputCost: 0.55,
    outputCost: 2.19,
    speed: 'medium',
    capabilities: ['chat', 'streaming'],
  },
];

export const getModelById = (id: string): Model | undefined => {
  return MODELS.find(m => m.id === id);
};

export const getModelsByProvider = (provider: Model['provider']): Model[] => {
  return MODELS.filter(m => m.provider === provider);
};

export const getRecommendedModels = (): Model[] => {
  return MODELS.filter(m => m.recommended);
};

export const formatCost = (cost: number): string => {
  if (cost < 1) return `$${cost.toFixed(2)}/1M`;
  return `$${cost}/1M`;
};

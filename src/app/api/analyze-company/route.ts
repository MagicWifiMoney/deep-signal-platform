import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface AnalyzeRequest {
  url: string;
  name: string;
}

async function fetchWebsiteContent(url: string): Promise<string> {
  try {
    // Normalize URL
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DeepSignalBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status}`);
    }

    const html = await res.text();

    // Extract text content (basic HTML stripping)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 15000);

    return textContent;
  } catch (error) {
    console.error('Failed to fetch website:', error);
    return '';
  }
}

async function analyzeWithGemini(content: string, companyName: string): Promise<{
  description: string;
  icps: string[];
  suggestedTone: string;
  suggestedUseCase: string;
}> {
  if (!GEMINI_API_KEY) {
    console.error('No GEMINI_API_KEY configured');
    return {
      description: `${companyName} appears to be a business focused on serving customers effectively.`,
      icps: ['Small business owners', 'Enterprise decision makers', 'Industry professionals'],
      suggestedTone: 'professional',
      suggestedUseCase: 'Customer support and inquiry handling',
    };
  }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze this company's website content and provide:
1. A brief 2-3 sentence description of what the company does
2. 3-5 ideal customer profiles (ICPs) - who would benefit from their services
3. A suggested communication tone (professional, friendly, casual, or formal)
4. A suggested AI agent use case for this company

Company name: ${companyName}

Website content:
${content.substring(0, 8000)}

Respond in JSON format only, no markdown:
{
  "description": "...",
  "icps": ["ICP 1", "ICP 2", "ICP 3"],
  "suggestedTone": "professional",
  "suggestedUseCase": "..."
}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Gemini API error:', res.status, errorText);
      throw new Error('Gemini API error');
    }

    const data = await res.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        description: parsed.description || `${companyName} is a business serving customers.`,
        icps: parsed.icps || ['Business owners', 'Decision makers'],
        suggestedTone: parsed.suggestedTone || 'professional',
        suggestedUseCase: parsed.suggestedUseCase || 'Customer support',
      };
    }

    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Gemini analysis failed:', error);
    return {
      description: `${companyName} is a business serving customers in their industry.`,
      icps: ['Business owners', 'Decision makers', 'End customers'],
      suggestedTone: 'professional',
      suggestedUseCase: 'Customer support and inquiry handling',
    };
  }
}

export async function POST(request: Request) {
  try {
    const { url, name }: AnalyzeRequest = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Fetch website content
    const content = await fetchWebsiteContent(url);

    if (!content) {
      return NextResponse.json({
        description: `${name || 'This company'} serves customers in their market.`,
        icps: ['Small business owners', 'Enterprise clients', 'Individual consumers'],
        suggestedTone: 'professional',
        suggestedUseCase: 'Customer support and lead qualification',
      });
    }

    // Analyze with Gemini
    const analysis = await analyzeWithGemini(content, name || 'This company');

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analyze company error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze company' },
      { status: 500 }
    );
  }
}

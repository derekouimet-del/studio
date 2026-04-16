'use server';

/**
 * @fileOverview Coder flow that connects to Hugging Face's Qwen3-Coder model
 * to generate code based on user descriptions.
 */

export type CoderInput = {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
};

export type CoderOutput = {
  success: boolean;
  prompt: string;
  code: string;
  error?: string;
};

export async function coder(input: CoderInput): Promise<CoderOutput> {
  const { prompt, maxTokens = 2000, temperature = 0.2 } = input;

  // Basic validation
  if (!prompt || prompt.trim().length === 0) {
    return {
      success: false,
      prompt,
      code: '',
      error: 'Please describe what you want to build.',
    };
  }

  const HF_TOKEN = process.env.HF_TOKEN;

  if (!HF_TOKEN) {
    console.warn('[Coder] HF_TOKEN not set');
    return {
      success: false,
      prompt,
      code: '',
      error: 'HF_TOKEN environment variable is not configured. Please add your Hugging Face API token.',
    };
  }

  try {
    // Use Hugging Face Inference API directly
    const response = await fetch('https://api-inference.huggingface.co/models/Qwen/Qwen2.5-Coder-32B-Instruct/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen2.5-Coder-32B-Instruct',
        messages: [
          {
            role: 'system',
            content: 'You are an expert coding assistant. Provide clean, well-documented, production-ready code. Include comments explaining key sections. If the request is ambiguous, make reasonable assumptions and note them in comments.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Coder] API error:', response.status, errorText);
      
      if (response.status === 401) {
        return {
          success: false,
          prompt,
          code: '',
          error: 'Invalid HF_TOKEN. Please check your Hugging Face API token.',
        };
      }
      
      if (response.status === 429) {
        return {
          success: false,
          prompt,
          code: '',
          error: 'Rate limit exceeded. Please try again later.',
        };
      }

      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    const generatedCode = data.choices?.[0]?.message?.content || '';

    if (!generatedCode) {
      return {
        success: false,
        prompt,
        code: '',
        error: 'No code was generated. Please try a more detailed description.',
      };
    }

    return {
      success: true,
      prompt,
      code: generatedCode,
    };
  } catch (error) {
    console.error('[Coder] Error calling Hugging Face API:', error);

    return {
      success: false,
      prompt,
      code: '',
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

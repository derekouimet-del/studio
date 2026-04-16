'use server';

/**
 * @fileOverview Coder flow that connects to Hugging Face's Qwen3-Coder model
 * via the Novita provider to generate code based on user descriptions.
 */

import { InferenceClient } from '@huggingface/inference';

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
    // Use Hugging Face Inference Client with Novita provider (matching original Python code)
    const client = new InferenceClient({
      provider: 'novita',
      apiKey: HF_TOKEN,
    });

    const response = await client.chatCompletion({
      model: 'Qwen/Qwen3-Coder-480B-A35B-Instruct',
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
    });

    const generatedCode = response.choices?.[0]?.message?.content || '';

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

    // Provide more helpful error messages
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
      return {
        success: false,
        prompt,
        code: '',
        error: 'Invalid HF_TOKEN. Please check your Hugging Face API token.',
      };
    }
    
    if (errorMessage.includes('429') || errorMessage.includes('rate')) {
      return {
        success: false,
        prompt,
        code: '',
        error: 'Rate limit exceeded. Please try again later.',
      };
    }

    return {
      success: false,
      prompt,
      code: '',
      error: errorMessage,
    };
  }
}

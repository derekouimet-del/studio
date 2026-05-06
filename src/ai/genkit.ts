import { generateText, generateObject } from 'ai';
import Handlebars from 'handlebars';
import { z } from 'zod';

// Default model to use for all AI operations
const DEFAULT_MODEL = 'google/gemini-2.0-flash';

type GenerateOptions = {
  prompt: string;
  model?: string;
  config?: {
    responseModalities?: string[];
    speechConfig?: {
      voiceConfig?: {
        prebuiltVoiceConfig?: { voiceName: string };
      };
    };
  };
};

type GenerateResult = {
  text: string;
  media?: {
    url: string;
  };
};

type DefinePromptConfig<TInput extends z.ZodType, TOutput extends z.ZodType> = {
  name: string;
  input: { schema: TInput };
  output: { schema: TOutput };
  prompt: string;
};

type DefineFlowConfig<TInput extends z.ZodType, TOutput extends z.ZodType> = {
  name: string;
  inputSchema: TInput;
  outputSchema: TOutput;
};

export const ai = {
  /**
   * Generate text using the Vercel AI Gateway
   */
  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const { prompt, model = DEFAULT_MODEL, config } = options;

    // Handle TTS/audio requests specially (not yet supported via AI Gateway)
    if (config?.responseModalities?.includes('AUDIO')) {
      // For TTS, we need to use the Google AI API directly
      const apiKey = process.env.GOOGLE_GENAI_API_KEY;
      if (!apiKey) {
        throw new Error('GOOGLE_GENAI_API_KEY is required for TTS functionality');
      }

      const ttsModel = 'gemini-2.5-flash-preview-tts';
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${ttsModel}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: config.speechConfig,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TTS API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      
      if (audioData) {
        return {
          text: '',
          media: {
            url: `data:${audioData.mimeType};base64,${audioData.data}`,
          },
        };
      }

      throw new Error('No audio data returned from TTS API');
    }

    // Standard text generation via AI Gateway
    const result = await generateText({
      model,
      prompt,
    });

    return { text: result.text };
  },

  /**
   * Define a prompt with Handlebars templating and structured output
   */
  definePrompt<TInput extends z.ZodType, TOutput extends z.ZodType>(
    config: DefinePromptConfig<TInput, TOutput>
  ): (input: z.infer<TInput>) => Promise<{ output: z.infer<TOutput> | null }> {
    const template = Handlebars.compile(config.prompt);

    return async (input: z.infer<TInput>) => {
      const renderedPrompt = template(input);

      try {
        const result = await generateObject({
          model: DEFAULT_MODEL,
          schema: config.output.schema,
          prompt: renderedPrompt,
        });

        return { output: result.object as z.infer<TOutput> };
      } catch (error) {
        console.error(`Error in prompt ${config.name}:`, error);
        return { output: null };
      }
    };
  },

  /**
   * Define a flow (wrapper for typed async functions)
   */
  defineFlow<TInput extends z.ZodType, TOutput extends z.ZodType>(
    config: DefineFlowConfig<TInput, TOutput>,
    handler: (input: z.infer<TInput>) => Promise<z.infer<TOutput>>
  ): (input: z.infer<TInput>) => Promise<z.infer<TOutput>> {
    return handler;
  },
};

import { generateText } from 'ai';

export const ai = {
  async generate({ prompt }: { prompt: string }): Promise<{ text: string }> {
    const result = await generateText({
      model: 'google/gemini-2.0-flash',
      prompt,
    });
    return { text: result.text };
  },

  defineFlow<TInput, TOutput>(
    config: { name: string; inputSchema: any; outputSchema: any },
    handler: (input: TInput) => Promise<TOutput>
  ) {
    return handler;
  },
};

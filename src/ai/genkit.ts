import { generateObject } from 'ai';
import { z } from 'zod';

// Re-export z for compatibility with existing flows
export { z };

// AI helper that uses Vercel AI Gateway (no API key needed in v0)
export const ai = {
  generateObject: async <T extends z.ZodType>({
    model,
    schema,
    prompt,
  }: {
    model: string;
    schema: T;
    prompt: string;
  }): Promise<{ object: z.infer<T> }> => {
    const result = await generateObject({
      model: model as any,
      schema,
      prompt,
    });
    return { object: result.object };
  },
};

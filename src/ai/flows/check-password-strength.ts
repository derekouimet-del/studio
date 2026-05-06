'use server';

/**
 * @fileOverview This file defines a Genkit flow for checking password strength and similarity to breached passwords.
 *
 * - checkPasswordStrength - A function that analyzes a password.
 * - CheckPasswordStrengthInput - The input type for the function.
 * - CheckPasswordStrengthOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const CheckPasswordStrengthInputSchema = z.object({
  password: z.string().describe('The password to analyze.'),
});
export type CheckPasswordStrengthInput = z.infer<typeof CheckPasswordStrengthInputSchema>;

const CheckPasswordStrengthOutputSchema = z.object({
  isCommon: z.boolean().describe("True if the password is extremely common (like '123456' or 'password')."),
  strength: z.enum(['Weak', 'Medium', 'Strong', 'Very Strong']).describe('The assessed strength of the password.'),
  feedback: z.string().describe('Constructive feedback for improving the password.'),
  entropy: z.number().describe('Estimated bits of entropy for the password.'),
});
export type CheckPasswordStrengthOutput = z.infer<typeof CheckPasswordStrengthOutputSchema>;

export async function checkPasswordStrength(input: CheckPasswordStrengthInput): Promise<CheckPasswordStrengthOutput> {
  return checkPasswordStrengthFlow(input);
}

const prompt = ai.definePrompt({
  name: 'checkPasswordStrengthPrompt',
  input: {schema: CheckPasswordStrengthInputSchema},
  output: {schema: CheckPasswordStrengthOutputSchema},
  prompt: `You are a password security expert. Analyze the provided password.

Password: {{{password}}}

1.  **Assess Commonality (isCommon):** Is this an extremely common password (e.g., 'password', '123456', 'qwerty') or a very simple, easily guessable pattern? Be conservative; only return true for the most trivial passwords.
2.  **Estimate Entropy (entropy):** Calculate the estimated bits of entropy. A simple formula is (log2(character_pool_size) * length). Assume a character pool of 26 for all-lowercase, 52 for mixed case, 62 for alphanumeric, and 80+ for alphanumeric + symbols.
3.  **Assess Strength (strength):** Categorize the strength as 'Weak', 'Medium', 'Strong', or 'Very Strong' based on length, complexity (mix of character types), and entropy.
    - Weak: < 40 bits of entropy. Short, simple, common words.
    - Medium: 40-60 bits. Decent length or some complexity.
    - Strong: 60-100 bits. Long, complex, and unpredictable.
    - Very Strong: > 100 bits. Very long and highly random.
4.  **Provide Feedback (feedback):** Give concise, constructive advice on how to improve the password. Mention length, character variety, and avoiding predictable patterns.

Return the analysis in the specified JSON format.`,
});

const checkPasswordStrengthFlow = ai.defineFlow(
  {
    name: 'checkPasswordStrengthFlow',
    inputSchema: CheckPasswordStrengthInputSchema,
    outputSchema: CheckPasswordStrengthOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

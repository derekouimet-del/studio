/**
 * @fileOverview A Genkit flow that analyzes text content for sensitive data.
 * Enhanced with the high-performance rule-based secret classifier.
 *
 * - dataSieve - A function that takes text content and extracts sensitive information.
 * - DataSieveInput - The input type for the function.
 * - DataSieveOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { classifyText } from '@/lib/secret-classifier';

const DataSieveInputSchema = z.object({
  content: z.string().describe('The text content to analyze.'),
});
export type DataSieveInput = z.infer<typeof DataSieveInputSchema>;

const FoundDataSchema = z.object({
    id: z.string(),
    type: z.string().describe('The type of data found (e.g., "Email", "Credit Card", "SSN", "API Key", "Password").'),
    value: z.string().describe('The sensitive data value itself.'),
    context: z.string().describe('A small snippet of the surrounding text for context.').optional(),
    severity: z.enum(['info', 'low', 'medium', 'high', 'critical']).optional(),
});

const DataSieveOutputSchema = z.object({
  foundData: z.array(FoundDataSchema).describe('A list of discovered sensitive data.'),
});
export type DataSieveOutput = z.infer<typeof DataSieveOutputSchema>;

export async function dataSieve(input: DataSieveInput): Promise<DataSieveOutput> {
  return dataSieveFlow(input);
}

const analyzeNuancedLeaksPrompt = ai.definePrompt({
  name: 'analyzeNuancedLeaksPrompt',
  input: { schema: DataSieveInputSchema },
  output: { schema: DataSieveOutputSchema },
  prompt: `You are an advanced digital forensics agent named DataSieve. Your task is to find nuanced sensitive information that simple patterns might miss.

Focus on:
- Hardcoded credentials in code or configs (e.g., "const db_pass = '...'")
- Private SSH keys or certificates
- Mentions of internal secrets, environment variables, or tokens
- Personal Identifiable Information (PII) like SSNs or Credit Card numbers found in unstructured text

For each finding, provide:
1. A descriptive type
2. The full secret value
3. A snippet of context

Return a JSON object with a 'foundData' array.

Content to analyze:
---
{{{content}}}
---
`,
});


const dataSieveFlow = ai.defineFlow(
  {
    name: 'dataSieveFlow',
    inputSchema: DataSieveInputSchema,
    outputSchema: DataSieveOutputSchema,
  },
  async ({ content }) => {
    // Pass 1: Fast Rule-Based Classification (handles full content efficiently)
    const ruleFindings = classifyText(content);
    const rulesResults = ruleFindings.map((f, i) => ({
        id: `rule-${i}`,
        type: f.type,
        value: f.value,
        context: f.evidence,
        severity: f.severity,
    }));

    // Pass 2: Nuanced AI Discovery
    // AI pass is limited to prevent tokens/timeout issues, while Rule pass covers the whole file.
    const AI_LIMIT = 50000; 
    const aiContent = content.length > AI_LIMIT ? content.substring(0, AI_LIMIT) : content;
    
    let aiResults: any[] = [];
    try {
        const { output } = await analyzeNuancedLeaksPrompt({ content: aiContent });
        if (output?.foundData) {
            aiResults = output.foundData.map((d, i) => ({
                ...d,
                id: `ai-${i}`,
                severity: d.severity || 'medium'
            }));
        }
    } catch (e) {
        console.error("AI Sieve pass failed:", e);
    }

    // Merge and deduplicate by value
    const merged = [...rulesResults, ...aiResults];
    const uniqueMap = new Map();
    merged.forEach(item => {
        if (!uniqueMap.has(item.value)) {
            uniqueMap.set(item.value, item);
        }
    });

    return { foundData: Array.from(uniqueMap.values()) };
  }
);

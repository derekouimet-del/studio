'use server';

/**
 * @fileOverview A Genkit flow that performs a network port scan on a target.
 *
 * - networkScan - A function that takes a target and returns open ports and services.
 * - NetworkScanInput - The input type for the function.
 * - NetworkScanOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { runLlamaTool } from '@/ai/flows/run-llama-tool';

const PortScanResultSchema = z.object({
  host: z.string().describe('The IP address of the scanned host.'),
  port: z.number().describe('The port number.'),
  service: z.string().describe('The service name running on the port.'),
  version: z.string().describe('The version of the service.'),
  status: z.enum(['Open', 'Closed', 'Filtered']).describe('The status of the port.'),
});
export type PortScanResult = z.infer<typeof PortScanResultSchema>;

const NetworkScanInputSchema = z.object({
  target: z.string().describe('The IP address, domain, or CIDR range to scan.'),
});
export type NetworkScanInput = z.infer<typeof NetworkScanInputSchema>;

const NetworkScanOutputSchema = z.object({
  results: z.array(PortScanResultSchema).describe('A list of discovered open ports and services.'),
});
export type NetworkScanOutput = z.infer<typeof NetworkScanOutputSchema>;

export async function networkScan(input: NetworkScanInput): Promise<NetworkScanOutput> {
  return networkScanFlow(input);
}

const networkScanFlow = ai.defineFlow(
  {
    name: 'networkScanFlow',
    inputSchema: NetworkScanInputSchema,
    outputSchema: NetworkScanOutputSchema,
  },
  async ({ target }) => {
    // This flow assumes that a tool named 'portScan' is available on the self-hosted Llama instance.
    // The tool should accept a 'target' string and return an array of objects matching the PortScanResultSchema.
    const llamaResponse = await runLlamaTool({
      toolName: 'portScan',
      payload: { target },
    });

    if (!llamaResponse.ok || !llamaResponse.result) {
      throw new Error(llamaResponse.error || 'Failed to run network scan via Llama bridge tool.');
    }

    // The result from the Llama tool should be an array of PortScanResult objects.
    const validation = z.array(PortScanResultSchema).safeParse(llamaResponse.result);

    if (!validation.success) {
        console.error("Llama 'portScan' tool returned unexpected format:", validation.error);
        throw new Error('The network scan tool returned data in an unexpected format.');
    }

    return { results: validation.data };
  }
);

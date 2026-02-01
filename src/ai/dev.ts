import { config } from 'dotenv';
config();

import '@/ai/flows/vulnerability-assessment.ts';
import '@/ai/flows/exploit-suggestion.ts';
import '@/ai/flows/web-crawler.ts';
import '@/ai/flows/wordlist-suggestion.ts';
import '@/ai/flows/agent-chat.ts';
import '@/ai/flows/nmap-suggestion.ts';

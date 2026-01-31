import { config } from 'dotenv';
config();

import '@/ai/flows/vulnerability-assessment.ts';
import '@/ai/flows/exploit-suggestion.ts';
import '@/ai/flows/web-crawler.ts';
import '@/ai/flows/wordlist-suggestion.ts';

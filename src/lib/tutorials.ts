export type Tutorial = {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string; // Markdown-like content
};

export const tutorials: Tutorial[] = [
  {
    id: 'nmap-intro',
    title: 'Intro to Network Scanning',
    category: 'Reconnaissance',
    description: 'Learn the fundamentals of network scanning with nmap, the industry-standard tool for network discovery and security auditing.',
    content: `
## What is Nmap?

Nmap ("Network Mapper") is a free and open-source utility for network discovery and security auditing. Many systems and network administrators also find it useful for tasks such as network inventory, managing service upgrade schedules, and monitoring host or service uptime.

Our own "Network Scan" and "ScanWeaver" tools are heavily inspired by and built upon the concepts pioneered by Nmap.

---

## Basic Scan Types

There are many different scan types in Nmap. Here are a few of the most common ones.

### TCP SYN Scan (-sS)
This is the default and most popular scan option for good reasons. It can be performed quickly, scanning thousands of ports per second on a fast network not hampered by intrusive firewalls. It is also relatively unobtrusive and stealthy since it never completes TCP connections.
Example: \`nmap -sS scanme.nmap.org\`

### TCP Connect Scan (-sT)
This is the default TCP scan type when SYN scan is not an option. This is the case, for example, when a user does not have raw packet privileges. Instead of writing raw packets as most other scan types do, Nmap asks the underlying operating system to establish a connection with the target machine and port by issuing the connect system call.
Example: \`nmap -sT scanme.nmap.org\`

---

## Host Discovery (-sn)

Sometimes, you don't need to know every open port, you just want to know which hosts on a network are online. This is what a "ping scan" is for.

The -sn flag tells Nmap not to do a port scan after host discovery.
Example: \`nmap -sn 192.168.1.0/24\`

---

## Service and Version Detection (-sV)

While port scanning is useful, knowing what service and what version of that service is running can be even more valuable. This information can help you identify potential vulnerabilities.

The -sV flag enables version detection, which will try to determine the service protocol, application name, version number, etc.
Example: \`nmap -sV -p 22,80,443 scanme.nmap.org\`

---

## OS Detection (-O)

Nmap can also attempt to determine the operating system of the target host. It uses various techniques to analyze the TCP/IP stack of the target.
Example: \`nmap -O scanme.nmap.org\`

---

## Using ScanWeaver in Pen-Quest

The ScanWeaver tool allows you to generate these complex nmap commands using natural language. Instead of remembering all the flags, you can simply ask:
"Run a stealth scan on 192.168.1.10, and try to figure out the OS and service versions."
ScanWeaver will translate this into the correct nmap command for you.
`
  },
  {
    id: 'google-dorking',
    title: 'Mastering Google Dorking',
    category: 'OSINT',
    description: 'Leverage advanced Google search operators to uncover hidden information, vulnerabilities, and exposed assets.',
    content: `
## What is Google Dorking?

Google dorking, also known as Google hacking, is a technique that uses advanced search operators to find information that is not readily available on a website. It can help you uncover vulnerabilities, hidden files, and other sensitive data.

The "Google Recon" tool in Pen-Quest automates the creation of these dorks for a specific target.

---

## Key Dorking Operators

### site:
Restricts your search to a specific website.
Example: \`site:example.com\`

### inurl:
Searches for specific text within a URL.
Example: \`site:example.com inurl:login\`

### intitle:
Searches for specific text in the title of a page.
Example: \`site:example.com intitle:"admin dashboard"\`

### filetype:
Searches for specific file extensions. This is extremely useful for finding exposed documents.
Example: \`site:example.com filetype:pdf\`
Common types to search for: pdf, docx, xlsx, pptx, log, txt, env, config

### intext:
Searches for specific text within the content of a page.
Example: \`site:example.com intext:"DB_PASSWORD"\`

---

## Practical Examples

### Finding Login Pages
\`site:example.com intitle:"login" | inurl:login\`

### Finding Exposed Documents
\`site:example.com filetype:pdf intext:"internal use only"\`

### Finding Directory Listings
\`site:example.com intitle:"index of"\`

### Finding Exposed Configuration Files
\`site:example.com filetype:env\`

---

## Using the Google Recon Tool

Manually crafting these queries can be tedious. The Google Recon tool in Pen-Quest generates a comprehensive list of dorks tailored to your target domain, covering categories like login portals, exposed documents, config files, and potential vulnerabilities. This allows you to quickly launch these targeted searches and accelerate your open-source intelligence (OSINT) gathering phase.
`
  },
    {
    id: 'wordlists',
    title: 'Building Effective Wordlists',
    category: 'Cracking',
    description: 'Learn the art and science of creating custom wordlists for more successful password cracking attempts.',
    content: `
## Why Custom Wordlists?

While generic wordlists like 'rockyou.txt' are a good starting point, they often fail against targets who use more personalized passwords. A custom wordlist, tailored to the target organization or individual, dramatically increases the chances of a successful dictionary attack.

The "WordForge" tool is designed to help you create, manipulate, and enhance these custom wordlists.

---

## Information Gathering

The first step is to gather information about your target. Think about:
- Company name and variations
- Product names, codenames
- Employee names, family names, pet names
- Hobbies, interests, favorite sports teams
- Important dates (founding date, birthdays)
- Location-specific terms (street names, local landmarks)

The more information you gather, the better your wordlist will be. Use our "Web Crawler" and "Google Recon" tools to assist in this phase.

---

## Using WordForge

WordForge provides several tools to turn your raw information into a powerful wordlist.

### 1. AI Suggestions
Don't know where to start? Use the AI Suggestions feature. Provide a topic like the company's name ("Acme Corp") or a target's hobby ("rock climbing"), and the AI will generate a list of related keywords.

### 2. Manipulation Tools
Once you have a base list, you need to apply mutations. This is where WordForge shines.
- **Capitalization:** Add variations like 'Password', 'password', 'PASSWORD'.
- **Affixes:** Add common prefixes or suffixes (e.g., add '!' or '2024' to the end of every word).
- **Leet Speak:** Convert words to "1337" speak (e.g., 'password' -> 'p455w0rd').
- **Trim by Length:** Remove passwords that don't meet an application's length requirements.
- **Remove Duplicates:** Keep your list clean and efficient.

### 3. Auto-Enhance
For maximum efficiency, use the "Auto-Enhance" feature. With one click, it applies a smart combination of the most common and effective mutations to your wordlist, massively expanding it in seconds.

---

## The Process

1.  Start with a base list of keywords from your information gathering phase or from the AI suggestions.
2.  Use the manipulation tools to add common variations. Appending variations is usually better than replacing.
3.  Run the "Remove Duplicates" tool to clean up the list.
4.  Download your new, powerful custom wordlist and use it in your password cracking tools.
`
  },
];

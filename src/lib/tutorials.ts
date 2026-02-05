
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
  {
    id: 'metasploit-primer',
    title: 'A Practical Guide to Metasploit',
    category: 'Exploitation',
    description: 'A step-by-step guide to using the Metasploit Framework for vulnerability scanning and exploitation in a lab environment.',
    content: `
## What is Metasploit?

The Metasploit Framework is the world's most used penetration testing framework. It's a powerful tool that provides information about security vulnerabilities and aids in developing and executing exploit code against a target machine.

You'll typically interact with Metasploit through its command-line interface, \`msfconsole\`.

---

## Phase 1: Information Gathering

Before you can attack, you must gather intelligence. Metasploit can integrate directly with Nmap to scan targets and store the results in its database. This is the first and most crucial step.

**1. Launch Metasploit**
Open your terminal and start the Metasploit console:
\`msfconsole\`

**2. Scan Your Target**
Once inside msfconsole, you can run Nmap directly. The \`db_nmap\` command runs an Nmap scan and saves the output to Metasploit's database. For this tutorial, we'll assume our target is a virtual machine with the IP \`10.0.2.15\`.

\`db_nmap -A -v 10.0.2.15\`

The \`-A\` flag enables OS detection, version detection, script scanning, and traceroute. After the scan, you can view the discovered hosts and services.

\`hosts\`
\`services\`

---

## Phase 2: Finding an Exploit

Let's say your Nmap scan found an FTP server running "vsftpd 2.3.4" on port 21. This specific version is famously vulnerable.

Our "VulnDB Explorer" can help identify CVEs, and Metasploit has a built-in search function to find a matching exploit module.

**1. Search for a relevant exploit:**
\`search vsftpd\`

Metasploit will show you a list of matching modules. You'll see one named \`exploit/unix/ftp/vsftpd_234_backdoor\`. This is what we're looking for.

---

## Phase 3: Exploitation

Now that you have a target and an exploit module, it's time to configure and launch the attack.

**1. Select the Exploit**
Use the \`use\` command followed by the name of the exploit module.
\`use exploit/unix/ftp/vsftpd_234_backdoor\`

Your command prompt will change to show you're now in the context of this exploit.

**2. View Options**
Every exploit has options you need to configure. The most important one is \`RHOSTS\`, which stands for "Remote Hosts" (your target's IP).
\`show options\`

**3. Set the Target**
Set the RHOSTS option to your target's IP address.
\`set RHOSTS 10.0.2.15\`

**4. Run the Exploit**
With the options set, all that's left is to run the exploit.
\`exploit\`

If successful, Metasploit will tell you "Command shell session 1 opened". This means you have successfully compromised the target machine and have a remote shell! You can now run commands on the target machine as if you were sitting in front of it.

To interact with your new session, type:
\`sessions -i 1\`

---

## Ethical Considerations

This tutorial is for educational purposes and should ONLY be performed on systems you own or have explicit permission to test, such as sandboxed environments like Metasploitable 2. Unauthorized access to computer systems is illegal.
`
  },
  {
    id: 'sqlmap-tutorial',
    title: 'Automating SQL Injection with SQLMap',
    category: 'Exploitation',
    description: 'A comprehensive guide to using sqlmap, the premier open-source tool for detecting and exploiting SQL injection vulnerabilities.',
    content: `
## What is SQLMap?

SQLMap is an open-source penetration testing tool that automates the process of detecting and exploiting SQL injection flaws and taking over of database servers. It comes with a powerful detection engine, numerous niche features for the ultimate penetration tester, and a broad range of switches lasting from database fingerprinting, over data fetching from the database, to accessing the underlying file system and executing commands on the operating system via out-of-band connections.

---

## Phase 1: Finding an Injection Point

The first step is to find a URL parameter that might be vulnerable. Look for URLs like \`index.php?id=1\`, \`products.php?category=2\`, etc. For this tutorial, we'll use a publicly available test site.

**The Target URL:** \`http://testphp.vulnweb.com/listproducts.php?cat=1\`

**1. Basic Test**
SQLMap can start by simply testing this URL. The \`-u\` flag is used to specify the URL.
\`sqlmap -u "http://testphp.vulnweb.com/listproducts.php?cat=1"\`

SQLMap will ask you a few questions. It might ask if you want to follow redirects or test other parameters. You can often accept the default answers (by pressing Enter). It will then perform a series of tests to confirm the injection.

---

## Phase 2: Enumeration (Information Gathering)

Once SQLMap confirms a vulnerability, it's time to find out what's inside the database.

**1. List Databases**
The \`--dbs\` switch will enumerate all the databases the current user has access to.
\`sqlmap -u "http://testphp.vulnweb.com/listproducts.php?cat=1" --dbs\`

You might see databases like \`information_schema\` and \`acuart\`. The latter looks interesting.

**2. List Tables**
Now, let's see what tables are inside the \`acuart\` database. Use the \`-D\` flag to specify the database and \`--tables\` to list its tables.
\`sqlmap -u "http://testphp.vulnweb.com/listproducts.php?cat=1" -D acuart --tables\`

This might reveal tables like \`users\`, \`products\`, \`artists\`, etc. The \`users\` table is a high-value target.

**3. List Columns**
Let's inspect the columns of the \`users\` table. Use the \`-T\` flag for the table and \`--columns\`.
\`sqlmap -u "http://testphp.vulnweb.com/listproducts.php?cat=1" -D acuart -T users --columns\`

This could show columns like \`uname\`, \`pass\`, \`email\`, \`cc\`.

---

## Phase 3: Exploitation (Dumping Data)

Now that you know the structure, you can extract the data.

**1. Dump Table Contents**
The \`--dump\` flag is used to get all the data from a table. SQLMap will also ask if you want to crack any password hashes it finds.
\`sqlmap -u "http://testphp.vulnweb.com/listproducts.php?cat=1" -D acuart -T users --dump\`

This command will dump the contents of the \`users\` table, giving you usernames, password hashes, and other sensitive information.

---

## Advanced Exploitation: Getting a Shell

If the database user has sufficient privileges and the conditions are right, SQLMap can even give you an interactive shell on the operating system.

**1. Get an OS Shell**
The \`--os-shell\` command attempts to upload a small web shell to the server and use it to execute commands. This is one of the most powerful features of SQLMap.
\`sqlmap -u "http://testphp.vulnweb.com/listproducts.php?cat=1" --os-shell\`

SQLMap will ask for the language of the web application and the writable directory on the server. You may need to guess or find this information through other means. If successful, you will get a prompt where you can execute system commands.

---

## Ethical Considerations

SQLMap is an incredibly powerful and aggressive tool. It should **NEVER** be used on systems you do not have explicit, written permission to test. Unauthorized use of SQLMap is illegal and will be detected by most modern security systems. Always practice in safe, sandboxed environments like the one used in this tutorial or DVWA (Damn Vulnerable Web Application).
`
  }
];

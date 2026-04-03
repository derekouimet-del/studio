#!/usr/bin/env python3
"""
PenQuest Scanner Service
========================
A comprehensive API wrapper for network reconnaissance tools.

Capabilities:
  - Port scanning via nmap
  - Subdomain enumeration via subfinder/amass/dns
  - Technology fingerprinting via nmap scripts and banner grabbing
  - SSL certificate analysis
  - CVE matching via local database

Setup:
  1. Install dependencies: pip3 install flask flask-cors requests dnspython
  2. Install tools: sudo apt install nmap subfinder amass
  3. Run: python3 penquest-scanner-service.py --port 11435
  4. Port forward 11435 through your router/firewall
  5. Set SCANNER_API_URL=http://your-server:11435 in PenQuest

Security Notes:
  - This service executes system commands - only expose to trusted networks
  - Consider adding API key authentication for production use
  - Rate limiting is built-in to prevent abuse
"""

import subprocess
import json
import re
import argparse
import time
import socket
import ssl
import threading
from datetime import datetime
from functools import wraps
from concurrent.futures import ThreadPoolExecutor, as_completed
from flask import Flask, request, jsonify
from flask_cors import CORS

try:
    import dns.resolver
    DNS_AVAILABLE = True
except ImportError:
    DNS_AVAILABLE = False
    print("[Warning] dnspython not installed. DNS enumeration will be limited.")

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    print("[Warning] requests not installed. Some features will be limited.")

app = Flask(__name__)
CORS(app)

# Rate limiting
request_times = {}
RATE_LIMIT_SECONDS = 2

# API Key (optional)
API_KEY = None

# Common subdomains for brute force
COMMON_SUBDOMAINS = [
    'www', 'mail', 'ftp', 'localhost', 'webmail', 'smtp', 'pop', 'ns1', 'ns2',
    'dns', 'dns1', 'dns2', 'mx', 'mx1', 'mx2', 'blog', 'dev', 'staging', 'test',
    'api', 'app', 'admin', 'portal', 'vpn', 'remote', 'secure', 'shop', 'store',
    'support', 'help', 'forum', 'wiki', 'docs', 'status', 'monitor', 'git',
    'gitlab', 'jenkins', 'ci', 'cd', 'demo', 'beta', 'alpha', 'prod', 'production',
    'stage', 'uat', 'qa', 'internal', 'intranet', 'extranet', 'cloud', 'aws',
    'azure', 'gcp', 'cdn', 'static', 'assets', 'media', 'images', 'img', 'files',
    'download', 'upload', 'backup', 'db', 'database', 'mysql', 'postgres', 'redis',
    'elastic', 'kibana', 'grafana', 'prometheus', 'auth', 'login', 'sso', 'oauth',
    'm', 'mobile', 'wap', 'ssl', 'cpanel', 'whm', 'webmin', 'panel', 'dashboard'
]

# Technology signatures for fingerprinting
TECH_SIGNATURES = {
    'nginx': {'headers': ['server: nginx'], 'body': []},
    'apache': {'headers': ['server: apache'], 'body': []},
    'iis': {'headers': ['server: microsoft-iis'], 'body': []},
    'cloudflare': {'headers': ['server: cloudflare', 'cf-ray'], 'body': []},
    'wordpress': {'headers': [], 'body': ['wp-content', 'wp-includes', 'wordpress']},
    'drupal': {'headers': ['x-drupal'], 'body': ['drupal', 'sites/default']},
    'joomla': {'headers': [], 'body': ['joomla', '/media/jui/']},
    'react': {'headers': [], 'body': ['react', '_reactroot', 'react-dom']},
    'angular': {'headers': [], 'body': ['ng-version', 'angular']},
    'vue': {'headers': [], 'body': ['vue', '__vue__']},
    'jquery': {'headers': [], 'body': ['jquery']},
    'bootstrap': {'headers': [], 'body': ['bootstrap']},
    'php': {'headers': ['x-powered-by: php'], 'body': []},
    'asp.net': {'headers': ['x-powered-by: asp.net', 'x-aspnet-version'], 'body': []},
    'java': {'headers': ['x-powered-by: servlet', 'x-powered-by: jsp'], 'body': []},
    'nodejs': {'headers': ['x-powered-by: express'], 'body': []},
    'python': {'headers': ['server: gunicorn', 'server: uvicorn', 'server: waitress'], 'body': []},
    'laravel': {'headers': ['set-cookie: laravel_session'], 'body': []},
    'django': {'headers': ['set-cookie: csrftoken', 'set-cookie: django'], 'body': []},
    'rails': {'headers': ['x-powered-by: phusion', 'set-cookie: _rails'], 'body': []},
}

# CVE database (simplified - in production, use NVD API or local DB)
CVE_DATABASE = {
    'apache/2.4.49': [{'id': 'CVE-2021-41773', 'cvss': 7.5, 'description': 'Path traversal vulnerability'}],
    'apache/2.4.50': [{'id': 'CVE-2021-42013', 'cvss': 9.8, 'description': 'Path traversal and RCE'}],
    'nginx/1.16': [{'id': 'CVE-2019-20372', 'cvss': 5.3, 'description': 'HTTP request smuggling'}],
    'openssh/7.': [{'id': 'CVE-2018-15473', 'cvss': 5.3, 'description': 'User enumeration'}],
    'openssh/8.0': [{'id': 'CVE-2020-15778', 'cvss': 6.8, 'description': 'Command injection via scp'}],
    'proftpd/1.3.5': [{'id': 'CVE-2019-12815', 'cvss': 9.8, 'description': 'Arbitrary file copy'}],
    'vsftpd/2.3.4': [{'id': 'CVE-2011-2523', 'cvss': 10.0, 'description': 'Backdoor command execution'}],
    'mysql/5.7': [{'id': 'CVE-2020-14812', 'cvss': 4.9, 'description': 'Server crash vulnerability'}],
    'php/7.4': [{'id': 'CVE-2020-7068', 'cvss': 3.6, 'description': 'Use-after-free vulnerability'}],
    'wordpress': [{'id': 'CVE-2022-21661', 'cvss': 7.5, 'description': 'SQL injection via WP_Query'}],
    'jquery/1.': [{'id': 'CVE-2020-11022', 'cvss': 6.1, 'description': 'XSS vulnerability'}],
    'jquery/2.': [{'id': 'CVE-2020-11022', 'cvss': 6.1, 'description': 'XSS vulnerability'}],
}


def rate_limit(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        client_ip = request.remote_addr
        now = time.time()
        if client_ip in request_times:
            elapsed = now - request_times[client_ip]
            if elapsed < RATE_LIMIT_SECONDS:
                return jsonify({
                    "success": False,
                    "error": f"Rate limited. Wait {RATE_LIMIT_SECONDS - int(elapsed)} seconds."
                }), 429
        request_times[client_ip] = now
        return f(*args, **kwargs)
    return decorated


def check_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if API_KEY is not None:
            provided_key = request.headers.get("X-API-Key") or request.args.get("api_key")
            if provided_key != API_KEY:
                return jsonify({"success": False, "error": "Invalid or missing API key"}), 401
        return f(*args, **kwargs)
    return decorated


def sanitize_target(target: str) -> str:
    """Sanitize target to prevent command injection."""
    if not re.match(r'^[a-zA-Z0-9.\-:/]+$', target):
        raise ValueError("Invalid target format")
    blocked = ['127.0.0.1', 'localhost', '0.0.0.0', '::1']
    if any(b in target.lower() for b in blocked):
        raise ValueError("Scanning localhost is not allowed")
    return target


def sanitize_ports(ports: str) -> str:
    """Sanitize port specification."""
    if not ports:
        return None
    if not re.match(r'^[\d,\-]+$', ports):
        raise ValueError("Invalid port format")
    return ports


def resolve_domain(domain: str) -> list:
    """Resolve domain to IP addresses."""
    ips = []
    try:
        results = socket.getaddrinfo(domain, None)
        ips = list(set([r[4][0] for r in results]))
    except socket.gaierror:
        pass
    return ips


def check_subdomain(subdomain: str, domain: str) -> dict:
    """Check if a subdomain exists."""
    full_domain = f"{subdomain}.{domain}"
    try:
        ips = resolve_domain(full_domain)
        if ips:
            return {
                "subdomain": full_domain,
                "ips": ips,
                "status": "active"
            }
    except Exception:
        pass
    return None


def enumerate_subdomains_dns(domain: str, wordlist: list = None) -> list:
    """Enumerate subdomains using DNS brute force."""
    subdomains = []
    wordlist = wordlist or COMMON_SUBDOMAINS
    
    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(check_subdomain, sub, domain): sub for sub in wordlist}
        for future in as_completed(futures, timeout=60):
            try:
                result = future.result()
                if result:
                    subdomains.append(result)
            except Exception:
                pass
    
    return subdomains


def enumerate_subdomains_subfinder(domain: str) -> list:
    """Use subfinder for subdomain enumeration."""
    subdomains = []
    try:
        result = subprocess.run(
            ['subfinder', '-d', domain, '-silent', '-timeout', '30'],
            capture_output=True, text=True, timeout=60
        )
        if result.returncode == 0:
            for line in result.stdout.strip().split('\n'):
                if line:
                    ips = resolve_domain(line)
                    subdomains.append({
                        "subdomain": line,
                        "ips": ips,
                        "status": "active" if ips else "unresolved",
                        "source": "subfinder"
                    })
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass
    return subdomains


def get_ssl_info(host: str, port: int = 443) -> dict:
    """Get SSL certificate information."""
    try:
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        
        with socket.create_connection((host, port), timeout=10) as sock:
            with context.wrap_socket(sock, server_hostname=host) as ssock:
                cert = ssock.getpeercert(binary_form=True)
                
                # Parse certificate using openssl
                proc = subprocess.run(
                    ['openssl', 'x509', '-inform', 'DER', '-noout', '-text'],
                    input=cert, capture_output=True, timeout=10
                )
                cert_text = proc.stdout.decode('utf-8', errors='ignore')
                
                # Extract key info
                info = {
                    "valid": True,
                    "port": port,
                    "issuer": None,
                    "subject": None,
                    "not_before": None,
                    "not_after": None,
                    "san": [],
                    "serial": None
                }
                
                for line in cert_text.split('\n'):
                    line = line.strip()
                    if 'Issuer:' in line:
                        info["issuer"] = line.replace('Issuer:', '').strip()
                    elif 'Subject:' in line and 'Subject Public Key' not in line:
                        info["subject"] = line.replace('Subject:', '').strip()
                    elif 'Not Before:' in line:
                        info["not_before"] = line.replace('Not Before:', '').strip()
                    elif 'Not After :' in line:
                        info["not_after"] = line.replace('Not After :', '').strip()
                    elif 'Serial Number:' in line:
                        info["serial"] = line.replace('Serial Number:', '').strip()
                    elif 'DNS:' in line:
                        dns_names = re.findall(r'DNS:([^\s,]+)', line)
                        info["san"].extend(dns_names)
                
                return info
    except Exception as e:
        return {"valid": False, "error": str(e)}


def fingerprint_http(host: str, port: int = 80, use_ssl: bool = False) -> dict:
    """Fingerprint HTTP service for technologies."""
    technologies = []
    
    if not REQUESTS_AVAILABLE:
        return {"technologies": [], "error": "requests module not available"}
    
    try:
        protocol = "https" if use_ssl or port == 443 else "http"
        url = f"{protocol}://{host}:{port}"
        
        response = requests.get(url, timeout=10, verify=False, allow_redirects=True)
        headers_lower = {k.lower(): v.lower() for k, v in response.headers.items()}
        body_lower = response.text.lower()[:50000]  # Limit body size
        
        for tech, signatures in TECH_SIGNATURES.items():
            detected = False
            version = None
            
            # Check headers
            for header_sig in signatures['headers']:
                for header_name, header_value in headers_lower.items():
                    if header_sig.lower() in f"{header_name}: {header_value}":
                        detected = True
                        # Try to extract version
                        version_match = re.search(r'[\d.]+', header_value)
                        if version_match:
                            version = version_match.group()
                        break
            
            # Check body
            if not detected:
                for body_sig in signatures['body']:
                    if body_sig.lower() in body_lower:
                        detected = True
                        break
            
            if detected:
                technologies.append({
                    "name": tech,
                    "version": version,
                    "confidence": "high" if version else "medium"
                })
        
        # Server header
        if 'server' in headers_lower:
            server = headers_lower['server']
            technologies.append({
                "name": "server",
                "version": server,
                "confidence": "high"
            })
        
        return {
            "technologies": technologies,
            "status_code": response.status_code,
            "title": re.search(r'<title>([^<]+)</title>', response.text, re.I).group(1) if re.search(r'<title>([^<]+)</title>', response.text, re.I) else None
        }
    except Exception as e:
        return {"technologies": [], "error": str(e)}


def match_cves(service: str, version: str = None) -> list:
    """Match service/version against CVE database."""
    cves = []
    service_lower = service.lower()
    
    for key, vulns in CVE_DATABASE.items():
        key_parts = key.lower().split('/')
        if key_parts[0] in service_lower:
            if len(key_parts) == 1:
                cves.extend(vulns)
            elif version and key_parts[1] in version.lower():
                cves.extend(vulns)
    
    return cves


def parse_nmap_output(output: str, target: str) -> dict:
    """Parse nmap output into structured JSON."""
    result = {
        "target": target,
        "timestamp": datetime.now().isoformat(),
        "scan_complete": True,
        "hosts": []
    }
    
    current_host = None
    
    for line in output.split('\n'):
        line = line.strip()
        
        if 'Nmap scan report for' in line:
            if current_host:
                result["hosts"].append(current_host)
            
            match = re.search(r'for\s+(\S+)(?:\s+\(([^)]+)\))?', line)
            if match:
                hostname = match.group(1)
                ip = match.group(2) or hostname
                current_host = {
                    "hostname": hostname,
                    "ip": ip,
                    "status": "up",
                    "ports": [],
                    "os": None
                }
        
        elif 'Host is up' in line:
            if current_host:
                latency_match = re.search(r'\(([^)]+)\s*latency\)', line)
                if latency_match:
                    current_host["latency"] = latency_match.group(1)
        
        elif re.match(r'^\d+/(tcp|udp)', line):
            parts = line.split()
            if len(parts) >= 3 and current_host:
                port_proto = parts[0].split('/')
                service_name = parts[2] if len(parts) > 2 else "unknown"
                version = " ".join(parts[3:]) if len(parts) > 3 else None
                
                port_info = {
                    "port": int(port_proto[0]),
                    "protocol": port_proto[1],
                    "state": parts[1],
                    "service": service_name,
                    "version": version,
                    "cves": match_cves(service_name, version)
                }
                current_host["ports"].append(port_info)
        
        elif 'OS details:' in line or 'Running:' in line:
            if current_host:
                os_match = re.search(r'(?:OS details:|Running:)\s*(.+)', line)
                if os_match:
                    current_host["os"] = os_match.group(1).strip()
        
        elif 'MAC Address:' in line:
            if current_host:
                mac_match = re.search(r'MAC Address:\s*([^\s]+)', line)
                if mac_match:
                    current_host["mac"] = mac_match.group(1)
    
    if current_host:
        result["hosts"].append(current_host)
    
    result["summary"] = {
        "hosts_up": len([h for h in result["hosts"] if h["status"] == "up"]),
        "total_open_ports": sum(len([p for p in h["ports"] if p["state"] == "open"]) for h in result["hosts"])
    }
    
    return result


# ============== API ENDPOINTS ==============

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    tools = {}
    
    # Check nmap
    try:
        result = subprocess.run(['nmap', '--version'], capture_output=True, text=True, timeout=5)
        tools['nmap'] = result.stdout.split('\n')[0] if result.returncode == 0 else "not found"
    except Exception:
        tools['nmap'] = "not installed"
    
    # Check subfinder
    try:
        result = subprocess.run(['subfinder', '-version'], capture_output=True, text=True, timeout=5)
        tools['subfinder'] = "installed"
    except Exception:
        tools['subfinder'] = "not installed"
    
    # Check openssl
    try:
        result = subprocess.run(['openssl', 'version'], capture_output=True, text=True, timeout=5)
        tools['openssl'] = result.stdout.strip() if result.returncode == 0 else "not found"
    except Exception:
        tools['openssl'] = "not installed"
    
    tools['dnspython'] = "installed" if DNS_AVAILABLE else "not installed"
    tools['requests'] = "installed" if REQUESTS_AVAILABLE else "not installed"
    
    return jsonify({
        "status": "healthy",
        "service": "penquest-scanner",
        "version": "2.0.0",
        "tools": tools,
        "timestamp": datetime.now().isoformat()
    })


@app.route('/scan', methods=['POST'])
@check_api_key
@rate_limit
def scan():
    """Perform an nmap scan."""
    try:
        data = request.get_json()
        if not data or 'target' not in data:
            return jsonify({"success": False, "error": "Missing 'target' in request body"}), 400
        
        target = sanitize_target(data['target'])
        ports = sanitize_ports(data.get('ports', ''))
        scan_type = data.get('scan_type', 'quick')
        options = data.get('options', {})
        
        cmd = ['nmap']
        
        if scan_type == 'quick':
            cmd.extend(['-T4', '-F'])
        elif scan_type == 'standard':
            cmd.extend(['-T3', '-p', '1-1000'])
        elif scan_type == 'deep':
            cmd.extend(['-T3', '-p-'])
        elif scan_type == 'stealth':
            cmd.extend(['-sS', '-T2'])
        
        if ports:
            cmd = [c for c in cmd if not c.startswith('-p') and c != '-F']
            cmd.extend(['-p', ports])
        
        if options.get('service_detection'):
            cmd.append('-sV')
        if options.get('os_detection'):
            cmd.append('-O')
        if options.get('script_scan'):
            cmd.append('-sC')
        
        cmd.append(target)
        
        print(f"[PenQuest Scanner] Executing: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0 or result.stdout:
            parsed = parse_nmap_output(result.stdout, target)
            return jsonify({
                "success": True,
                "data": parsed,
                "raw_output": result.stdout,
                "command": ' '.join(cmd)
            })
        else:
            return jsonify({
                "success": False,
                "error": result.stderr or "Scan failed with no output",
                "command": ' '.join(cmd)
            }), 500
            
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except subprocess.TimeoutExpired:
        return jsonify({"success": False, "error": "Scan timed out (5 minute limit)"}), 504
    except Exception as e:
        return jsonify({"success": False, "error": f"Unexpected error: {str(e)}"}), 500


@app.route('/recon', methods=['POST'])
@check_api_key
@rate_limit
def recon():
    """
    Full reconnaissance scan for Recon Graph.
    
    POST body (JSON):
    {
        "target": "example.com",
        "mode": "standard",           # quick, standard, deep
        "options": {
            "subdomains": true,
            "ports": true,
            "technologies": true,
            "cves": true,
            "ssl": true
        }
    }
    """
    try:
        data = request.get_json()
        if not data or 'target' not in data:
            return jsonify({"success": False, "error": "Missing 'target' in request body"}), 400
        
        target = sanitize_target(data['target'])
        mode = data.get('mode', 'standard')
        options = data.get('options', {
            "subdomains": True,
            "ports": True,
            "technologies": True,
            "cves": True,
            "ssl": True
        })
        
        result = {
            "target": target,
            "timestamp": datetime.now().isoformat(),
            "subdomains": [],
            "hosts": [],
            "technologies": [],
            "cves": [],
            "ssl_certs": [],
            "summary": {}
        }
        
        # Step 1: Subdomain enumeration
        if options.get('subdomains', True):
            print(f"[Recon] Enumerating subdomains for {target}")
            
            # Try subfinder first
            subdomains = enumerate_subdomains_subfinder(target)
            
            # Fallback to DNS brute force
            if not subdomains:
                wordlist = COMMON_SUBDOMAINS if mode == 'quick' else COMMON_SUBDOMAINS * 2
                subdomains = enumerate_subdomains_dns(target, wordlist[:50 if mode == 'quick' else 100])
            
            # Add root domain
            root_ips = resolve_domain(target)
            if root_ips:
                subdomains.insert(0, {
                    "subdomain": target,
                    "ips": root_ips,
                    "status": "active",
                    "is_root": True
                })
            
            result["subdomains"] = subdomains
        
        # Step 2: Port scanning
        if options.get('ports', True):
            print(f"[Recon] Scanning ports for {target}")
            
            scan_type = 'quick' if mode == 'quick' else ('deep' if mode == 'deep' else 'standard')
            
            try:
                cmd = ['nmap', '-T4', '-sV']
                if scan_type == 'quick':
                    cmd.append('-F')
                elif scan_type == 'standard':
                    cmd.extend(['-p', '1-1000'])
                else:
                    cmd.extend(['-p', '1-10000'])
                
                cmd.append(target)
                
                nmap_result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
                parsed = parse_nmap_output(nmap_result.stdout, target)
                result["hosts"] = parsed.get("hosts", [])
            except Exception as e:
                print(f"[Recon] Port scan error: {e}")
        
        # Step 3: Technology fingerprinting
        if options.get('technologies', True):
            print(f"[Recon] Fingerprinting technologies for {target}")
            
            # Check HTTPS
            https_tech = fingerprint_http(target, 443, use_ssl=True)
            if https_tech.get('technologies'):
                result["technologies"].extend(https_tech['technologies'])
            
            # Check HTTP
            http_tech = fingerprint_http(target, 80, use_ssl=False)
            if http_tech.get('technologies'):
                for tech in http_tech['technologies']:
                    if tech not in result["technologies"]:
                        result["technologies"].append(tech)
        
        # Step 4: CVE matching
        if options.get('cves', True):
            print(f"[Recon] Matching CVEs")
            
            # From port scan
            for host in result.get("hosts", []):
                for port in host.get("ports", []):
                    if port.get("cves"):
                        for cve in port["cves"]:
                            cve["source"] = f"{host['ip']}:{port['port']}"
                            result["cves"].append(cve)
            
            # From technologies
            for tech in result.get("technologies", []):
                cves = match_cves(tech['name'], tech.get('version'))
                for cve in cves:
                    cve["source"] = tech['name']
                    if cve not in result["cves"]:
                        result["cves"].append(cve)
        
        # Step 5: SSL certificate analysis
        if options.get('ssl', True):
            print(f"[Recon] Analyzing SSL certificates")
            
            ssl_info = get_ssl_info(target, 443)
            if ssl_info.get('valid'):
                ssl_info['host'] = target
                result["ssl_certs"].append(ssl_info)
        
        # Build summary
        result["summary"] = {
            "subdomains": len(result["subdomains"]),
            "hosts": len(result["hosts"]),
            "open_ports": sum(len([p for p in h.get("ports", []) if p.get("state") == "open"]) for h in result["hosts"]),
            "technologies": len(result["technologies"]),
            "cves": len(result["cves"]),
            "critical_cves": len([c for c in result["cves"] if c.get("cvss", 0) >= 9.0]),
            "high_cves": len([c for c in result["cves"] if 7.0 <= c.get("cvss", 0) < 9.0]),
            "ssl_certs": len(result["ssl_certs"])
        }
        
        print(f"[Recon] Complete. Summary: {result['summary']}")
        
        return jsonify({
            "success": True,
            "data": result
        })
        
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": f"Recon failed: {str(e)}"}), 500


@app.route('/validate', methods=['POST'])
@check_api_key
def validate_finding():
    """
    Validate a specific finding.
    
    POST body (JSON):
    {
        "type": "service|technology|cve|ssl",
        "target": "example.com",
        "data": { ... finding-specific data ... }
    }
    """
    try:
        data = request.get_json()
        finding_type = data.get('type')
        target = sanitize_target(data.get('target', ''))
        finding_data = data.get('data', {})
        
        result = {
            "validated": False,
            "status": "unknown",
            "confidence": 0,
            "evidence": [],
            "timestamp": datetime.now().isoformat()
        }
        
        if finding_type == 'service':
            # Validate service by re-scanning specific port
            port = finding_data.get('port')
            if port:
                cmd = ['nmap', '-T4', '-sV', '-p', str(port), target]
                scan = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
                
                if finding_data.get('service', '').lower() in scan.stdout.lower():
                    result["validated"] = True
                    result["status"] = "confirmed"
                    result["confidence"] = 95
                    result["evidence"].append(f"Service confirmed on port {port}")
                else:
                    result["status"] = "not_found"
                    result["evidence"].append(f"Service not detected on port {port}")
                
                result["raw_output"] = scan.stdout
        
        elif finding_type == 'technology':
            # Validate by re-fingerprinting
            tech_name = finding_data.get('name', '')
            port = finding_data.get('port', 443)
            
            fingerprint = fingerprint_http(target, port, use_ssl=(port == 443))
            
            for tech in fingerprint.get('technologies', []):
                if tech_name.lower() in tech.get('name', '').lower():
                    result["validated"] = True
                    result["status"] = "confirmed"
                    result["confidence"] = 85
                    result["evidence"].append(f"Technology {tech_name} confirmed")
                    if tech.get('version'):
                        result["evidence"].append(f"Version: {tech['version']}")
                    break
            
            if not result["validated"]:
                result["status"] = "not_found"
                result["evidence"].append(f"Technology {tech_name} not detected")
        
        elif finding_type == 'ssl':
            # Validate SSL certificate
            ssl_info = get_ssl_info(target, finding_data.get('port', 443))
            
            if ssl_info.get('valid'):
                result["validated"] = True
                result["status"] = "confirmed"
                result["confidence"] = 100
                result["evidence"].append("SSL certificate is valid")
                result["evidence"].append(f"Issuer: {ssl_info.get('issuer')}")
                result["evidence"].append(f"Expires: {ssl_info.get('not_after')}")
                result["ssl_info"] = ssl_info
            else:
                result["status"] = "invalid"
                result["evidence"].append(f"SSL error: {ssl_info.get('error')}")
        
        elif finding_type == 'cve':
            # CVE validation - check if service is still vulnerable
            cve_id = finding_data.get('id')
            port = finding_data.get('port')
            service = finding_data.get('service')
            
            if port:
                cmd = ['nmap', '-T4', '-sV', '--script=vulners', '-p', str(port), target]
                scan = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
                
                if cve_id and cve_id.lower() in scan.stdout.lower():
                    result["validated"] = True
                    result["status"] = "vulnerable"
                    result["confidence"] = 90
                    result["evidence"].append(f"{cve_id} confirmed by vulnerability scan")
                elif service and service.lower() in scan.stdout.lower():
                    result["validated"] = True
                    result["status"] = "likely_vulnerable"
                    result["confidence"] = 70
                    result["evidence"].append(f"Service {service} still present, CVE may apply")
                else:
                    result["status"] = "not_confirmed"
                    result["evidence"].append("Could not confirm vulnerability")
                
                result["raw_output"] = scan.stdout
        
        return jsonify({
            "success": True,
            "data": result
        })
        
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Validation failed: {str(e)}"}), 500


@app.route('/subdomains', methods=['POST'])
@check_api_key
@rate_limit
def enumerate_subdomains():
    """Enumerate subdomains for a domain."""
    try:
        data = request.get_json()
        target = sanitize_target(data.get('target', ''))
        
        subdomains = enumerate_subdomains_subfinder(target)
        if not subdomains:
            subdomains = enumerate_subdomains_dns(target)
        
        return jsonify({
            "success": True,
            "data": {
                "target": target,
                "subdomains": subdomains,
                "count": len(subdomains)
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/ssl/<host>', methods=['GET'])
@check_api_key
def ssl_info(host):
    """Get SSL certificate info for a host."""
    try:
        host = sanitize_target(host)
        port = request.args.get('port', 443, type=int)
        
        info = get_ssl_info(host, port)
        return jsonify({
            "success": True,
            "data": info
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/fingerprint', methods=['POST'])
@check_api_key
@rate_limit
def fingerprint():
    """Fingerprint technologies on a target."""
    try:
        data = request.get_json()
        target = sanitize_target(data.get('target', ''))
        port = data.get('port', 443)
        
        result = fingerprint_http(target, port, use_ssl=(port == 443))
        return jsonify({
            "success": True,
            "data": result
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='PenQuest Scanner Service v2.0')
    parser.add_argument('--port', type=int, default=11435, help='Port to listen on (default: 11435)')
    parser.add_argument('--host', default='0.0.0.0', help='Host to bind to (default: 0.0.0.0)')
    parser.add_argument('--api-key', help='Optional API key for authentication')
    args = parser.parse_args()
    
    if args.api_key:
        API_KEY = args.api_key
        print(f"[PenQuest Scanner] API key authentication enabled")
    
    print(f"")
    print(f"╔══════════════════════════════════════════════════════════╗")
    print(f"║          PenQuest Scanner Service v2.0                  ║")
    print(f"╠══════════════════════════════════════════════════════════╣")
    print(f"║  Endpoints:                                              ║")
    print(f"║    GET  /health        - Service health check           ║")
    print(f"║    POST /scan          - Nmap port scan                 ║")
    print(f"║    POST /recon         - Full reconnaissance            ║")
    print(f"║    POST /validate      - Validate findings              ║")
    print(f"║    POST /subdomains    - Subdomain enumeration          ║")
    print(f"║    GET  /ssl/<host>    - SSL certificate info           ║")
    print(f"║    POST /fingerprint   - Technology fingerprinting      ║")
    print(f"╚══════════════════════════════════════════════════════════╝")
    print(f"")
    print(f"[PenQuest Scanner] Starting on http://{args.host}:{args.port}")
    
    app.run(host=args.host, port=args.port, debug=False)

#!/usr/bin/env python3
"""
PenQuest Scanner Service
========================
A lightweight API wrapper for nmap that allows PenQuest to perform real network scans.

Setup:
  1. Install dependencies: pip3 install flask flask-cors
  2. Ensure nmap is installed: sudo apt install nmap (or your OS equivalent)
  3. Run: python3 penquest-scanner-service.py --port 11435
  4. Port forward 11435 through your router/firewall
  5. Set SCANNER_API_URL=http://your-server:11435 in PenQuest

Security Notes:
  - This service executes nmap commands - only expose to trusted networks
  - Consider adding API key authentication for production use
  - Rate limiting is built-in to prevent abuse
"""

import subprocess
import json
import re
import argparse
import time
from datetime import datetime
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Rate limiting
request_times = {}
RATE_LIMIT_SECONDS = 5  # Minimum seconds between scans from same IP

# API Key (optional - set to None to disable)
API_KEY = None  # Set to a string like "your-secret-key" to enable


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
    # Allow only valid hostname/IP characters
    if not re.match(r'^[a-zA-Z0-9.\-:/]+$', target):
        raise ValueError("Invalid target format")
    # Block localhost/internal scanning unless explicitly allowed
    blocked = ['127.0.0.1', 'localhost', '0.0.0.0', '::1']
    if any(b in target.lower() for b in blocked):
        raise ValueError("Scanning localhost is not allowed")
    return target


def sanitize_ports(ports: str) -> str:
    """Sanitize port specification."""
    if not ports:
        return None
    # Allow formats: 80, 80-443, 22,80,443, 1-1000
    if not re.match(r'^[\d,\-]+$', ports):
        raise ValueError("Invalid port format")
    return ports


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
        
        # Host discovery
        if 'Nmap scan report for' in line:
            if current_host:
                result["hosts"].append(current_host)
            
            # Extract hostname and IP
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
        
        # Host status
        elif 'Host is up' in line:
            if current_host:
                latency_match = re.search(r'\(([^)]+)\s*latency\)', line)
                if latency_match:
                    current_host["latency"] = latency_match.group(1)
        
        # Port information
        elif re.match(r'^\d+/(tcp|udp)', line):
            parts = line.split()
            if len(parts) >= 3 and current_host:
                port_proto = parts[0].split('/')
                port_info = {
                    "port": int(port_proto[0]),
                    "protocol": port_proto[1],
                    "state": parts[1],
                    "service": parts[2] if len(parts) > 2 else "unknown",
                    "version": " ".join(parts[3:]) if len(parts) > 3 else None
                }
                current_host["ports"].append(port_info)
        
        # OS detection
        elif 'OS details:' in line or 'Running:' in line:
            if current_host:
                os_match = re.search(r'(?:OS details:|Running:)\s*(.+)', line)
                if os_match:
                    current_host["os"] = os_match.group(1).strip()
        
        # MAC address
        elif 'MAC Address:' in line:
            if current_host:
                mac_match = re.search(r'MAC Address:\s*([^\s]+)', line)
                if mac_match:
                    current_host["mac"] = mac_match.group(1)
    
    # Don't forget the last host
    if current_host:
        result["hosts"].append(current_host)
    
    # Summary stats
    result["summary"] = {
        "hosts_up": len([h for h in result["hosts"] if h["status"] == "up"]),
        "total_open_ports": sum(len([p for p in h["ports"] if p["state"] == "open"]) for h in result["hosts"])
    }
    
    return result


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    # Verify nmap is installed
    try:
        result = subprocess.run(['nmap', '--version'], capture_output=True, text=True, timeout=5)
        nmap_version = result.stdout.split('\n')[0] if result.returncode == 0 else "unknown"
    except Exception:
        nmap_version = "not installed"
    
    return jsonify({
        "status": "healthy",
        "service": "penquest-scanner",
        "nmap_version": nmap_version,
        "timestamp": datetime.now().isoformat()
    })


@app.route('/scan', methods=['POST'])
@check_api_key
@rate_limit
def scan():
    """
    Perform an nmap scan.
    
    POST body (JSON):
    {
        "target": "example.com",       # Required: hostname, IP, or CIDR range
        "ports": "22,80,443",          # Optional: port specification
        "scan_type": "quick",          # Optional: quick, standard, deep, stealth
        "options": {                   # Optional: additional options
            "service_detection": true,
            "os_detection": false,
            "script_scan": false
        }
    }
    """
    try:
        data = request.get_json()
        if not data or 'target' not in data:
            return jsonify({"success": False, "error": "Missing 'target' in request body"}), 400
        
        # Sanitize inputs
        target = sanitize_target(data['target'])
        ports = sanitize_ports(data.get('ports', ''))
        scan_type = data.get('scan_type', 'quick')
        options = data.get('options', {})
        
        # Build nmap command
        cmd = ['nmap']
        
        # Scan type presets
        if scan_type == 'quick':
            cmd.extend(['-T4', '-F'])  # Fast timing, top 100 ports
        elif scan_type == 'standard':
            cmd.extend(['-T3', '-p', '1-1000'])  # Normal timing, top 1000
        elif scan_type == 'deep':
            cmd.extend(['-T3', '-p-'])  # All ports
        elif scan_type == 'stealth':
            cmd.extend(['-sS', '-T2'])  # SYN scan, slower timing
        
        # Custom port specification overrides preset
        if ports:
            # Remove any existing -p or -F flags
            cmd = [c for c in cmd if not c.startswith('-p') and c != '-F']
            cmd.extend(['-p', ports])
        
        # Additional options
        if options.get('service_detection'):
            cmd.append('-sV')
        if options.get('os_detection'):
            cmd.append('-O')
        if options.get('script_scan'):
            cmd.append('-sC')
        
        # Add target
        cmd.append(target)
        
        # Execute scan with timeout (5 minutes max)
        print(f"[PenQuest Scanner] Executing: {' '.join(cmd)}")
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300
        )
        
        # Parse output
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


@app.route('/scan/quick', methods=['GET'])
@check_api_key
@rate_limit
def quick_scan():
    """Quick scan via GET request. Usage: /scan/quick?target=example.com&ports=80,443"""
    target = request.args.get('target')
    if not target:
        return jsonify({"success": False, "error": "Missing 'target' parameter"}), 400
    
    try:
        target = sanitize_target(target)
        ports = sanitize_ports(request.args.get('ports', ''))
        
        cmd = ['nmap', '-T4', '-F']
        if ports:
            cmd = ['nmap', '-T4', '-p', ports]
        cmd.append(target)
        
        print(f"[PenQuest Scanner] Quick scan: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        
        parsed = parse_nmap_output(result.stdout, target)
        return jsonify({
            "success": True,
            "data": parsed,
            "raw_output": result.stdout
        })
        
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except subprocess.TimeoutExpired:
        return jsonify({"success": False, "error": "Scan timed out"}), 504
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='PenQuest Scanner Service')
    parser.add_argument('--port', type=int, default=11435, help='Port to listen on (default: 11435)')
    parser.add_argument('--host', default='0.0.0.0', help='Host to bind to (default: 0.0.0.0)')
    parser.add_argument('--api-key', help='Optional API key for authentication')
    args = parser.parse_args()
    
    if args.api_key:
        API_KEY = args.api_key
        print(f"[PenQuest Scanner] API key authentication enabled")
    
    print(f"[PenQuest Scanner] Starting on {args.host}:{args.port}")
    print(f"[PenQuest Scanner] Health check: http://{args.host}:{args.port}/health")
    print(f"[PenQuest Scanner] Scan endpoint: POST http://{args.host}:{args.port}/scan")
    
    app.run(host=args.host, port=args.port, debug=False)

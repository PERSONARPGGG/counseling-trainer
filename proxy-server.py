"""
OpenRouter AI Proxy Server (무료 + Rate Limited)
실행: python proxy-server.py
필수: 환경변수 OPENROUTER_API_KEY 설정
  PowerShell: $env:OPENROUTER_API_KEY="sk-or-v1-..."
"""

import http.server
import json
import os
import urllib.request
import urllib.error
import ssl
import time
from collections import defaultdict

PORT = 8421
API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "qwen/qwen2-7b-instruct:free"
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "http://localhost:8420,http://127.0.0.1:8420").split(",")

RATE_LIMIT = int(os.environ.get("RATE_LIMIT", "30"))  # requests per minute
RATE_WINDOW = 60

class RateLimiter:
    def __init__(self):
        self.requests = defaultdict(list)

    def check(self, ip):
        now = time.time()
        self.requests[ip] = [t for t in self.requests[ip] if now - t < RATE_WINDOW]
        if len(self.requests[ip]) >= RATE_LIMIT:
            return False
        self.requests[ip].append(now)
        return True

rate_limiter = RateLimiter()

class ProxyHandler(http.server.BaseHTTPRequestHandler):
    def get_client_ip(self):
        xff = self.headers.get("X-Forwarded-For", "")
        return xff.split(",")[0].strip() if xff else self.client_address[0]

    def set_cors(self):
        origin = self.headers.get("Origin", "")
        if origin in ALLOWED_ORIGINS or ALLOWED_ORIGINS == ["*"]:
            self.send_header("Access-Control-Allow-Origin", origin)
        else:
            self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGINS[0] if ALLOWED_ORIGINS else "")
        self.send_header("Vary", "Origin")

    def do_OPTIONS(self):
        self.send_response(200)
        self.set_cors()
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.set_cors()
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "model": DEFAULT_MODEL}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path != "/ask":
            self.send_response(404)
            self.end_headers()
            return

        ip = self.get_client_ip()
        if not rate_limiter.check(ip):
            self._reply(429, {"error": "Too many requests. Please wait before sending another request."})
            return

        content_len = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(content_len)) if content_len else {}

        system_prompt = body.get("system_prompt", "You are a helpful assistant.")
        messages = body.get("messages", [])
        model = body.get("model", DEFAULT_MODEL)
        api_key = body.get("api_key", "") or API_KEY

        if not api_key:
            self._reply(503, {"error": "API 키가 설정되지 않았습니다. 설정 페이지에서 OpenRouter API 키를 입력하거나 환경변수 OPENROUTER_API_KEY를 설정하세요."})
            return

        temperature = body.get("temperature", 0.9)
        max_tokens = body.get("max_tokens", 600)
        top_p = body.get("top_p", 0.95)

        payload = json.dumps({
            "model": model,
            "messages": [{"role": "system", "content": system_prompt}] + messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "top_p": top_p
        }).encode()

        req = urllib.request.Request(OPENROUTER_URL, data=payload, method="POST")
        req.add_header("Authorization", f"Bearer {api_key}")
        req.add_header("Content-Type", "application/json")
        req.add_header("HTTP-Referer", os.environ.get("SITE_URL", "http://localhost:8420"))
        req.add_header("X-Title", "Counseling Simulator")

        try:
            ctx = ssl.create_default_context()
            resp = urllib.request.urlopen(req, timeout=30, context=ctx)
            result = json.loads(resp.read())
            ai_text = result["choices"][0]["message"]["content"]
            self._reply(200, {"text": ai_text})
        except urllib.error.HTTPError as e:
            err_body = e.read().decode()
            try:
                err_json = json.loads(err_body)
                msg = err_json.get("error", {}).get("message", err_body[:200])
            except json.JSONDecodeError:
                msg = err_body[:200]
            self._reply(e.code, {"error": f"OpenRouter ({e.code}): {msg}"})
        except Exception as e:
            self._reply(500, {"error": f"Server error: {str(e)[:200]}"})

    def _reply(self, code, data):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.set_cors()
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())

    def log_message(self, format, *args):
        try:
            print(f"[Proxy] {args[0]} {args[1]} {args[2]}")
        except UnicodeEncodeError:
            print(f"[Proxy] {args[0]}".encode('ascii', 'replace').decode())

if __name__ == "__main__":
    import sys
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    print("=" * 50)
    print("  AI Proxy - OpenRouter AI Proxy")
    print(f"  Port: {PORT}")
    print(f"  Model: {DEFAULT_MODEL}")
    print(f"  Rate Limit: {RATE_LIMIT} req/min")
    print(f"  Allowed Origins: {', '.join(ALLOWED_ORIGINS)}")
    if API_KEY:
        print(f"  API Key: set (from env)")
    else:
        print("  No OPENROUTER_API_KEY env var - use Settings page to enter API key.")
    print("=" * 50)
    server = http.server.HTTPServer(("0.0.0.0", PORT), ProxyHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nProxy 종료")
        server.server_close()

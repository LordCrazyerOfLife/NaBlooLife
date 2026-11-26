import http.server
import socketserver
import sys

PORT = 8765

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # never let the browser cache game files: otherwise edited mods keep loading the old copy
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def guess_type(self, path):
        # Windows' registry-based mimetypes lookup is unreliable (often
        # reports .js as text/plain), which breaks Service Worker
        # registration. Force the correct types ourselves.
        p = str(path).lower()
        if p.endswith(".js") or p.endswith(".mjs"):
            return "text/javascript"
        if p.endswith(".json"):
            return "application/json"
        if p.endswith(".wasm"):
            return "application/wasm"
        return super().guess_type(path)

class ServerTCP(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

if __name__ == "__main__":
    with ServerTCP(("127.0.0.1", PORT), Handler) as httpd:
        print(f"Serving HTTP on 127.0.0.1 port {PORT} (correct MIME types forced) ...")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            sys.exit(0)

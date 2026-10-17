import http.server, functools, sys
class H(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, '.webmanifest': 'application/manifest+json', '.js': 'application/javascript'}
    def end_headers(self):
        self.send_header('Cache-Control', 'max-age=600')     # like GitHub Pages
        super().end_headers()
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(('127.0.0.1', 8123), functools.partial(H, directory=sys.argv[1])).serve_forever()

import os
import mimetypes
from wsgiref.simple_server import make_server

def application(environ, start_response):
    """Simple WSGI app to serve static files"""
    
    path = environ.get('PATH_INFO', '/')
    method = environ.get('REQUEST_METHOD', 'GET')
    
    # Remove leading slash
    if path.startswith('/'):
        path = path[1:]
    
    # Default to index.html for root
    if path == '' or path == '/':
        path = 'index.html'
    
    # Health check
    if path == 'health':
        response_body = b'{"status": "healthy", "app": "Cardiologie Taakbeheer"}'
        status = '200 OK'
        headers = [('Content-Type', 'application/json')]
        start_response(status, headers)
        return [response_body]
    
    # Build file path
    dist_folder = os.path.join(os.path.dirname(__file__), 'dist')
    file_path = os.path.join(dist_folder, path)
    
    print(f"Request: {path} -> {file_path}")
    print(f"Dist folder exists: {os.path.exists(dist_folder)}")
    print(f"File exists: {os.path.exists(file_path)}")
    
    if os.path.exists(file_path) and os.path.isfile(file_path):
        # Determine MIME type
        mime_type, _ = mimetypes.guess_type(file_path)
        if mime_type is None:
            if path.endswith('.js'):
                mime_type = 'application/javascript'
            elif path.endswith('.css'):
                mime_type = 'text/css'
            elif path.endswith('.html'):
                mime_type = 'text/html'
            else:
                mime_type = 'application/octet-stream'
        
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            
            status = '200 OK'
            headers = [
                ('Content-Type', mime_type),
                ('Content-Length', str(len(content)))
            ]
            start_response(status, headers)
            return [content]
            
        except Exception as e:
            print(f"Error reading file {file_path}: {e}")
    
    # File not found - serve index.html for SPA routing (unless it's an asset)
    if not path.startswith('assets/') and '.' not in path.split('/')[-1]:
        index_path = os.path.join(dist_folder, 'index.html')
        if os.path.exists(index_path):
            try:
                with open(index_path, 'rb') as f:
                    content = f.read()
                
                status = '200 OK'
                headers = [
                    ('Content-Type', 'text/html'),
                    ('Content-Length', str(len(content)))
                ]
                start_response(status, headers)
                return [content]
            except Exception as e:
                print(f"Error reading index.html: {e}")
    
    # 404 Not Found
    status = '404 Not Found'
    headers = [('Content-Type', 'text/plain')]
    start_response(status, headers)
    return [b'Not Found']

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    server = make_server('0.0.0.0', port, application)
    print(f"Serving on port {port}")
    server.serve_forever()


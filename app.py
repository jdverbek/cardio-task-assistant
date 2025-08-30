import os
import mimetypes
import json
from wsgiref.simple_server import make_server

def app(environ, start_response):
    """Simple WSGI app to serve static files - replaces Flask"""
    
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
        response_body = b'{"status": "healthy", "app": "Cardiologie Taakbeheer", "server": "simple_wsgi"}'
        status = '200 OK'
        headers = [('Content-Type', 'application/json')]
        start_response(status, headers)
        return [response_body]
    
    # Debug endpoint to check file system
    if path == 'debug':
        dist_folder = os.path.join(os.path.dirname(__file__), 'dist')
        debug_info = {
            'server_type': 'simple_wsgi_in_app_py',
            'working_directory': os.getcwd(),
            'script_directory': os.path.dirname(__file__),
            'dist_folder_path': dist_folder,
            'dist_exists': os.path.exists(dist_folder),
            'dist_contents': [],
            'assets_contents': []
        }
        
        if os.path.exists(dist_folder):
            try:
                debug_info['dist_contents'] = os.listdir(dist_folder)
                assets_folder = os.path.join(dist_folder, 'assets')
                if os.path.exists(assets_folder):
                    debug_info['assets_contents'] = os.listdir(assets_folder)
            except Exception as e:
                debug_info['error'] = str(e)
        
        response_body = json.dumps(debug_info, indent=2).encode('utf-8')
        status = '200 OK'
        headers = [('Content-Type', 'application/json')]
        start_response(status, headers)
        return [response_body]
    
    # Build file path
    dist_folder = os.path.join(os.path.dirname(__file__), 'dist')
    file_path = os.path.join(dist_folder, path)
    
    print(f"[SIMPLE_SERVER] Request: {path}")
    print(f"[SIMPLE_SERVER] Script dir: {os.path.dirname(__file__)}")
    print(f"[SIMPLE_SERVER] Dist folder: {dist_folder}")
    print(f"[SIMPLE_SERVER] File path: {file_path}")
    print(f"[SIMPLE_SERVER] Dist folder exists: {os.path.exists(dist_folder)}")
    print(f"[SIMPLE_SERVER] File exists: {os.path.exists(file_path)}")
    
    if os.path.exists(dist_folder):
        print(f"[SIMPLE_SERVER] Dist contents: {os.listdir(dist_folder)}")
        assets_folder = os.path.join(dist_folder, 'assets')
        if os.path.exists(assets_folder):
            print(f"[SIMPLE_SERVER] Assets contents: {os.listdir(assets_folder)}")
    
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
            
            print(f"[SIMPLE_SERVER] Successfully served: {file_path} ({len(content)} bytes)")
            
            status = '200 OK'
            headers = [
                ('Content-Type', mime_type),
                ('Content-Length', str(len(content)))
            ]
            start_response(status, headers)
            return [content]
            
        except Exception as e:
            print(f"[SIMPLE_SERVER] Error reading file {file_path}: {e}")
    
    print(f"[SIMPLE_SERVER] File not found: {file_path}")
    
    # File not found - serve index.html for SPA routing (unless it's an asset)
    if not path.startswith('assets/') and '.' not in path.split('/')[-1]:
        index_path = os.path.join(dist_folder, 'index.html')
        if os.path.exists(index_path):
            try:
                with open(index_path, 'rb') as f:
                    content = f.read()
                
                print(f"[SIMPLE_SERVER] Serving index.html for SPA route: {path}")
                
                status = '200 OK'
                headers = [
                    ('Content-Type', 'text/html'),
                    ('Content-Length', str(len(content)))
                ]
                start_response(status, headers)
                return [content]
            except Exception as e:
                print(f"[SIMPLE_SERVER] Error reading index.html: {e}")
    
    # 404 Not Found
    print(f"[SIMPLE_SERVER] Returning 404 for: {path}")
    status = '404 Not Found'
    headers = [('Content-Type', 'text/plain')]
    start_response(status, headers)
    return [b'Not Found']

# For compatibility with both gunicorn app:app and simple_server:application
application = app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    server = make_server('0.0.0.0', port, app)
    print(f"Serving on port {port}")
    server.serve_forever()


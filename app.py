from flask import Flask, send_from_directory, send_file, abort
import os
import mimetypes

app = Flask(__name__)

# Set the static folder to dist
DIST_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist')

@app.route('/')
def serve_index():
    """Serve the main index.html"""
    return send_from_directory(DIST_FOLDER, 'index.html')

@app.route('/favicon.ico')
def serve_favicon():
    """Serve favicon"""
    return send_from_directory(DIST_FOLDER, 'favicon.ico')

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    """Serve assets with proper MIME types"""
    try:
        file_path = os.path.join(DIST_FOLDER, 'assets', filename)
        if os.path.exists(file_path):
            # Set proper MIME type
            mimetype = mimetypes.guess_type(filename)[0]
            if filename.endswith('.js'):
                mimetype = 'application/javascript'
            elif filename.endswith('.css'):
                mimetype = 'text/css'
            
            return send_file(file_path, mimetype=mimetype)
        else:
            abort(404)
    except Exception as e:
        print(f"Error serving asset {filename}: {e}")
        abort(404)

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return {'status': 'healthy', 'app': 'Cardiologie Taakbeheer'}, 200

@app.route('/<path:path>')
def serve_spa_routes(path):
    """Serve SPA routes - only for paths without file extensions"""
    # If it has a file extension, it's probably a static file request
    if '.' in path.split('/')[-1]:
        # Try to serve it as a static file
        try:
            return send_from_directory(DIST_FOLDER, path)
        except:
            abort(404)
    else:
        # It's a SPA route, serve index.html
        return send_from_directory(DIST_FOLDER, 'index.html')

@app.errorhandler(404)
def not_found(error):
    """Handle 404s by serving React app for SPA routing"""
    return send_from_directory(DIST_FOLDER, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting server on port {port}")
    print(f"Serving files from: {DIST_FOLDER}")
    print(f"Files in dist: {os.listdir(DIST_FOLDER) if os.path.exists(DIST_FOLDER) else 'DIST_FOLDER not found'}")
    app.run(host='0.0.0.0', port=port, debug=False)


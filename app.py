from flask import Flask, send_from_directory, send_file
import os

app = Flask(__name__, static_folder='dist', static_url_path='')

@app.route('/')
def serve_react_app():
    """Serve the React app's index.html"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    """Serve assets from the assets folder"""
    return send_from_directory(os.path.join(app.static_folder, 'assets'), filename)

@app.route('/<path:path>')
def serve_react_routes(path):
    """Serve React app routes and static files"""
    # Check if it's a static file (has extension)
    if '.' in path:
        try:
            # Try to serve the file from dist folder
            return send_from_directory(app.static_folder, path)
        except:
            # If file not found, serve index.html for React Router
            return send_from_directory(app.static_folder, 'index.html')
    else:
        # For React Router paths (no extension), serve index.html
        return send_from_directory(app.static_folder, 'index.html')

@app.route('/health')
def health_check():
    """Health check endpoint for Render"""
    return {'status': 'healthy', 'app': 'Cardiologie Taakbeheer'}, 200

@app.errorhandler(404)
def not_found(error):
    """Handle 404s by serving React app (for client-side routing)"""
    return send_from_directory(app.static_folder, 'index.html')

# Add CORS headers for development
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)


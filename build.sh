#!/bin/bash
set -e  # Exit on any error

echo "🚀 Building Cardiologie Taakbeheer..."

# Show environment
echo "📋 Environment info:"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Python version: $(python --version)"
echo "Working directory: $(pwd)"
echo "Available space: $(df -h . | tail -1)"

# Clean any previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/ node_modules/.vite/

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install --verbose

# Check if dependencies installed correctly
echo "📋 Checking key dependencies..."
npm list react vite @vitejs/plugin-react || echo "Some dependencies missing but continuing..."

# Build React application with verbose output
echo "🔨 Building React application..."
NODE_OPTIONS="--max-old-space-size=1024" npm run build -- --mode production

# Verify build output
echo "📁 Verifying build output..."
if [ ! -d "dist" ]; then
    echo "❌ ERROR: dist folder not created!"
    exit 1
fi

echo "📁 Build output:"
ls -la dist/
echo "📄 Index.html size: $(wc -c < dist/index.html) bytes"

if [ -d "dist/assets" ]; then
    echo "📁 Assets folder:"
    ls -la dist/assets/
    echo "📊 Assets count: $(ls -1 dist/assets/ | wc -l)"
else
    echo "⚠️  WARNING: No assets folder created!"
    echo "📄 Index.html content preview:"
    head -20 dist/index.html
fi

echo "🐍 Installing Python dependencies..."
pip install -r requirements.txt

echo "✅ Build complete!"
if [ -d "dist/assets" ] && [ "$(ls -1 dist/assets/ | wc -l)" -gt 0 ]; then
    echo "🎉 SUCCESS: React app built with assets!"
else
    echo "⚠️  WARNING: React app built but no assets generated!"
fi
echo "🏥 Cardiologie Taakbeheer ready for deployment!"


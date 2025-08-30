#!/bin/bash

echo "🚀 Building Cardiologie Taakbeheer..."

# Show environment
echo "📋 Environment info:"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Python version: $(python --version)"
echo "Working directory: $(pwd)"

# Install Node.js dependencies and build React app
echo "📦 Installing Node.js dependencies..."
npm install

echo "🔨 Building React application..."
npm run build

# Check build output
echo "📁 Build output:"
ls -la dist/
echo "📁 Assets folder:"
ls -la dist/assets/
echo "📄 Index.html content:"
head -10 dist/index.html

echo "🐍 Installing Python dependencies..."
pip install -r requirements.txt

echo "✅ Build complete! Simple server will serve React app from /dist"
echo "🏥 Cardiologie Taakbeheer ready for deployment!"


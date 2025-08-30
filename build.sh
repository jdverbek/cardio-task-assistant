#!/bin/bash

echo "🚀 Building Cardiologie Taakbeheer..."

# Install Node.js dependencies and build React app
echo "📦 Installing Node.js dependencies..."
npm install

echo "🔨 Building React application..."
npm run build

echo "🐍 Installing Python dependencies..."
pip install -r requirements.txt

echo "✅ Build complete! Flask will serve React app from /dist"
echo "🏥 Cardiologie Taakbeheer ready for deployment!"


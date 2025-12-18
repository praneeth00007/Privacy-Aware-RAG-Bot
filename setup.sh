#!/bin/bash

# Quick Start Setup Script
# Configures the Privacy-Aware RAG Bot for first run

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Privacy-Aware RAG Bot - Quick Start Setup                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

echo "✅ Node.js $(node --version) found"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Check for .env file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update .env with your Auth0 credentials:"
    echo "   - AUTH0_DOMAIN"
    echo "   - AUTH0_CLIENT_ID"
    echo "   - AUTH0_CLIENT_SECRET"
    echo "   - AUTH0_FGA_STORE_ID"
    echo "   - AUTH0_FGA_API_TOKEN"
    echo "   - OPENAI_API_KEY (optional)"
    echo ""
fi

# Check for TypeScript
if ! command -v tsc &> /dev/null; then
    echo "🔧 Installing TypeScript globally..."
    npm install -g typescript
fi

echo "✅ TypeScript available"
echo ""

# Build project
echo "🏗️  Building project..."
npm run build
echo "✅ Build complete"
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Setup Complete! Next Steps:                                   ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║  1. Update .env with your Auth0 credentials                    ║"
echo "║  2. Read AUTH0_FGA_SETUP.md for FGA configuration              ║"
echo "║  3. Run: npm run test:demo                                     ║"
echo "║  4. Run: npm run dev                                           ║"
echo "║                                                                ║"
echo "║  Documentation:                                                ║"
echo "║  - README.md - Project overview                                ║"
echo "║  - docs/AUTH0_FGA_SETUP.md - FGA setup guide                   ║"
echo "║  - docs/ARCHITECTURE.md - System architecture                  ║"
echo "║  - docs/EXAMPLES.md - Code examples                            ║"
echo "║  - docs/DEPLOYMENT.md - Deployment guide                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

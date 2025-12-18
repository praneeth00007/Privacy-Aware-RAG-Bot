@echo off
REM Quick Start Setup Script for Windows
REM Configures the Privacy-Aware RAG Bot for first run

echo.
echo ════════════════════════════════════════════════════════════════
echo  Privacy-Aware RAG Bot - Quick Start Setup (Windows)
echo ════════════════════════════════════════════════════════════════
echo.

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18 or higher.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do echo ✅ %%i found
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
echo ✅ Dependencies installed
echo.

REM Check for .env file
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ⚠️  Please update .env with your Auth0 credentials:
    echo    - AUTH0_DOMAIN
    echo    - AUTH0_CLIENT_ID
    echo    - AUTH0_CLIENT_SECRET
    echo    - AUTH0_FGA_STORE_ID
    echo    - AUTH0_FGA_API_TOKEN
    echo    - OPENAI_API_KEY (optional)
    echo.
)

REM Build project
echo 🏗️  Building project...
call npm run build
echo ✅ Build complete
echo.

echo ════════════════════════════════════════════════════════════════
echo  Setup Complete! Next Steps:
echo ════════════════════════════════════════════════════════════════
echo.
echo  1. Update .env with your Auth0 credentials
echo  2. Read AUTH0_FGA_SETUP.md for FGA configuration
echo  3. Run: npm run test:demo
echo  4. Run: npm run dev
echo.
echo  Documentation:
echo  - README.md - Project overview
echo  - docs/AUTH0_FGA_SETUP.md - FGA setup guide
echo  - docs/ARCHITECTURE.md - System architecture
echo  - docs/EXAMPLES.md - Code examples
echo  - docs/DEPLOYMENT.md - Deployment guide
echo.
pause

#!/bin/bash

# AI Therapist Enhanced - Setup Script
# This script helps with initial project setup

set -e

echo "🚀 AI Therapist Enhanced - Setup Script"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 20 or higher.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm $(npm -v) detected${NC}"

# Function to generate secure random key
generate_key() {
    node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
}

# Check if .env.local exists
if [ -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local already exists. Skipping environment setup.${NC}"
else
    echo ""
    echo "📝 Setting up environment variables..."
    
    # Copy example env file
    cp .env.example .env.local
    
    # Generate secure keys
    ENCRYPTION_KEY=$(generate_key)
    AUDIT_KEY=$(generate_key)
    NEXTAUTH_SECRET=$(generate_key)
    
    # Update .env.local with generated keys
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your-256-bit-encryption-key-base64/$ENCRYPTION_KEY/g" .env.local
        sed -i '' "s/your-audit-encryption-key-base64/$AUDIT_KEY/g" .env.local
        sed -i '' "s/your-nextauth-secret-key-min-32-chars/$NEXTAUTH_SECRET/g" .env.local
    else
        # Linux
        sed -i "s/your-256-bit-encryption-key-base64/$ENCRYPTION_KEY/g" .env.local
        sed -i "s/your-audit-encryption-key-base64/$AUDIT_KEY/g" .env.local
        sed -i "s/your-nextauth-secret-key-min-32-chars/$NEXTAUTH_SECRET/g" .env.local
    fi
    
    echo -e "${GREEN}✅ Generated secure encryption keys${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Please update the following in .env.local:${NC}"
    echo "   - DATABASE_URL (MongoDB connection string)"
    echo "   - GOOGLE_GEMINI_API_KEY or OPENAI_API_KEY"
    echo "   - Email service credentials (optional)"
    echo "   - Crisis webhook URL (optional)"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Generate Prisma Client
echo ""
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Check if MongoDB is running (optional)
echo ""
echo "🗄️  Checking MongoDB connection..."
if command -v docker &> /dev/null; then
    echo "Docker detected. You can start MongoDB with: docker-compose up -d mongodb"
else
    echo -e "${YELLOW}Docker not detected. Make sure MongoDB is running or use MongoDB Atlas.${NC}"
fi

# Create necessary directories
echo ""
echo "📁 Creating necessary directories..."
mkdir -p public/uploads
mkdir -p logs
mkdir -p temp

# Set up git hooks (optional)
if [ -d .git ]; then
    echo ""
    echo "🔗 Setting up git hooks..."
    # Create pre-commit hook for linting
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
npm run lint
EOF
    chmod +x .git/hooks/pre-commit
    echo -e "${GREEN}✅ Git hooks configured${NC}"
fi

# Final instructions
echo ""
echo "========================================="
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your API keys and database URL"
echo "2. Run database setup: npm run db:push"
echo "3. Start development server: npm run dev"
echo ""
echo "For production deployment:"
echo "1. Build the application: npm run build"
echo "2. Start production server: npm start"
echo ""
echo "Security reminders:"
echo -e "${YELLOW}⚠️  Never commit .env.local to git${NC}"
echo -e "${YELLOW}⚠️  Keep your encryption keys secure${NC}"
echo -e "${YELLOW}⚠️  Enable rate limiting in production${NC}"
echo -e "${YELLOW}⚠️  Set up proper monitoring for crisis events${NC}"
echo ""
echo "Documentation: https://github.com/yourusername/ai-therapist-enhanced"
echo "========================================="

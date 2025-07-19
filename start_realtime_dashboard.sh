#!/bin/bash

# RiverAuth Real-time Dashboard Startup Script
# This script helps you start all components needed for real-time functionality

echo "🔐 RiverAuth Real-time Model Score Dashboard Setup"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "admin-dashboard" ] || [ ! -d "model" ]; then
    echo -e "${RED}❌ Error: Please run this script from the RiverAuth root directory${NC}"
    echo "   Expected directories: admin-dashboard, model"
    exit 1
fi

echo -e "${BLUE}📁 Current directory: $(pwd)${NC}"
echo

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"

if ! command_exists python; then
    echo -e "${RED}❌ Python not found. Please install Python 3.7+${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Python found: $(python --version)${NC}"
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm not found. Please install npm${NC}"
    exit 1
else
    echo -e "${GREEN}✅ npm found: $(npm --version)${NC}"
fi

echo

# Install Python dependencies
echo -e "${YELLOW}📦 Installing Python dependencies...${NC}"
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    echo -e "${GREEN}✅ Python dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  No requirements.txt found, continuing...${NC}"
fi

# Install admin dashboard dependencies
echo -e "${YELLOW}📦 Installing admin dashboard dependencies...${NC}"
cd admin-dashboard
if [ -f "package.json" ]; then
    npm install
    echo -e "${GREEN}✅ Admin dashboard dependencies installed${NC}"
else
    echo -e "${RED}❌ No package.json found in admin-dashboard directory${NC}"
    exit 1
fi
cd ..

echo

# Create initial CSV files with some sample data
echo -e "${YELLOW}📄 Creating initial CSV files...${NC}"
python -c "
import sys
import os
sys.path.append('model')
from model_score_logger import get_logger

# Create CSV files in both locations
logger1 = get_logger('model_scores.csv')
logger2 = get_logger('admin-dashboard/model_scores.csv')

print('✅ CSV files created successfully')
print(f'   - {logger1.csv_file}')
print(f'   - {logger2.csv_file}')
"

echo

# Create launch commands
echo -e "${BLUE}🚀 Ready to start! Use these commands:${NC}"
echo
echo -e "${YELLOW}1. Start the admin dashboard (in a new terminal):${NC}"
echo "   cd admin-dashboard && npm run dev"
echo
echo -e "${YELLOW}2. Start real-time data simulation (in another terminal):${NC}"
echo "   python simulate_realtime_scores.py 10"
echo "   (This will run for 10 minutes - adjust as needed)"
echo
echo -e "${YELLOW}3. Test the model score logger directly:${NC}"
echo "   cd model && python model_score_logger.py"
echo

# Optional: Auto-start dashboard
read -p "🤔 Would you like to start the admin dashboard now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}🔄 Starting admin dashboard...${NC}"
    cd admin-dashboard
    echo -e "${BLUE}📡 Admin dashboard will be available at: http://localhost:3000${NC}"
    echo -e "${BLUE}🔗 Model scores page: http://localhost:3000/model-scores${NC}"
    echo
    echo -e "${YELLOW}💡 To start real-time simulation, run in another terminal:${NC}"
    echo -e "${YELLOW}   python simulate_realtime_scores.py${NC}"
    echo
    npm run dev
else
    echo -e "${BLUE}📋 Setup complete! Use the commands above to start the components.${NC}"
    echo
    echo -e "${GREEN}🎯 Quick start:${NC}"
    echo -e "${GREEN}   1. cd admin-dashboard && npm run dev${NC}"
    echo -e "${GREEN}   2. python simulate_realtime_scores.py${NC}"
fi

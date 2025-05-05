#!/bin/bash

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting security audit for ATTIY backend...${NC}"
echo "==============================================="
echo ""

# Create security reports directory if not exists
mkdir -p ./security-reports

# Get current date for report filenames
CURRENT_DATE=$(date +"%Y-%m-%d")

# Run npm audit
echo -e "${YELLOW}Running npm audit...${NC}"
npm audit --json > "./security-reports/npm-audit-${CURRENT_DATE}.json"
npm audit

# Check for outdated dependencies
echo -e "\n${YELLOW}Checking for outdated dependencies...${NC}"
npm outdated

# Run npm audit fix if possible
echo -e "\n${YELLOW}Would you like to run 'npm audit fix' to fix non-breaking vulnerabilities? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
  npm audit fix
fi

# Run Snyk security test if installed
if command -v snyk &> /dev/null; then
  echo -e "\n${YELLOW}Running Snyk security test...${NC}"
  snyk test --json > "./security-reports/snyk-${CURRENT_DATE}.json"
  snyk test
else
  echo -e "\n${RED}Snyk is not installed. Consider installing it for more comprehensive security testing.${NC}"
  echo "npm install -g snyk"
fi

# Check for secrets in git history (using git-secrets if available)
if command -v git-secrets &> /dev/null; then
  echo -e "\n${YELLOW}Scanning for secrets in git history...${NC}"
  git secrets --scan
else
  echo -e "\n${RED}git-secrets is not installed. Consider installing it to scan for secrets in your codebase.${NC}"
  echo "https://github.com/awslabs/git-secrets"
fi

# Report summary
echo -e "\n${GREEN}Security audit complete!${NC}"
echo "Reports saved to ./security-reports/"
echo ""
echo "Recommended actions:"
echo "1. Review and fix any vulnerabilities found"
echo "2. Update outdated dependencies"
echo "3. Consider setting up automated security scanning in CI/CD"
echo ""
echo "===============================================" 
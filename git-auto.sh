#!/bin/bash

if [ -z "$1" ]; then
  echo "❌ Please provide a bug number (e.g. ./git-auto.sh 7)"
  exit 1
fi

BUG_NUMBER=$1
COMMIT_MSG="fix bug $BUG_NUMBER"

echo "🔧 Commit message: $COMMIT_MSG"

# Configure Git to use token-based HTTPS
git remote set-url origin https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/Crypto-Dashboard.git

# Run git commands
git add .
git commit -m "$COMMIT_MSG"
git push origin main

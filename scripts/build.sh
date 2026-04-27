#!/bin/bash
set -Eeuo pipefail

cd "$(dirname "$0")/.."

echo "Installing dependencies..."
npm ci

echo "Building the Next.js project..."
npm run next build

echo "Build completed successfully!"

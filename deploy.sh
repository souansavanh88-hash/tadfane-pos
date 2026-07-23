#!/bin/bash
# deploy.sh - Auto bump version, Build & Deploy to Vercel + Firebase

SIDEBAR="src/components/Sidebar.jsx"

# Get current version
CURRENT=$(grep -oP 'Version \K[0-9]+\.[0-9]+\.[0-9]+' "$SIDEBAR" | head -1)
if [ -z "$CURRENT" ]; then
  CURRENT="3.0.9"
fi

# Bump patch version (e.g. 3.0.9 -> 3.1.0)
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"
PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$PATCH"

# Get today's date
TODAY=$(date "+%B %d, %Y")

echo "📦 Bumping version: $CURRENT → $NEW_VERSION ($TODAY)"

# Update Sidebar.jsx version string
sed -i '' "s/Version $CURRENT - Instant Print ([^)]*)/Version $NEW_VERSION - Instant Print ($TODAY)/g" "$SIDEBAR"

echo "🔨 Building..."
npm run build

echo "🚀 Deploying to Vercel (tadfanerafting.com)..."
npx vercel --prod --yes

echo "🔥 Deploying to Firebase..."
firebase deploy --only hosting

echo "✅ Deploy complete! Version $NEW_VERSION is now live at tadfanerafting.com"

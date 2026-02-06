#!/bin/bash
# Android TWA Build Script

echo "Building Android TWA for StreamFlow..."

# Install Bubblewrap if not present
if ! command -v bubblewrap &> /dev/null; then
    echo "Installing Bubblewrap..."
    npm install -g @bubblewrap/cli
fi

# Initialize TWA (run once)
# bubblewrap init --manifest https://your-domain.com/manifest.json

# Build
echo "Building APK/AAB..."
bubblewrap build

echo "Done. Check output for app-release-signed.apk or .aab"

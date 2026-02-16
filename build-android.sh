#!/bin/bash
# Android TWA Build Script

echo "Building Android TWA for AU RadioChat..."

# Use npx to run bubblewrap without global install issues
echo "Building APK/AAB with npx..."
# Pipe "password" for both KeyStore and Key password prompts
# If your password is different, please update this script or run manually!
(echo "password"; echo "password") | npx @bubblewrap/cli build --skipPwaValidation

echo "Done. Check output for app-release-signed.apk or .aab"

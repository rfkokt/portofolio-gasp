#!/bin/bash

# Configuration
VERSION="0.34.2"
OUTPUT_DIR="pocketbase"

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     OS_TYPE="linux";;
    Darwin*)    OS_TYPE="darwin";;
    *)          echo "Unsupported OS: ${OS}"; exit 1;;
esac

# Detect Architecture
ARCH="$(uname -m)"
case "${ARCH}" in
    x86_64)    ARCH_TYPE="amd64";;
    arm64)     ARCH_TYPE="arm64";;
    aarch64)   ARCH_TYPE="arm64";;
    *)         echo "Unsupported Architecture: ${ARCH}"; exit 1;;
esac

ZIP_NAME="pocketbase_${VERSION}_${OS_TYPE}_${ARCH_TYPE}.zip"
DOWNLOAD_URL="https://github.com/pocketbase/pocketbase/releases/download/v${VERSION}/${ZIP_NAME}"

echo "Detected System: ${OS_TYPE} / ${ARCH_TYPE}"
echo "Downloading PocketBase v${VERSION}..."

# Create directory
mkdir -p "${OUTPUT_DIR}"

# Download
curl -L -o "${OUTPUT_DIR}/${ZIP_NAME}" "${DOWNLOAD_URL}"

# Unzip
echo "Extracting..."
unzip -o "${OUTPUT_DIR}/${ZIP_NAME}" -d "${OUTPUT_DIR}"

# Cleanup
rm "${OUTPUT_DIR}/${ZIP_NAME}"

# Make executable
chmod +x "${OUTPUT_DIR}/pocketbase"

echo "PocketBase installed successfully in ./${OUTPUT_DIR}"
echo "Run './${OUTPUT_DIR}/pocketbase serve' to start."

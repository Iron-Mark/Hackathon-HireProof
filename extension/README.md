# HireProof Chrome Extension

This directory contains the Manifest V3 browser extension for HireProof.

## Store-Ready Package

Generate the Chrome Web Store upload ZIP from the repository root:

```bash
npm run package:extension
```

The package script validates the manifest, generates required PNG icon sizes when missing, copies only extension runtime files, and writes:

```text
dist/chrome/hireproof-extension.zip
public/downloads/hireproof-extension.zip
```

The `public/downloads` copy is the website download fallback while the Chrome Web Store listing is pending review.

## Local Testing

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click "Load unpacked".
4. Select the `extension/` directory.

For the public download package, unzip `hireproof-extension.zip` first and select the unzipped `hireproof-extension` folder.

The packaged extension defaults to `https://hireproof.tech`, but users can replace the API Server URL in the popup for self-hosted deployments.

## Chrome Web Store Submission Boundary

The ZIP and listing materials are prepared in this repository. Public publication still requires a Chrome Web Store developer account, store privacy form, screenshots, and Google review approval.

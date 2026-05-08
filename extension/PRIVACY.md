# HireProof Chrome Extension Privacy Disclosure

HireProof checks job posts, recruiter messages, or selected page text when the user explicitly scans a page or selected text.

## Data Processed

- Page text selected by the user or extracted from a supported job listing page.
- Optional API server URL and API key saved in the browser extension UI.
- Audit response data returned by the configured HireProof server.

## Data Not Collected By The Extension

- The extension does not sell user data.
- The extension does not collect browsing history in the background.
- The extension does not run hidden scans without a user action.
- The extension does not transmit data to third-party ad networks.

## Data Destination

Scan requests are sent to the HireProof API server configured in the popup. The default server is:

```text
https://hireproof.tech
```

Self-hosted users can replace that value with their own HireProof server URL.

## Permissions

- `activeTab`: lets the user scan the currently active tab after clicking the extension.
- `scripting`: extracts visible job listing text from the active tab.
- `contextMenus`: adds "Scan with HireProof" for selected text.
- `storage`: keeps the user's chosen server URL and API key locally in Chrome storage.

## Contact

Support and privacy questions: sales@hireproof.com

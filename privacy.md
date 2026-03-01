## Privacy Policy for Universal AI URL Prompt

**Last updated:** March 1, 2026

The "Universal AI URL Prompt" Chrome extension has been built to improve productivity by prefilling text into AI web interfaces.

**Data Collection**
This extension operates entirely locally on your device. It strictly performs the following actions:
1. Runs only on explicitly listed supported AI domains in the extension manifest.
2. Reads URL parameters from the current tab (such as `prompt`, `q`, `p`, and `autosend`) to identify the message and send behavior.
3. Injects prompt text into the page input field, and optionally triggers send when auto-send is enabled.
4. Keeps a short-lived in-memory cache of prompt parameters inside the extension background runtime (TTL up to about 3 minutes) to support SPA navigation handoff. This cache is not persisted to disk.
5. Stores per-platform enable/disable preferences in Chrome extension storage (`chrome.storage.sync`, or local fallback when sync is unavailable) so settings persist across sessions.

We **do not** collect, sell, or share user data with the developer or third-party data brokers, and we do not send any data to developer-owned servers.

When you use supported AI websites, your prompt is sent to that destination website as part of normal page usage (including optional auto-send behavior). This transmission is between your browser and the destination website.

**Contact**
If you have any questions about this privacy policy, please contact us via the Chrome Web Store support page.

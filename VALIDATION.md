# 1.0.2 validation — 2026-09-19

## Actual cause

The old XPI had `manifest.json`, `bootstrap.js`, and `core.js` at its root, valid ZIP CRCs, and the correct 10.0–10.0.* version range. The old builder did not validate Zotero-specific manifest requirements.

The installed Zotero 10.0.2 runtime (`omni.ja`, `modules/Extension.sys.mjs`, lines 1874–1883) explicitly emits `applications.zotero.update_url not provided` when this field is missing. `modules/XPIDatabase.sys.mjs` additionally accepts update URLs as secure only when they start with `https:` under default settings. An inline data URL is therefore not an acceptable fix.

The final fix adds an HTTPS update URL, bumps the version to 0.1.1, keeps the stable plugin ID, and keeps the 10.0.x range. There is no CPU-specific code or platform restriction in the XPI. No compatibility or update-security settings were disabled.

## Real installer check

Ran the installed Zotero 10.0.2 headlessly with a disposable profile and separate data directory. A test-only helper used `AddonManager.getInstallForFile()` on the original and rebuilt archives, then `install.install()` on the rebuilt archive. The helper was never bundled in the product XPI.

Observed results (also saved in `validation/zotero-install-result.json`):

| Check | Result |
| --- | --- |
| Original 0.1.0 | error -3, state 4: rejected |
| New 0.1.1 | error 0, state 3: ready to install |
| appDisabled | false |
| Active after installation | true |
| Science Lens reader listener registered | true |
| Listener removed after disabling | true |

The test used the actual Zotero bootstrap loader and loaded `core.js` from the installed XPI. It did not merely parse JSON or compare version strings. Runtime logs show ADDON_INSTALL startup and ADDON_DISABLE shutdown for Science Lens 0.1.1.

## Other checks

Six Python packaging tests passed: valid metadata, missing-update-URL regression, insecure update URLs, other required fields, nested archive rejection, reproducible build with byte-for-byte source matching. Existing JavaScript core tests and bootstrap syntax check passed. ZIP CRC and root-entry checks passed.

The headless process exited with status 139 during forced application quit, after the results above were written. Installation and plugin-disable assertions passed; clean application exit was not validated. The delivered XPI was also compared byte-for-byte with the XPI installed in the test profile and matched.

## Limits and update hosting

This verifies installation and lifecycle on the local Linux 64-bit Zotero 10.0.2 build. It does not independently test Windows/macOS or the complete visible PDF-selection workflow. The existing browser UI harness is a mocked-host test.

`https://science-lens.invalid/updates.json` is deliberately a reserved placeholder, not a hosted update service. Installation does not require fetching it. Updates remain manual, and explicit update checks can fail until the repository owner publishes `updates.json` and changes the manifest URL to their real HTTPS endpoint. This limitation is documented rather than claiming an unconfigured repository URL exists.

Official compatibility reference: https://www.zotero.org/support/dev/zotero_10_for_developers

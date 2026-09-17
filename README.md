# Science Lens · 0.1.0

A Wikipedia definition card for scientific terms selected in Zotero's PDF reader. Built for the installed Zotero **10.0.2**, with compatibility restricted to **10.0.x**. No API key or ChatGPT subscription is needed.

## Install

1. Save `science-lens-0.1.0.xpi` to your computer. Keep the `.xpi` extension; do not unzip it.
2. In Zotero, open **Tools → Plugins**.
3. Open the gear menu and choose **Install Plugin From File…**.
4. Select the XPI and accept Zotero's installation prompt. Restart Zotero if asked.
5. Open a PDF inside Zotero, select a short term, and click **Define · Wikipedia** in the selection popup.

A small card appears in the upper-right of the reader. It contains the article title, a concise extract, a thumbnail when Wikipedia provides one, and links to the article and image credits. **Other matches** lets you choose a different article. Use **Close** or **Escape** to dismiss the card.

The card remains visible when the original selection popup closes. A new lookup replaces the old card. This initial version works with a fresh text selection; clicking a previously saved highlight does not itself trigger a lookup. Scanned PDFs need selectable/OCR text.

## Try it

- Select `Utricularia reflexa`: expect a species definition. Wikipedia's summary returned no thumbnail for this species during testing; that is normal.
- Select `bladderwort`: expect the redirected title **Utricularia**, a genus definition, and a plant thumbnail if image loading succeeds.
- Select `Mercury`: inspect the result and use **Choose meaning** or **Other matches** to resolve ambiguity.
- Select an invented word: expect possible matches or a no-results message.
- Disconnect the network and select an uncached term: expect a connection message and **Retry**. Reconnect and retry.
- Start one lookup and quickly open another: the old response must not overwrite the newer card.
- Press Escape, reopen the card, then disable Science Lens in Tools → Plugins: the card and added buttons should disappear. Re-enable it and make a fresh selection.
- Try a separate PDF reader window, a narrow window, and dark mode.

If the button is missing, make a fresh selection of at most 160 characters and 16 words, verify the plugin is enabled, and reopen the PDF. For plugin errors, see **Help → Debug Output Logging** and Zotero's error console. Zotero 6–9 and later major versions are not declared compatible by this build.

## Behavior and privacy

Requests happen only when you click the lookup button, choose an alternative, or retry. The selected term/article title goes to English Wikipedia; the PDF, its surrounding paragraphs, library metadata, and annotations are not uploaded. Thumbnails load from Wikimedia. The plugin does not change your library or save annotations. Up to 100 summaries are cached in memory for one hour; disabling the plugin clears the cache. No analytics, accounts, paid service, or bundled AI is used.

“Possible scientific name” is a capitalization-and-two-word heuristic, not a verified taxonomic classification. Other phrases are labeled “Term lookup.” Common names rely on Wikipedia redirects and search. Abbreviated species names and ambiguous common names can require choosing an alternative. Wikipedia is a general reference, not a curated taxonomic authority. The matched article title is always visible.

Text is attributed to Wikipedia contributors under CC BY-SA 4.0, with an article link. Images retain their individual licenses; use **Image & credits** to check the original file page before reuse. Missing or failed images do not prevent the definition from appearing. No Wikipedia content is bundled in the installer.

## Validation

- Confirmed local installed version from the development environment’s application metadata: 10.0.2.
- Checked the reader event signature and listener cleanup against the installed Zotero source.
- Live REST checks: Utricularia reflexa and bladderwort; the latter redirects to Utricularia and includes a thumbnail URL.
- Automated core checks: input cleanup, scientific-name label, URL allowlists, extract truncation, redirects, bounded cache, Action API fallback, missing pages, disambiguation, search, and offline errors.
- Browser DOM integration checks with a mocked Zotero host: no request before clicking, card rendering, article links, Escape, offline/retry, and shutdown cleanup. Visually inspected the rendered card.
- Full installation and manual text selection in Zotero's visible PDF reader remain acceptance checks. The browser harness is not an end-to-end Zotero test.

## Source and extension points

`src/bootstrap.js` owns lifecycle and reader UI. It uses Zotero's supported `renderTextSelectionPopup` hook, `Zotero.HTTP.request`, and `Zotero.launchURL`.

`src/core.js` owns input handling and the Wikipedia adapter. The adapter first requests `/api/rest_v1/page/summary/{title}`. If REST fails, it uses the Action API with redirects, extracts, page images, and page properties. Search returns up to five article choices; it does not silently substitute the top search result.

To add NCBI, UniProt, PubChem, or an AI provider, implement `summary(term)`, `search(term)`, and `clear()` with the same plain-data result shape, then add an explicit provider selector to the card. The normalized record has `source`, `title`, `description`, `extract`, `url`, `thumbnail`, `imagePage`, and `ambiguous`. Each provider needs its own allowed domains, attribution, privacy disclosure, identifier resolution, and error handling. No future-source integrations or credential storage are included yet.

Remote strings are inserted as text, never HTML. Wikipedia links and Wikimedia thumbnail URLs are restricted to HTTPS and known hosts. Each card guards async responses against close/replacement. Listener and DOM cleanup run when disabled.

## Rebuild and test

With Python 3, run `python build.py` from this folder. This creates `dist/science-lens-0.1.0.xpi`, using only `src/` contents. With Node.js, run `node tests/core.test.cjs`. No package installation is required for those tests.

## References

- [Zotero reader extension API](https://www.zotero.org/support/dev/zotero_7_for_developers#custom_reader_event_handlers)
- [Zotero 10 compatibility guidance](https://www.zotero.org/support/dev/zotero_10_for_developers)
- [Wikimedia REST API](https://www.mediawiki.org/wiki/Wikimedia_REST_API)
- [Wikipedia text reuse terms](https://en.wikipedia.org/wiki/Wikipedia:Copyrights)

## Upload this repository to GitHub

Create an empty repository named `science-lens` (do not add a README or license on GitHub). Upload the **contents** of this directory into the repository root, so `README.md`, `build.py`, `src/`, and `tests/` appear at the top level. Keep `.github/workflows/build.yml` and `.gitignore`; hidden folders may not appear in your file picker.

For the complete folder, including hidden files, run these commands in this directory after replacing `YOUR-USERNAME`:

```sh
git init
git add .
git commit -m "Initial Science Lens plugin"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/science-lens.git
git push -u origin main
```

The included GitHub Actions workflow runs the tests and builds the XPI on pushes, pull requests, and manual runs. Download the `science-lens-plugin` artifact from the completed Actions run and unzip it to get the installable XPI. To distribute a version publicly, create a GitHub Release and attach that XPI. Releases are not published automatically.

The included installer is also available under `dist/` in the downloadable repository ZIP. Build output is ignored by Git, so attach it to a Release rather than committing it. Update the manifest author if desired; keep the plugin ID stable after distribution so updates replace the same plugin. Automatic update hosting is not configured.

## License

Plugin source code is available under the MIT license in `LICENSE`. Wikipedia text and Wikimedia images have separate licenses described above; the MIT license does not apply to them.

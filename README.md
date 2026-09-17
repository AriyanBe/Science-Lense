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


## References

- [Zotero reader extension API](https://www.zotero.org/support/dev/zotero_7_for_developers#custom_reader_event_handlers)
- [Zotero 10 compatibility guidance](https://www.zotero.org/support/dev/zotero_10_for_developers)
- [Wikimedia REST API](https://www.mediawiki.org/wiki/Wikimedia_REST_API)
- [Wikipedia text reuse terms](https://en.wikipedia.org/wiki/Wikipedia:Copyrights)


## License

Plugin source code is available under the MIT license in `LICENSE`. Wikipedia text and Wikimedia images have separate licenses described above; the MIT license does not apply to them.

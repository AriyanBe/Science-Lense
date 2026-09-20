var lensScope, provider, active = false;
var nodes = new Set();
var cards = new Map();
const EVENT = 'renderTextSelectionPopup';
function install() {}
function uninstall() {}
function startup({id, rootURI}) {
  lensScope = {URL, URLSearchParams};
  Services.scriptloader.loadSubScript(rootURI + 'core.js', lensScope);
  provider = new lensScope.ScienceLensCore.Wikipedia(async url => {
    const response = await Zotero.HTTP.request('GET', url, {
      responseType:'json', timeout:12000, headers:{Accept:'application/json'}
    });
    return response.response;
  });
  active = true;
  Zotero.Reader.registerEventListener(EVENT, selectionPopup, id);
}
function shutdown() {
  active = false;
  Zotero.Reader.unregisterEventListener(EVENT, selectionPopup);
  for (const close of [...cards.values()]) close();
  for (const node of nodes) node.remove();
  nodes.clear();
  provider?.clear();
  provider = null;
  lensScope = null;
}
function element(doc, tag, text, css = '') {
  const el = doc.createElementNS('http://www.w3.org/1999/xhtml', tag);
  if (text) el.textContent = text;
  el.style.cssText = css;
  return el;
}
function button(doc, text, fn) {
  const b = element(doc, 'button', text, 'padding:6px 10px;border:1px solid #9aa6a0;border-radius:6px;background:ButtonFace;color:ButtonText;cursor:pointer;font:inherit;');
  b.type = 'button';
  b.addEventListener('click', fn);
  return b;
}
function selectionPopup({doc, params, append}) {
  if (!active) return;
  for (const n of nodes) if (!n.isConnected) nodes.delete(n);
  const term = lensScope.ScienceLensCore.normalize(params.annotation?.text);
  if (!term || term.length > 160 || term.split(' ').length > 16) return;
  const b = button(doc, 'Define · Wikipedia', () => openCard(doc, term));
  b.title = 'Look up this term on English Wikipedia';
  b.addEventListener('mousedown', e => e.preventDefault());
  nodes.add(b);
  append(b);
}
function openCard(doc, term) {
  cards.get(doc)?.();
  const core = lensScope.ScienceLensCore;
  const source = provider;
  const previousFocus = doc.activeElement;
  const panel = element(doc, 'section', '', 'position:fixed;right:18px;top:58px;width:350px;max-width:calc(100vw - 36px);max-height:calc(100vh - 80px);overflow:auto;box-sizing:border-box;z-index:2147483647;padding:16px;border:1px solid #99aaa1;border-radius:12px;background:Canvas;color:CanvasText;box-shadow:0 8px 32px #0004;font:14px/1.5 system-ui,sans-serif;text-align:left;white-space:normal;');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Science Lens definition');
  panel.tabIndex = -1;
  let closed = false, revision = 0;
  function close() {
  closed = true;
  revision++;

  panel.remove();
  cards.delete(doc);

  doc.removeEventListener('keydown', keydown, true);
  doc.removeEventListener('mousedown', outsideClick, true);
  doc.defaultView.removeEventListener('unload', close);

  if (previousFocus?.isConnected) previousFocus.focus();
}
  function keydown(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    close();
  }
}
  function outsideClick(e) {
  if (!panel.contains(e.target)) {
    close();
  }
}
  const header = element(doc, 'div', '', 'display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px');
  header.append(element(doc,'strong','Science Lens'), button(doc,'Close',close));
  const label = element(doc, 'div', core.classify(term) + ' · ' + term, 'font-size:12px;opacity:.75;margin-bottom:10px;overflow-wrap:anywhere');
  const body = element(doc,'div'); body.setAttribute('aria-live','polite');
  const footer = element(doc,'div','', 'margin-top:14px;font-size:11px;opacity:.8');
  function link(text,url) {
    const a = element(doc,'a',text,'color:LinkText;text-decoration:underline;cursor:pointer');
    a.href = url;
    a.addEventListener('click', e => { e.preventDefault(); Zotero.launchURL(url); });
    return a;
  }
  footer.append('Source: Wikipedia contributors · ',link('CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/'),element(doc,'div','Only the lookup term is sent to Wikipedia. Images load from Wikimedia.'));
  panel.append(header,label,body,footer);
  doc.body.append(panel); cards.set(doc,close);
  doc.addEventListener('keydown',keydown,true);
  doc.addEventListener('mousedown', outsideClick, true);
  doc.defaultView.addEventListener('unload',close);
  panel.focus();
  const valid = token => active && !closed && revision === token;
  function errorState() {
    body.replaceChildren(element(doc,'p','Wikipedia could not be reached. Check your connection and try again.'));
    body.append(button(doc,'Retry',() => lookup(term)), ' ', link('Search Wikipedia', 'https://en.wikipedia.org/w/index.php?search=' + encodeURIComponent(term)));
  }
  async function choices(query) {
    const token = ++revision;
    body.replaceChildren(element(doc,'p','Finding possible matches…'));
    try {
      const titles = await source.search(query);
      if (!valid(token)) return;
      body.replaceChildren(element(doc,'p',titles.length ? 'Choose the article that fits your paper:' : 'No matching articles found. Try a different term.'));
      for (const title of titles) {
        const row = element(doc,'div','','margin:6px 0');
        row.append(button(doc,title,() => lookup(title))); body.append(row);
      }
      body.append(link('Search Wikipedia','https://en.wikipedia.org/w/index.php?search=' + encodeURIComponent(query)));
    } catch (_) { if (valid(token)) errorState(); }
  }
  async function lookup(query) {
    const token = ++revision;
    body.replaceChildren(element(doc,'p','Looking up “' + query + '”…'));
    try {
      const result = await source.summary(query);
      if (!valid(token)) return;
      if (!result) { await choices(query); return; }
      body.replaceChildren(element(doc,'h3',result.title,'margin:0 0 4px;font-size:19px;line-height:1.25'));
      if (result.description) body.append(element(doc,'div',result.description,'opacity:.7;font-size:12px;margin-bottom:10px'));
      if (result.thumbnail) {
        const img = element(doc,'img','','float:right;width:112px;max-height:140px;object-fit:contain;margin:4px 0 8px 12px;border-radius:6px');
        img.alt = result.title + ' — Wikipedia illustration'; img.referrerPolicy = 'no-referrer';
        img.addEventListener('error',() => img.remove()); img.src = result.thumbnail; body.append(img);
      }
      body.append(element(doc,'p',result.extract,'margin:10px 0;'));
      if (result.ambiguous) body.append(element(doc,'p','This term has several meanings. Choose an article below.','font-weight:600'));
      const links = element(doc,'div','','clear:both;margin:10px 0');
      links.append(link('Read full article ↗',result.url));
      if (result.thumbnail) links.append(' · ',link('Image & credits',result.imagePage || result.url));
      body.append(links,button(doc,result.ambiguous ? 'Choose meaning' : 'Other matches',() => choices(term)));
    } catch (_) { if (valid(token)) errorState(); }
  }
  void lookup(term);
}

/* Source adapters return plain data; they never render remote HTML. */
var ScienceLensCore = (() => {
  function normalize(text) {
    return String(text || '').normalize('NFKC').replace(/\u00ad/g, '')
      .replace(/\s+/g, ' ').replace(/^[\s“”"‘’']+|[\s“”"‘’',;:.!?]+$/g, '').trim();
  }
  function classify(term) {
    return /^[A-Z][a-z]{2,} [a-z][a-z-]{2,}$/.test(term)
      ? 'Possible scientific name' : 'Term lookup';
  }
  function safeURL(value, image = false) {
    try {
      const u = new URL(value);
      return u.protocol === 'https:' && (image ? ['upload.wikimedia.org', 'thumb.wikimedia.org'].includes(u.hostname)
        : u.hostname === 'en.wikipedia.org') ? u.href : null;
    } catch (_) { return null; }
  }
  function concise(text) {
    text = String(text || '').trim();
    if (text.length <= 620) return text;
    const cut = text.slice(0, 620);
    const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
    return end > 200 ? cut.slice(0, end + 1) : cut.slice(0, cut.lastIndexOf(' ')) + '…';
  }
  class Wikipedia {
    constructor(getJSON) { this.getJSON = getJSON; this.cache = new Map(); }
    async api(params) {
      const data = await this.getJSON('https://en.wikipedia.org/w/api.php?' + new URLSearchParams({
        action: 'query', format: 'json', formatversion: '2', ...params
      }));
      if (data.error) throw new Error('Wikipedia could not complete this request.');
      return data;
    }
    async search(term) {
      const data = await this.api({list:'search', srsearch:term, srnamespace:'0', srlimit:'5'});
      return (data.query?.search || []).map(p => p.title);
    }
    async summary(term) {
      const cached = this.cache.get(term);
      if (cached && Date.now() - cached.time < 3600000) return cached.value;
      let s;
      try {
        s = await this.getJSON('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(term.replace(/ /g, '_')));
      } catch (error) {
        // Action API also handles redirects and remains useful if REST is unavailable.
        const d = await this.api({titles:term, redirects:'1', prop:'extracts|pageimages|info|pageprops',
          exintro:'1', explaintext:'1', exsentences:'4', piprop:'thumbnail|name', pithumbsize:'240', inprop:'url'});
        const p = d.query?.pages?.[0];
        if (!p || p.missing || p.invalid) return null;
        s = {title:p.title, extract:p.extract, thumbnail:p.thumbnail,
          type:p.pageprops && 'disambiguation' in p.pageprops ? 'disambiguation' : 'standard',
          content_urls:{desktop:{page:p.fullurl}}, pageimage:p.pageimage};
      }
      if (!s?.title || !s.extract) return null;
      let file = s.pageimage;
      if (!file && s.originalimage?.source) {
        try { file = decodeURIComponent(new URL(s.originalimage.source).pathname.split('/').pop()); } catch (_) {}
      }
      const value = {source:'Wikipedia', title:s.title, description:s.description || '',
        extract:concise(s.extract), ambiguous:s.type === 'disambiguation',
        url:safeURL(s.content_urls?.desktop?.page) || 'https://en.wikipedia.org/wiki/' + encodeURIComponent(s.title.replace(/ /g, '_')),
        thumbnail:safeURL(s.thumbnail?.source, true),
        imagePage:file ? 'https://en.wikipedia.org/wiki/File:' + encodeURIComponent(file) : null};
      if (this.cache.size >= 100) this.cache.delete(this.cache.keys().next().value);
      this.cache.set(term, {time:Date.now(), value});
      return value;
    }
    clear() { this.cache.clear(); }
  }
  return {normalize, classify, safeURL, concise, Wikipedia};
})();
if (typeof module !== 'undefined') module.exports = ScienceLensCore;

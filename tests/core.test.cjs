const assert = require('node:assert/strict');
const C = require('../src/core.js');
async function main() {
  assert.equal(C.normalize(' “Utricularia\nreflexa.” '), 'Utricularia reflexa');
  assert.equal(C.normalize('blad\u00adderwort'), 'bladderwort');
  assert.equal(C.classify('Utricularia reflexa'), 'Possible scientific name');
  assert.equal(C.classify('bladderwort'), 'Term lookup');
  assert.equal(C.safeURL('javascript:alert(1)'), null);
  assert.equal(C.safeURL('https://en.wikipedia.org.evil.test/wiki/Test'), null);
  assert.equal(C.safeURL('https://upload.wikimedia.org/a.png',true),'https://upload.wikimedia.org/a.png');
  assert.equal(C.safeURL('https://thumb.wikimedia.org/a.jpg',true), 'https://thumb.wikimedia.org/a.jpg');
  assert(C.concise('word '.repeat(300)).length <= 621);
  let calls = 0;
  const p = new C.Wikipedia(async () => { calls++; return {title:'Utricularia',extract:'A genus of carnivorous plants.',thumbnail:{source:'javascript:bad'}}; });
  assert.equal((await p.summary('bladderwort')).title,'Utricularia');
  assert.equal((await p.summary('bladderwort')).thumbnail,null);
  assert.equal(calls,1);
  p.clear(); await p.summary('bladderwort'); assert.equal(calls,2);
  const fallback = new C.Wikipedia(async url => {
    if (url.includes('rest_v1')) throw Error('unavailable');
    return {query:{pages:[{title:'Mercury',extract:'Several meanings.',fullurl:'https://en.wikipedia.org/wiki/Mercury',pageprops:{disambiguation:''}}]}};
  });
  assert.equal((await fallback.summary('Mercury')).ambiguous,true);
  const missing = new C.Wikipedia(async url => {
    if (url.includes('rest_v1')) throw Error('404');
    return {query:{pages:[{missing:true}]}};
  });
  assert.equal(await missing.summary('nonexistent'),null);
  const offline = new C.Wikipedia(async () => {throw Error('offline')});
  await assert.rejects(offline.summary('test'),/offline/);
  const search = new C.Wikipedia(async () => ({query:{search:[{title:'Utricularia reflexa'}]}}));
  assert.deepEqual(await search.search('Utricularia'),['Utricularia reflexa']);
  console.log('PASS: normalization, labels, URL safety, truncation, redirects, cache, REST fallback, ambiguity, missing pages, offline errors, search');
}
main().catch(e => {console.error(e); process.exitCode=1;});

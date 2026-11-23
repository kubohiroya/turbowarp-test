import console from 'node:console';
import {cp, rm} from 'node:fs/promises';
import {URL} from 'node:url';

const root = new URL('../', import.meta.url);
const output = new URL('_site/', root);
await rm(output, {recursive: true, force: true});
await cp(new URL('docs/', root), output, {recursive: true});
await cp(new URL('dist/', root), new URL('dist/', output), {recursive: true});
console.log('GitHub Pages artifact: _site/');

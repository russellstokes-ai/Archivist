#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const compose=fs.readFileSync('compose.yaml','utf8');
const env=fs.readFileSync('.env.example','utf8');
for (const token of [
  'context: ./archivist',
  'dockerfile: Dockerfile',
  'ARCHIVIST_OPTIONS: /data/standalone-options.json',
  'archivist-data:/data',
  'target: /media',
  'read_only: true',
  'create_host_path: false',
  'no-new-privileges:true',
  'http://127.0.0.1:5056/healthz'
]) assert(compose.includes(token), 'standalone Docker contract missing '+token);
assert(compose.includes('${ARCHIVIST_MEDIA_PATH:?'), 'Media path must be explicitly set');
assert(compose.includes('${ARCHIVIST_BIND_ADDRESS:-127.0.0.1}'), 'HTTP port must be loopback-only by default');
assert(env.includes('ARCHIVIST_MEDIA_PATH='), 'Missing media-root configuration example');
assert(!/privileged:\s*true/.test(compose), 'Container must not be privileged');
const ignore=fs.readFileSync('.gitignore','utf8');
assert(ignore.split(/\r?\n/).includes('.env'), 'Local .env must be ignored');
assert(ignore.split(/\r?\n/).includes('compose.override.yaml'), 'Machine-specific Docker overrides must be ignored');
const nas=fs.readFileSync('deploy/nas/compose.volumes.yaml','utf8');
const nasEnv=fs.readFileSync('deploy/nas/nas.env.example','utf8');
for(const key of ['ARCHIVIST_AUDIO_HOST_PATH','ARCHIVIST_COMICS_HOST_PATH']){
  assert(nas.includes('${'+key+':?'), 'NAS profile must require '+key);
  assert(nasEnv.includes(key+'='), 'NAS example must describe '+key);
}
for(const token of ['/extra-media/audiobooks','/extra-media/comics','read_only: true','create_host_path: false']){
  assert(nas.includes(token), 'NAS multi-volume contract missing '+token);
}
assert(ignore.split(/\r?\n/).includes('deploy/nas/nas.env'), 'Machine-local NAS paths must not be committed');
console.log('PASS: standalone Archivist container uses shared source, persistent data, readonly media and safe default binding');

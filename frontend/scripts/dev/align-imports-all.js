#!/usr/bin/env node
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dirs = ['app', 'components', 'hooks', 'lib', 'utils'];

function findFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(fullPath));
    } else if (/\.tsx?$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = dirs.flatMap(findFiles);

if (files.length === 0) {
  console.log('No files found.');
  process.exit(0);
}

const script = path.join(__dirname, 'align-imports.js');
execFileSync('node', [script, ...files], { stdio: 'inherit' });

#!/usr/bin/env node

/**
 * remove-comments.js
 * Removes all comments from code files except those containing TODO, FIXME, or placeholder.
 */

const fs = require('fs');
const path = require('path');

const CODE_EXTS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.py',
  '.java',
  '.go',
  '.c',
  '.cpp',
  '.h',
  '.cs',
  '.rs',
  '.rb',
  '.php',
  '.html',
  '.css',
  '.scss',
  '.sass',
]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build', 'out'].includes(entry.name))
        continue;
      walk(fullPath);
    } else if (CODE_EXTS.has(path.extname(fullPath))) {
      processFile(fullPath);
    }
  }
}

function processFile(file) {
  const ext = path.extname(file);
  let content = fs.readFileSync(file, 'utf8');

  if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
    try {
      const recast = require('recast');
      const parser = require('@babel/parser');
      const ast = recast.parse(content, {
        parser: {
          parse(src) {
            return parser.parse(src, {
              sourceType: 'module',
              plugins: [
                'jsx',
                'typescript',
                'classProperties',
                'decorators-legacy',
                'objectRestSpread',
                'optionalChaining',
                'nullishCoalescingOperator',
              ],
              allowReturnOutsideFunction: true,
              allowSuperOutsideMethod: true,
              tokens: true,
              attachComment: true,
            });
          },
        },
      });
      recast.visit(ast, {
        visitComment(path) {
          const value = path.value.value || '';
          if (!/TODO|FIXME|placeholder/i.test(value)) {
            path.prune();
          }
          this.traverse(path);
        },
      });
      content = recast.print(ast).code;
      fs.writeFileSync(file, content, 'utf8');
      return;
    } catch (err) {}
  }

  // Fallback: remove non-TODO/FIXME/placeholder comments line-based
  const lines = content.split(/\r?\n/);
  const result = [];
  let inBlock = false;
  let buffer = [];
  for (let line of lines) {
    if (inBlock) {
      buffer.push(line);
      if (line.includes('*/')) {
        inBlock = false;
        const text = buffer.join('\n');
        if (/TODO|FIXME|placeholder/i.test(text)) {
          result.push(text);
        }
        buffer = [];
      }
      continue;
    }
    if (line.includes('/*')) {
      if (line.includes('*/')) {
        const comments = line.match(/\/\*[\s\S]*?\*\//g);
        if (comments) {
          const keep = comments.some((c) => /TODO|FIXME|placeholder/i.test(c));
          if (!keep) {
            line = line.replace(/\/\*[\s\S]*?\*\//g, '');
          }
        }
      } else {
        inBlock = true;
        buffer = [line];
        continue;
      }
    }
    if (line.includes('//')) {
      const idx = line.indexOf('//');
      const comment = line.substring(idx + 2);
      // Only keep comment if it has TODO/FIXME/placeholder
      if (/TODO|FIXME|placeholder/i.test(comment)) {
        result.push(line);
        continue;
      } else {
        // If the comment is just a URL (e.g. // https://foo.com), remove it
        // If the code before the comment contains a URL, do NOT remove it
        const codePart = line.substring(0, idx);
        const urlRegex = /https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+/g;
        // If codePart contains a URL, keep the whole line
        if (urlRegex.test(codePart)) {
          result.push(line);
          continue;
        }
        // Otherwise, remove the comment
        line = codePart;
      }
    }
    result.push(line);
  }
  fs.writeFileSync(file, result.join('\n'), 'utf8');
}

try {
  walk(path.resolve(__dirname, '..'));
  console.log('Comments removed (except TODO, FIXME, placeholder).');
} catch (err) {
  console.error('Error removing comments:', err);
  process.exit(1);
}

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const postcss = require('postcss');

const cssPath = path.resolve(__dirname, '../src/index.css');

function getRootDeclarations() {
  const css = fs.readFileSync(cssPath, 'utf8');
  const root = postcss.parse(css, { from: cssPath });
  const declarations = new Set();

  root.walkRules(':root', (rule) => {
    rule.walkDecls((decl) => declarations.add(decl.prop));
  });

  return declarations;
}

function getRuleDeclarations(selector) {
  const css = fs.readFileSync(cssPath, 'utf8');
  const root = postcss.parse(css, { from: cssPath });
  const declarations = new Set();

  root.walkRules(selector, (rule) => {
    rule.walkDecls((decl) => declarations.add(decl.prop));
  });

  return declarations;
}

test('global index.css parses as valid CSS', () => {
  assert.doesNotThrow(() => getRootDeclarations());
});

test('global index.css defines required theme variables', () => {
  const declarations = getRootDeclarations();

  for (const prop of [
    '--bg',
    '--surface',
    '--surface2',
    '--surface3',
    '--accent',
    '--accent-dim',
    '--green',
    '--red',
    '--amber',
    '--blue',
    '--text1',
    '--text2',
    '--text3',
    '--border',
    '--border2',
  ]) {
    assert.ok(declarations.has(prop), `missing ${prop}`);
  }
});

test('global index.css defines both light and dark theme selectors', () => {
  const css = fs.readFileSync(cssPath, 'utf8');

  assert.match(css, /\[data-theme=['"]dark['"]\]/);
  assert.match(css, /\[data-theme=['"]light['"]\]/);
});

test('light theme defines the extended semantic palette used by the UI', () => {
  const declarations = getRuleDeclarations("[data-theme='light']");

  for (const prop of [
    '--accent-light',
    '--green-dim',
    '--red-dim',
    '--blue-dim',
    '--bg-glow',
    '--scrollbar-thumb',
    '--scrollbar-thumb-hover',
    '--card-shadow',
    '--button-text',
  ]) {
    assert.ok(declarations.has(prop), `missing ${prop} in light theme`);
  }
});

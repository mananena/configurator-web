/**
 * Tests for generate-iframe-styles.ts
 * 
 * Run: npm run test:scripts
 */

import {
  extractStylesFromVue,
  extractStylesFromCSS,
  minifyCSS,
  escapeForTemplateLiteral,
  generateStyles,
  generateOutputContent,
  main,
  type FileSystem,
} from './generate-iframe-styles.js';

// Simple test runner
let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error instanceof Error ? error.message : error}`);
    failed++;
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(
      message || `Expected "${expected}" but got "${actual}"`
    );
  }
}

function assertContains(str: string, substring: string, message?: string) {
  if (!str.includes(substring)) {
    throw new Error(
      message || `Expected string to contain "${substring}"`
    );
  }
}

// Tests for extractStylesFromVue
test('extractStylesFromVue: extracts single style block', () => {
  const vue = `
    <template><div></div></template>
    <script>export default {}</script>
    <style>
      .foo { color: red; }
    </style>
  `;
  const result = extractStylesFromVue(vue);
  assertContains(result, '.foo { color: red; }');
});

test('extractStylesFromVue: extracts multiple style blocks', () => {
  const vue = `
    <template><div></div></template>
    <style>.foo { color: red; }</style>
    <style scoped>.bar { color: blue; }</style>
  `;
  const result = extractStylesFromVue(vue);
  assertContains(result, '.foo { color: red; }');
  assertContains(result, '.bar { color: blue; }');
});

test('extractStylesFromVue: returns empty string when no styles', () => {
  const vue = `<template><div></div></template>`;
  const result = extractStylesFromVue(vue);
  assertEqual(result, '');
});

// Tests for extractStylesFromCSS
test('extractStylesFromCSS: returns content unchanged', () => {
  const css = '.foo { color: red; }';
  const result = extractStylesFromCSS(css);
  assertEqual(result, css);
});

// Tests for minifyCSS
test('minifyCSS: removes comments', () => {
  const css = '/* comment */ .foo { color: red; }';
  const result = minifyCSS(css);
  assertEqual(result.includes('comment'), false);
});

test('minifyCSS: removes extra whitespace', () => {
  const css = '.foo   {   color:   red;   }';
  const result = minifyCSS(css);
  assertEqual(result, '.foo{color:red}');
});

test('minifyCSS: removes newlines', () => {
  const css = `.foo {
    color: red;
    background: blue;
  }`;
  const result = minifyCSS(css);
  assertEqual(result.includes('\n'), false);
});

test('minifyCSS: removes trailing semicolons before braces', () => {
  const css = '.foo { color: red; }';
  const result = minifyCSS(css);
  assertEqual(result, '.foo{color:red}');
});

// Tests for escapeForTemplateLiteral
test('escapeForTemplateLiteral: escapes backticks', () => {
  const str = 'content with `backticks`';
  const result = escapeForTemplateLiteral(str);
  assertEqual(result, 'content with \\`backticks\\`');
});

test('escapeForTemplateLiteral: escapes dollar signs', () => {
  const str = 'content with $variable';
  const result = escapeForTemplateLiteral(str);
  assertEqual(result, 'content with \\$variable');
});

// Tests for generateStyles with mock filesystem
test('generateStyles: combines styles from multiple files', () => {
  const mockFs: FileSystem = {
    readFile: (path: string) => {
      if (path.includes('global.css')) {
        return '.global { color: red; }';
      }
      if (path.includes('Button.vue')) {
        return '<template></template><style>.button { color: blue; }</style>';
      }
      return '';
    },
    writeFile: () => {},
    exists: () => true,
  };
  
  const result = generateStyles('/src', ['global.css', 'Button.vue'], mockFs);
  assertContains(result, '.global { color: red; }');
  assertContains(result, '.button { color: blue; }');
});

test('generateStyles: skips missing files', () => {
  const mockFs: FileSystem = {
    readFile: () => '.foo { color: red; }',
    writeFile: () => {},
    exists: (path: string) => !path.includes('missing'),
  };
  
  const result = generateStyles('/src', ['exists.css', 'missing.css'], mockFs);
  assertContains(result, '.foo');
});

// Tests for generateOutputContent
test('generateOutputContent: generates valid TypeScript', () => {
  const result = generateOutputContent('.foo{color:red}');
  assertContains(result, 'export const IFRAME_STYLES');
  assertContains(result, '.foo{color:red}');
  assertContains(result, 'AUTO-GENERATED');
});

// Tests for main function with mock filesystem
test('main: generates output file', () => {
  let writtenPath = '';
  let writtenContent = '';
  
  const mockFs: FileSystem = {
    readFile: (path: string) => {
      if (path.includes('.css')) {
        return '.global { color: red; }';
      }
      if (path.includes('.vue')) {
        return '<style>.component { color: blue; }</style>';
      }
      return '';
    },
    writeFile: (path: string, content: string) => {
      writtenPath = path;
      writtenContent = content;
    },
    exists: () => true,
  };
  
  const result = main('/test/src', '/test/output.ts', mockFs);
  
  assertEqual(result.outputPath, '/test/output.ts');
  assertEqual(writtenPath, '/test/output.ts', 'writtenPath should match outputPath');
  assertEqual(result.rawSize > 0, true, 'rawSize should be > 0');
  assertEqual(result.minifiedSize > 0, true, 'minifiedSize should be > 0');
  assertEqual(result.minifiedSize <= result.rawSize, true, 'minified should be <= raw');
  assertContains(writtenContent, 'IFRAME_STYLES');
});

// Summary
console.log('\n-------------------');
console.log(`Tests: ${passed + failed} total, ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
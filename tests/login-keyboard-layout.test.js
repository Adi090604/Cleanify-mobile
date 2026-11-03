const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const loginSource = fs.readFileSync(path.join(projectRoot, 'app', 'login.js'), 'utf8');

test('login content remains keyboard-aware and scrollable', () => {
  assert.match(loginSource, /<KeyboardAvoidingView[\s\S]*?<ScrollView/);
  assert.match(loginSource, /behavior=\{Platform\.OS === 'ios' \? 'padding' : 'height'\}/);
  assert.match(loginSource, /contentContainerStyle=\{styles\.scrollContent\}/);
  assert.match(loginSource, /keyboardShouldPersistTaps="handled"/);
  assert.match(loginSource, /keyboardDismissMode=\{Platform\.OS === 'ios' \? 'interactive' : 'on-drag'\}/);
  assert.match(loginSource, /scrollContent:\s*\{[\s\S]*?flexGrow: 1,[\s\S]*?paddingBottom: 32/);
});

test('login fields and actions remain inside the scrollable content', () => {
  const scrollContent = loginSource.match(/<ScrollView[\s\S]*?<\/ScrollView>/)?.[0] ?? '';

  for (const content of ['Email address', 'Password', 'Forgot Password?', 'Sign In']) {
    assert.match(scrollContent, new RegExp(content.replace('?', '\\?')));
  }

  assert.match(loginSource, /onPress=\{handleLogin\}/);
  assert.match(loginSource, /api\.post\('\/auth\/login'/);
});

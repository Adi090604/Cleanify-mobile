const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');

const signupSource = readFileSync(join(__dirname, '..', 'app', 'signup.js'), 'utf8');

test('signup collects a required mobile number with a telephone keyboard', () => {
  assert.match(signupSource, /<Text style=\{styles\.label\}>Mobile number<\/Text>/);
  assert.match(signupSource, /placeholder="09171234567 or \+639171234567"/);
  assert.match(signupSource, /keyboardType="phone-pad"/);
  assert.match(signupSource, /autoComplete="tel"/);
  assert.match(signupSource, /textContentType="telephoneNumber"/);
});

test('signup submits the trimmed phone and displays backend phone errors', () => {
  assert.match(signupSource, /phone: phone\.trim\(\)/);
  assert.match(signupSource, /firstError\(errors, 'phone'\)/);
  assert.match(signupSource, /onChangeText=\{updateField\('phone', setPhone\)\}/);
});
